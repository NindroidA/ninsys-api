/**
 * Jest Test Setup
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3999';
process.env.GOVEE_API_KEY = 'test-govee-key';
process.env.COGWORKS_BOT_TOKEN = 'test-bot-token-12345';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.TOTP_SECRET = 'test-totp-secret';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:5173';

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set longer timeout for integration tests
jest.setTimeout(10000);
