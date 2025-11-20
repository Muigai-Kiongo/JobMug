const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const controller = require('../controllers/notificationsController');

router.get('/', authenticate, controller.listNotifications);
router.post('/:id/read', authenticate, controller.markRead);

module.exports = router;