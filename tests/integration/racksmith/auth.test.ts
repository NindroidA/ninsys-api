/**
 * @fileoverview Integration tests for RackSmith Auth Routes
 */

import request from 'supertest';
import express, { Express } from 'express';

// Mock the auth service
const mockRegister = jest.fn();
const mockLogin = jest.fn();
const mockVerifyToken = jest.fn();
const mockGetUserById = jest.fn();

jest.mock('../../../src/services/racksmith/authService.js', () => ({
  rackSmithAuthService: {
    register: mockRegister,
    login: mockLogin,
    verifyToken: mockVerifyToken,
    getUserById: mockGetUserById,
  },
  RackSmithAuthService: jest.fn().mockImplementation(() => ({
    register: mockRegister,
    login: mockLogin,
    verifyToken: mockVerifyToken,
    getUserById: mockGetUserById,
  })),
}));

// Mock TypeORM (needed for route imports)
jest.mock('../../../src/typeorm/index.js', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    })),
  },
}));

// Mock rate limiter to avoid rate limiting in tests
jest.mock('../../../src/middleware/shared/rateLimiter.js', () => ({
  authLimiter: (req: unknown, res: unknown, next: () => void) => next(),
  generalLimiter: (req: unknown, res: unknown, next: () => void) => next(),
  goveeControlLimiter: (req: unknown, res: unknown, next: () => void) => next(),
  createRateLimiter: () => (req: unknown, res: unknown, next: () => void) => next(),
}));

import { createRackSmithAuthRoutes } from '../../../src/routes/racksmith/auth.js';

describe('RackSmith Auth Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/racksmith/auth', createRackSmithAuthRoutes());
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/racksmith/auth/register', () => {
    const validRegistration = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    };

    it('should register with valid data', async () => {
      mockRegister.mockResolvedValue({
        success: true,
        user: {
          id: 'new-id',
          username: validRegistration.username,
          email: validRegistration.email,
          firstName: validRegistration.firstName,
          lastName: validRegistration.lastName,
        },
      });

      const response = await request(app)
        .post('/api/racksmith/auth/register')
        .send(validRegistration);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe(validRegistration.username);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/racksmith/auth/register')
        .send({ username: 'test' }); // Missing email and password

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate password length (min 8)', async () => {
      const response = await request(app)
        .post('/api/racksmith/auth/register')
        .send({
          ...validRegistration,
          password: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate username length (3-20)', async () => {
      const response = await request(app)
        .post('/api/racksmith/auth/register')
        .send({
          ...validRegistration,
          username: 'ab', // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/racksmith/auth/register')
        .send({
          ...validRegistration,
          email: 'invalid-email',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when registration fails', async () => {
      mockRegister.mockResolvedValue({
        success: false,
        error: 'Username already taken',
      });

      const response = await request(app)
        .post('/api/racksmith/auth/register')
        .send(validRegistration);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Username already taken');
    });
  });

  describe('POST /api/racksmith/auth/login', () => {
    const validLogin = {
      emailOrUsername: 'test@example.com',
      password: 'password123',
    };

    it('should login with email', async () => {
      mockLogin.mockResolvedValue({
        success: true,
        token: 'valid-jwt-token',
        user: {
          id: 'user-id',
          username: 'testuser',
          email: 'test@example.com',
        },
      });

      const response = await request(app)
        .post('/api/racksmith/auth/login')
        .send(validLogin);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    it('should login with username', async () => {
      mockLogin.mockResolvedValue({
        success: true,
        token: 'valid-jwt-token',
        user: { id: 'user-id', username: 'testuser' },
      });

      const response = await request(app)
        .post('/api/racksmith/auth/login')
        .send({
          emailOrUsername: 'testuser',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return token and user on success', async () => {
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      mockLogin.mockResolvedValue({
        success: true,
        token: 'jwt-token-123',
        user: mockUser,
      });

      const response = await request(app)
        .post('/api/racksmith/auth/login')
        .send(validLogin);

      expect(response.body.token).toBe('jwt-token-123');
      expect(response.body.user).toEqual(mockUser);
    });

    it('should reject invalid credentials', async () => {
      mockLogin.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const response = await request(app)
        .post('/api/racksmith/auth/login')
        .send(validLogin);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/racksmith/auth/login')
        .send({ emailOrUsername: 'test' }); // Missing password

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/racksmith/auth/me', () => {
    it('should return current user with valid token', async () => {
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };

      mockVerifyToken.mockResolvedValue({
        valid: true,
        user: mockUser,
      });

      const response = await request(app)
        .get('/api/racksmith/auth/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toEqual(mockUser);
    });

    it('should reject without token', async () => {
      const response = await request(app)
        .get('/api/racksmith/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid token', async () => {
      mockVerifyToken.mockResolvedValue({
        valid: false,
        error: 'Invalid token',
      });

      const response = await request(app)
        .get('/api/racksmith/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
