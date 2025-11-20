const User = require('../models/user');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const { signToken } = require('../middleware/auth');

async function register(req, res, next) {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const existing = await User.findOne({ email: value.email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const user = new User(value);
    await user.save();

    const token = signToken(user);
    res.status(201).json({ token, user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const user = await User.findOne({ email: value.email.toLowerCase() });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const match = await user.comparePassword(value.password);
    if (!match) return res.status(400).json({ error: 'Invalid email or password' });

    const token = signToken(user);
    res.json({ token, user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    res.json(req.user);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };