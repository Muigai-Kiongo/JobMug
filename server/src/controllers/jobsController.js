const Job = require('../models/job');
const Notification = require('../models/notification');
const { createJobSchema, updateJobSchema } = require('../validators/jobValidator');
const Joi = require('joi');

// Helper: build filter (unchanged)
function buildFilter(query) {
  const filter = {};
  if (query.q) {
    filter.$text = { $search: query.q };
  }
  if (query.location) {
    filter.location = new RegExp(query.location, 'i');
  }
  if (query.type) {
    filter.type = query.type;
  }
  if (query.remote === 'true') {
    filter.isRemote = true;
  } else if (query.remote === 'false') {
    filter.isRemote = false;
  }
  if (query.tag) {
    filter.tags = query.tag;
  }
  return filter;
}

// Simple matching algorithm: compare job.requirements and job.tags to applicant skills and resumeText
function computeMatch(job, applicantSkills = [], resumeText = '') {
  const jobKeywords = new Set();
  (job.requirements || []).forEach(r => {
    if (typeof r === 'string') r.split(/\W+/).forEach(t => t && jobKeywords.add(t.toLowerCase()));
  });
  (job.tags || []).forEach(t => t && jobKeywords.add(String(t).toLowerCase()));
  (job.title || '').split(/\W+/).forEach(t => t && jobKeywords.add(t.toLowerCase()));

  const skillSet = new Set((applicantSkills || []).map(s => s.toLowerCase()));
  const resumeWords = new Set((resumeText || '').toLowerCase().split(/\W+/).filter(Boolean));

  const matchedSkills = [];
  let matches = 0;
  jobKeywords.forEach(k => {
    if (skillSet.has(k)) {
      matches++;
      matchedSkills.push(k);
    } else if (resumeWords.has(k)) {
      matches++;
      matchedSkills.push(k);
    }
  });

  // Score normalized to 0..100
  const possible = Math.max(1, jobKeywords.size);
  const score = Math.min(100, Math.round((matches / possible) * 100));
  // dedupe matchedSkills
  const uniqueMatched = Array.from(new Set(matchedSkills));
  return { score, matchedSkills: uniqueMatched };
}

// Create job (unchanged except postedBy)
async function createJob(req, res, next) {
  try {
    const { error, value } = createJobSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const payload = { ...value, postedBy: req.user._id };
    if (!payload.company && req.user.company) payload.company = req.user.company;

    const job = new Job(payload);
    await job.save();
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
}

// List jobs (unchanged)
async function getJobs(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;

    const filter = buildFilter(req.query);
    const sort = req.query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const [items, total] = await Promise.all([
      Job.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Job.countDocuments(filter)
    ]);

    res.json({
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: items
    });
  } catch (err) {
    next(err);
  }
}

// Get job by id (unchanged)
async function getJobById(req, res, next) {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name email company');
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    next(err);
  }
}

// Update job (unchanged)
async function updateJob(req, res, next) {
  try {
    const { error, value } = updateJobSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    if (req.user.role !== 'admin' && !job.postedBy.equals(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden: cannot update job' });
    }

    Object.assign(job, value);
    await job.save();
    res.json(job);
  } catch (err) {
    next(err);
  }
}

// Delete job (unchanged)
async function deleteJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    if (req.user.role !== 'admin' && !job.postedBy.equals(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden: cannot delete job' });
    }

    await job.remove();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// Request body validator for applying
const applySchema = Joi.object({
  coverLetter: Joi.string().max(2000).optional().allow(''),
  resumeUrl: Joi.string().uri().optional().allow(''),
  resumeText: Joi.string().optional().allow(''),
  skills: Joi.array().items(Joi.string()).optional()
});

// Apply to job (now creates an application subdoc with match score and notifies recruiter)
async function applyToJob(req, res, next) {
  try {
    const { error, value } = applySchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    if (req.user.role !== 'seeker') {
      return res.status(403).json({ error: 'Only seekers can apply to jobs' });
    }

    // Prevent duplicate application by same user
    const already = job.applications.some(a => a.applicant.equals(req.user._id));
    if (already) return res.status(400).json({ error: 'You have already applied to this job' });

    // Determine applicant skills snapshot: prefer provided skills, else user profile skills
    const applicantSkills = (value.skills && value.skills.length) ? value.skills : (req.user.skills || []);

    // Compute match
    const { score, matchedSkills } = computeMatch(job, applicantSkills, value.resumeText || '');

    const application = {
      applicant: req.user._id,
      coverLetter: value.coverLetter,
      resumeUrl: value.resumeUrl,
      resumeText: value.resumeText,
      skills: applicantSkills,
      matchScore: score,
      matchedSkills
    };

    job.applications.push(application);
    await job.save();

    // Create notification for recruiter (job.postedBy)
    try {
      const notif = new Notification({
        user: job.postedBy,
        type: 'application',
        title: `New application for ${job.title}`,
        body: `${req.user.name} has applied for ${job.title}. Match: ${score}%`,
        link: `/jobs/${job._id}/applicants`,
        meta: { jobId: job._id, applicantId: req.user._id, matchScore: score }
      });
      await notif.save();

      // Optionally trigger email here if SMTP is configured (handled by notif controller or mailer)
    } catch (nerr) {
      // non-fatal
      console.error('Failed to create notification:', nerr);
    }

    res.status(201).json({ message: 'Application submitted', matchScore: score, matchedSkills });
  } catch (err) {
    next(err);
  }
}

// Recruiter can list applicants for their job, with match info and optional sorting by match score
async function listApplicants(req, res, next) {
  try {
    const job = await Job.findById(req.params.id).populate('applications.applicant', 'name email bio skills resumeUrl');
    if (!job) return res.status(404).json({ error: 'Job not found' });

    if (req.user.role !== 'admin' && !job.postedBy.equals(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden: cannot view applicants' });
    }

    // Optionally sort by match score if query.sort=match
    let applicants = job.applications.map(a => ({
      id: a._id,
      applicant: a.applicant,
      coverLetter: a.coverLetter,
      resumeUrl: a.resumeUrl,
      skills: a.skills,
      matchScore: a.matchScore,
      matchedSkills: a.matchedSkills,
      status: a.status,
      appliedAt: a.appliedAt
    }));

    if (req.query.sort === 'match') {
      applicants = applicants.sort((x, y) => (y.matchScore || 0) - (x.matchScore || 0));
    }

    res.json({ jobId: job._id, title: job.title, applicants });
  } catch (err) {
    next(err);
  }
}

// Endpoint to update application status (recruiter or admin)
async function updateApplicationStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!['applied', 'reviewing', 'rejected', 'hired'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    if (req.user.role !== 'admin' && !job.postedBy.equals(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const app = job.applications.id(req.params.appId);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    app.status = status;
    await job.save();

    // Create notification to applicant about status change
    try {
      const notif = new Notification({
        user: app.applicant,
        type: 'status_change',
        title: `Application status updated: ${status}`,
        body: `Your application for ${job.title} is now "${status}"`,
        link: `/jobs/${job._id}`,
        meta: { jobId: job._id, applicationId: app._id, status }
      });
      await notif.save();
    } catch (nerr) {
      console.error('Failed to create status notification:', nerr);
    }

    res.json({ message: 'Status updated' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  applyToJob,
  listApplicants,
  updateApplicationStatus
};