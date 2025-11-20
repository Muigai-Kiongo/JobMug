const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // who receives
  type: { type: String, required: true }, // e.g., 'application', 'status_change'
  title: { type: String },
  body: { type: String },
  link: { type: String }, // optional URL (frontend link)
  read: { type: Boolean, default: false },
  meta: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema);