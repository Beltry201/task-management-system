const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const env = require('../config/env');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new AppError('Invalid or expired token', 401));
    } else {
      next(error);
    }
  }
};

/**
 * Authorize middleware - checks user permissions
 * @param {Array} allowedRoles - Array of allowed roles
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AppError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticate,
  authorize
};
