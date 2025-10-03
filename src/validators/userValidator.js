const Joi = require('joi');

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  phoneNumber: Joi.string().max(50).optional().allow(null).allow(''),
  address: Joi.object({
    addressLine1: Joi.string().max(255).optional().allow(''),
    addressLine2: Joi.string().max(255).optional().allow(''),
    city: Joi.string().max(100).optional().allow(''),
    stateOrProvince: Joi.string().max(100).optional().allow(''),
    postalCode: Joi.string().max(20).optional().allow(''),
    country: Joi.string().max(100).optional().allow('')
  }).optional(),
  role: Joi.string().valid('admin', 'user').optional().default('user')
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).optional(),
  email: Joi.string().email().optional(),
  phoneNumber: Joi.string().max(50).optional().allow(null).allow(''),
  address: Joi.object({
    addressLine1: Joi.string().max(255).optional().allow(''),
    addressLine2: Joi.string().max(255).optional().allow(''),
    city: Joi.string().max(100).optional().allow(''),
    stateOrProvince: Joi.string().max(100).optional().allow(''),
    postalCode: Joi.string().max(20).optional().allow(''),
    country: Joi.string().max(100).optional().allow('')
  }).optional(),
  role: Joi.string().valid('admin', 'user').optional()
}).min(1);

const userQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  role: Joi.string().valid('admin', 'user').optional(),
  sortBy: Joi.string().valid('createdAt', 'name', 'email').optional().default('createdAt'),
  order: Joi.string().valid('asc', 'desc').optional().default('desc')
});

const assignTaskSchema = Joi.object({
  userId: Joi.string().guid({ version: 'uuidv4' }).required()
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
  assignTaskSchema
};
