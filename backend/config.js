// config.js - Application configuration
/**
 * JWT Secret Key for signing and verifying tokens.
 * NOTE: Using a simple hardcoded string for development. 
 * This must be an environment variable in production.
 */
const JWT_SECRET = process.env.JWT_SECRET || 'orah-school1';

module.exports = {
  JWT_SECRET
};
