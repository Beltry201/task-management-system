const { Pool } = require('pg');

/**
 * PostgreSQL connection pool configuration
 * Optimized for serverless environments
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2, // Serverless optimization - limit concurrent connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Timeout after 2 seconds if no connection available
});

// Error event listener
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Connect event listener
pool.on('connect', () => {
  console.log('Successfully connected to PostgreSQL database');
});

module.exports = pool;
