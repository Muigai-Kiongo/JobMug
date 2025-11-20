const Notification = require('../models/notification');
const nodemailer = require('nodemailer');

async function listNotifications(req, res, next) {
  try {
    const items = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    notif.read = true;
    await notif.save();
    res.json({ message: 'Marked read' });
  } catch (err) {
    next(err);
  }
}

// Optional helper: send email if SMTP configured (used elsewhere)
async function sendEmail({ to, subject, text, html }) {
  if (!process.env.SMTP_HOST) return;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    } : undefined
  });

  await transporter.sendMail({
    from: process.env.NOTIFICATIONS_EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html
  });
}

module.exports = { listNotifications, markRead, sendEmail };