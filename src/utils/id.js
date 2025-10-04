const crypto = require('crypto');

/**
 * Generate a UUID v4 using crypto.randomUUID()
 * @returns {string} A random UUID v4 string
 */
function generateUuid() {
  return crypto.randomUUID();
}

module.exports = {
  generateUuid
};
