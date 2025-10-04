const Joi = require('joi');

/**
 * Joi validation schemas for authentication
 */

// Address schema
const addressSchema = Joi.object({
  addressLine1: Joi.string().optional(),
  addressLine2: Joi.string().optional(),
  city: Joi.string().optional(),
  stateOrProvince: Joi.string().optional(),
  postalCode: Joi.string().optional(),
  country: Joi.string().optional()
});

// Registration validation schema
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  phoneNumber: Joi.string().optional(),
  address: addressSchema.optional(),
  role: Joi.string().valid('admin', 'user').optional().default('user')
});

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

module.exports = {
  registerSchema,
  loginSchema
};
