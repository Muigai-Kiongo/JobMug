const Joi = require('joi');

const salarySchema = Joi.object({
  min: Joi.number().min(0).optional(),
  max: Joi.number().min(0).optional()
}).optional();

const createJobSchema = Joi.object({
  title: Joi.string().max(200).required(),
  company: Joi.string().max(200).required(),
  location: Joi.string().max(200).optional(),
  isRemote: Joi.boolean().optional(),
  type: Joi.string().valid('full-time', 'part-time', 'contract', 'internship', 'temporary').optional(),
  salaryRange: salarySchema,
  description: Joi.string().optional().allow(''),
  responsibilities: Joi.array().items(Joi.string()).optional(),
  requirements: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  applyUrl: Joi.string().uri().optional(),
  expiresAt: Joi.date().optional()
});

const updateJobSchema = createJobSchema.min(1);

module.exports = { createJobSchema, updateJobSchema };