const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().max(200).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('seeker', 'recruiter').optional(),
  company: Joi.when('role', { is: 'recruiter', then: Joi.string().max(200).required(), otherwise: Joi.forbidden() }),
  bio: Joi.string().max(1000).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

module.exports = { registerSchema, loginSchema };