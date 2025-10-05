const { Pool } = require('pg');
const env = require('./env');

/**
 * PostgreSQL connection pool configuration
 * Optimized for serverless environments
 */
const ssl = env.databaseSsl
  ? { rejectUnauthorized: false }
  : false;

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('Successfully connected to PostgreSQL database');
});

module.exports = pool;
