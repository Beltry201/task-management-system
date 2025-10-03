const AppError = require('../utils/AppError');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Validate request body against schema
      const { error, value } = schema.validate(req.body);

      if (error) {
        // Throw error with validation message
        throw new AppError(error.details[0].message, 400);
      }

      // Replace req.body with validated value
      req.body = value;

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = validateRequest;
