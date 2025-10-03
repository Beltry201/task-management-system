const Joi = require('joi');

/**
 * Joi validation schemas for task operations
 */

// Create task validation schema
const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(255).trim().required(),
  description: Joi.string().max(2000).optional().allow(''),
  status: Joi.string().valid('pending', 'in_progress', 'completed').optional().default('pending'),
  priority: Joi.string().valid('low', 'medium', 'high').optional().default('medium'),
  dueDate: Joi.date().iso().optional().allow(null),
  assignedTo: Joi.string().guid({ version: 'uuidv4' }).optional().allow(null)
});

// Update task validation schema
const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(255).trim().optional(),
  description: Joi.string().max(2000).optional().allow(''),
  status: Joi.string().valid('pending', 'in_progress', 'completed').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  dueDate: Joi.date().iso().optional().allow(null),
  assignedTo: Joi.string().guid({ version: 'uuidv4' }).optional().allow(null)
});

// Task query parameters validation schema
const taskQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  status: Joi.string().valid('pending', 'in_progress', 'completed').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  assignedTo: Joi.string().guid({ version: 'uuidv4' }).optional(),
  sortBy: Joi.string().valid('createdAt', 'dueDate', 'priority', 'status').optional().default('createdAt'),
  order: Joi.string().valid('asc', 'desc').optional().default('desc')
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema
};
