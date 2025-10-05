const logger = {
  /**
   * Log request information with route tracking
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} duration - Request duration in ms
   */
  logRequest: (req, res, duration) => {
    const clientIp = (req.ip || req.headers['x-forwarded-for'] || '').toString().split(',')[0] || 'unknown';
    const logData = {
      type: 'REQUEST',
      method: req.method,
      route: req.route?.path || req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: clientIp,
      userId: req.user?.id || null,
      timestamp: new Date().toISOString()
    };

    if (req.path !== '/' && req.method !== 'OPTIONS' && res.headersSent !== false) {
      console.log(JSON.stringify(logData));
    }
  },

  /**
   * Log errors with context
   * @param {Error} error - Error object
   * @param {Object} req - Express request object (optional)
   * @param {Object} context - Additional context (optional)
   */
  logError: (error, req = null, context = {}) => {
    const logData = {
      type: 'ERROR',
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode || 500,
      route: req?.route?.path || req?.path || 'unknown',
      method: req?.method || 'unknown',
      userId: req?.user?.id || null,
      timestamp: new Date().toISOString(),
      ...context
    };

    console.error(JSON.stringify(logData));
  },

  /**
   * Log business logic events
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @param {Object} req - Express request object (optional)
   */
  logEvent: (event, data = {}, req = null) => {
    const logData = {
      type: 'EVENT',
      event,
      data,
      userId: req?.user?.id || null,
      timestamp: new Date().toISOString()
    };

    console.log(JSON.stringify(logData));
  },

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in ms
   * @param {Object} metadata - Additional metadata
   */
  logPerformance: (operation, duration, metadata = {}) => {
    const logData = {
      type: 'PERFORMANCE',
      operation,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    console.log(JSON.stringify(logData));
  }
};

module.exports = logger;
