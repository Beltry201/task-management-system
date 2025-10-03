const AppError = require('../utils/AppError');

/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error to console with stack trace
  console.error('Error:', err.stack);

  // Set default status code and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
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

  // Prepare error response
  const response = {
    success: false,
    error: message
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
