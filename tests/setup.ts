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

// Database environment variables for test isolation
process.env.MYSQL_DB_HOST = 'localhost';
process.env.MYSQL_DB_PORT = '3306';
process.env.MYSQL_DB_USERNAME = 'test';
process.env.MYSQL_DB_PASSWORD = 'test';
process.env.MYSQL_DB_DATABASE = 'ninsys_test';

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

/**
 * Mock TypeORM DataSource
 * Used for unit tests that don't need actual database connection
 */
export const mockRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
  })),
};

export const mockDataSource = {
  isInitialized: true,
  initialize: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn().mockResolvedValue(undefined),
  getRepository: jest.fn(() => mockRepository),
};

/**
 * Helper to reset all mocks between tests
 */
export const resetMocks = (): void => {
  jest.clearAllMocks();
  Object.values(mockRepository).forEach((mock) => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      (mock as jest.Mock).mockReset();
    }
  });
};

/**
 * Test user data for RackSmith tests
 */
export const testUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  isActive: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

export const testUserWithPassword = {
  ...testUser,
  password_hash: '$2b$12$test-hashed-password',
};

/**
 * Test JWT token for authenticated requests
 */
export const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQtMTIzIiwiaWF0IjoxNzM1NjAwMDAwLCJleHAiOjE3MzU2ODY0MDB9.test-signature';
