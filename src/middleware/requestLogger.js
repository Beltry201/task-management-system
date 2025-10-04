const logger = require('../utils/logger');

/**
 * Request logging middleware
 * Tracks route performance and request details
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;
    logger.logRequest(req, res, duration);
    originalEnd.apply(this, args);
  };

  next();
};

module.exports = requestLogger;
