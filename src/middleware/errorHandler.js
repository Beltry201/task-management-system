const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Centralized error handling middleware with logging
 */
const errorHandler = (err, req, res, next) => {
  logger.logError(err, req, {
    body: req.body,
    query: req.query,
    params: req.params
  });

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    // JWT errors
    statusCode = 401;
    message = 'Invalid or expired token';
  } else if (err.name === 'ValidationError' || err.name === 'SequelizeValidationError') {
    // Validation errors
    statusCode = 400;
    message = err.message;
  } else if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
    // Database connection errors
    statusCode = 500;
    message = 'Database connection error';
  }

  const response = {
    success: false,
    error: message
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
