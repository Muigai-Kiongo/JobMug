const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const controller = require('../controllers/profileController');

// GET /api/profile
router.get('/', authenticate, controller.getProfile);

// PUT /api/profile
router.put('/', authenticate, controller.updateProfile);

module.exports = router;