const User = require('../models/user');

async function getProfile(req, res, next) {
  try {
    // return current user
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const allowed = ['name', 'company', 'bio', 'skills', 'headline', 'location', 'resumeUrl', 'phone'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile };