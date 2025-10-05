// Environment configuration loader and accessor
// Loads .env in local/dev and exposes typed accessors

const path = require('path');

if (!process.env.AWS_EXECUTION_ENV) {
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
  databaseSsl: getEnv('DATABASE_SSL', 'false') === 'true',
  jwtSecret: getEnv('JWT_SECRET'),
  jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '7d'),
  openAiApiKey: getEnv('OPENAI_API_KEY', ''),
};


