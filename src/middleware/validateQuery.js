const AppError = require('../utils/AppError');

/**
 * Query validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.query);

      if (error) {
        throw new AppError(error.details[0].message, 400);
      }

      req.query = value;

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = validateQuery;
