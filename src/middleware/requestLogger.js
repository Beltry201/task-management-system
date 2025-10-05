const logger = require('../utils/logger');

/**
 * Request logging middleware
 * Tracks route performance and request details
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log when response has finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.logRequest(req, res, duration);
  });

  next();
};

module.exports = requestLogger;
