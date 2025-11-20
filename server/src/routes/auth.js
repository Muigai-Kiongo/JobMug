const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', controller.register);

// POST /api/auth/login
router.post('/login', controller.login);

// GET /api/auth/me
router.get('/me', authenticate, controller.me);

module.exports = router;