const mongoose = require('mongoose');

const SalaryRangeSchema = new mongoose.Schema({
  min: { type: Number, default: 0 },
  max: { type: Number, default: 0 }
}, { _id: false });

const ApplicationSchema = new mongoose.Schema({
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverLetter: { type: String },
  resumeUrl: { type: String },
  resumeText: { type: String }, // optional extracted/posted resume text
  skills: { type: [String], default: [] }, // snapshot of applicant skills
  // matching metadata
  matchScore: { type: Number, default: 0 },
  matchedSkills: { type: [String], default: [] },
  status: { type: String, enum: ['applied', 'reviewing', 'rejected', 'hired'], default: 'applied' },
  appliedAt: { type: Date, default: Date.now },
  notified: { type: Boolean, default: false } // whether recruiter was notified
}, { timestamps: true });

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  company: { type: String, required: true, index: true },
  location: { type: String, default: 'Remote' },
  isRemote: { type: Boolean, default: false },
  type: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship', 'temporary'], default: 'full-time' },
  salaryRange: { type: SalaryRangeSchema, default: () => ({}) },
  description: { type: String },
  responsibilities: { type: [String], default: [] },
  requirements: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  applyUrl: { type: String },
  postedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },

  // Who posted the job (recruiter)
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Applications from seekers (embedded)
  applications: { type: [ApplicationSchema], default: [] }
}, {
  timestamps: true
});

JobSchema.index({ title: 'text', company: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Job', JobSchema);