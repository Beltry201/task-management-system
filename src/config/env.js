// Environment configuration loader and accessor
// Loads .env in local/dev and exposes typed accessors

const path = require('path');

// Load dotenv only outside of Lambda managed environments
if (!process.env.AWS_EXECUTION_ENV) {
  // Resolve project root .env
  const envPath = path.resolve(process.cwd(), '.env');
  require('dotenv').config({ path: envPath });
}

function getEnv(name, defaultValue) {
  const value = process.env[name];
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return value;
}

module.exports = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  databaseUrl: getEnv('DATABASE_URL'),
  // Enable SSL for Postgres connections when talking to providers like RDS/Neon/Render
  // Use string env to avoid surprises with undefined
  databaseSsl: getEnv('DATABASE_SSL', 'false') === 'true',
  jwtSecret: getEnv('JWT_SECRET'),
  jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '7d'),
  openAiApiKey: getEnv('OPENAI_API_KEY', ''),
};


