const express = require('express');
const router = express.Router();
const controller = require('../controllers/jobsController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// Public listing and read
router.get('/', controller.getJobs);
router.get('/:id', controller.getJobById);

// Recruiters (and admin) create jobs
router.post('/', authenticate, authorizeRoles('recruiter', 'admin'), controller.createJob);

// Update/delete - only recruiter who posted or admin
router.put('/:id', authenticate, authorizeRoles('recruiter', 'admin'), controller.updateJob);
router.delete('/:id', authenticate, authorizeRoles('recruiter', 'admin'), controller.deleteJob);

// Seekers apply to job
router.post('/:id/apply', authenticate, authorizeRoles('seeker'), controller.applyToJob);

// Recruiter can view applicants for their job
router.get('/:id/applicants', authenticate, authorizeRoles('recruiter', 'admin'), controller.listApplicants);

module.exports = router;