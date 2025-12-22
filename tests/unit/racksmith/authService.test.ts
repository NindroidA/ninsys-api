/**
 * @fileoverview Unit tests for RackSmith Auth Service
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { testUser, testUserWithPassword, resetMocks } from '../../setup.js';

// Mock TypeORM
const mockFindOne = jest.fn();
const mockCreate = jest.fn();
const mockSave = jest.fn();

jest.mock('../../../src/typeorm/index.js', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({
      findOne: mockFindOne,
      create: mockCreate,
      save: mockSave,
    })),
  },
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

// Import after mocks are set up
import { RackSmithAuthService } from '../../../src/services/racksmith/authService.js';

describe('RackSmithAuthService', () => {
  let authService: RackSmithAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new RackSmithAuthService();
  });

  describe('register', () => {
    const registerData = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    };

    it('should successfully register a new user', async () => {
      mockFindOne.mockResolvedValue(null); // No existing user
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockCreate.mockReturnValue({
        id: 'new-user-id',
        ...registerData,
        password: 'hashed-password',
      });
      mockSave.mockResolvedValue({
        id: 'new-user-id',
        ...registerData,
        password: 'hashed-password',
      });

      const result = await authService.register(
        registerData.username,
        registerData.email,
        registerData.password,
        registerData.firstName,
        registerData.lastName
      );

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.username).toBe(registerData.username);
      expect(result.user?.email).toBe(registerData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerData.password, 12);
    });

    it('should reject duplicate email', async () => {
      mockFindOne.mockResolvedValueOnce({ email: registerData.email }); // Existing email

      const result = await authService.register(
        registerData.username,
        registerData.email,
        registerData.password
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('User with this email already exists');
    });

    it('should reject duplicate username', async () => {
      mockFindOne
        .mockResolvedValueOnce(null) // No existing email
        .mockResolvedValueOnce({ username: registerData.username }); // Existing username

      const result = await authService.register(
        registerData.username,
        registerData.email,
        registerData.password
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Username already taken');
    });

    it('should hash password with bcrypt (12 rounds)', async () => {
      mockFindOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockCreate.mockReturnValue({ id: 'new-id', ...registerData });
      mockSave.mockResolvedValue({ id: 'new-id', ...registerData });

      await authService.register(
        registerData.username,
        registerData.email,
        registerData.password
      );

      expect(bcrypt.hash).toHaveBeenCalledWith(registerData.password, 12);
    });

    it('should handle database errors gracefully', async () => {
      mockFindOne.mockRejectedValue(new Error('Database error'));

      const result = await authService.register(
        registerData.username,
        registerData.email,
        registerData.password
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to register user');
    });

    it('should not return password in response', async () => {
      mockFindOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockCreate.mockReturnValue({
        id: 'new-id',
        ...registerData,
        password: 'hashed-password',
      });
      mockSave.mockResolvedValue({
        id: 'new-id',
        ...registerData,
        password: 'hashed-password',
      });

      const result = await authService.register(
        registerData.username,
        registerData.email,
        registerData.password
      );

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('password_hash');
    });
  });

  describe('login', () => {
    const validUser = {
      id: 'user-id',
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashed-password',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      lastLogin: null,
    };

    it('should login with valid email and password', async () => {
      mockFindOne.mockResolvedValue(validUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('valid-token');

      const result = await authService.login('test@example.com', 'password');

      expect(result.success).toBe(true);
      expect(result.token).toBe('valid-token');
      expect(result.user?.email).toBe(validUser.email);
    });

    it('should login with valid username and password', async () => {
      mockFindOne.mockResolvedValue(validUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('valid-token');

      const result = await authService.login('testuser', 'password');

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
    });

    it('should reject invalid credentials (user not found)', async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await authService.login('nonexistent@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should reject invalid password', async () => {
      mockFindOne.mockResolvedValue(validUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.login('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should reject inactive users', async () => {
      mockFindOne.mockResolvedValue({ ...validUser, isActive: false });

      const result = await authService.login('test@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Account is inactive');
    });

    it('should update lastLogin timestamp on successful login', async () => {
      mockFindOne.mockResolvedValue(validUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('valid-token');
      mockSave.mockResolvedValue(validUser);

      await authService.login('test@example.com', 'password');

      expect(mockSave).toHaveBeenCalled();
      const savedUser = mockSave.mock.calls[0][0];
      expect(savedUser.lastLogin).toBeInstanceOf(Date);
    });

    it('should return JWT token with 24h expiry', async () => {
      mockFindOne.mockResolvedValue(validUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('valid-token');

      await authService.login('test@example.com', 'password');

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ userId: validUser.id, email: validUser.email }),
        expect.any(String),
        { expiresIn: '24h' }
      );
    });

    it('should handle database errors gracefully', async () => {
      mockFindOne.mockRejectedValue(new Error('Database error'));

      const result = await authService.login('test@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to login');
    });
  });

  describe('verifyToken', () => {
    const validPayload = {
      userId: 'user-id',
      email: 'test@example.com',
    };

    const validUser = {
      id: 'user-id',
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      isActive: true,
    };

    it('should verify valid JWT token', async () => {
      (jwt.verify as jest.Mock).mockReturnValue(validPayload);
      mockFindOne.mockResolvedValue(validUser);

      const result = await authService.verifyToken('valid-token');

      expect(result.valid).toBe(true);
      expect(result.user?.id).toBe(validUser.id);
      expect(result.user?.email).toBe(validUser.email);
    });

    it('should reject expired token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('jwt expired');
      });

      const result = await authService.verifyToken('expired-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid or expired token');
    });

    it('should reject invalid token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid token');
      });

      const result = await authService.verifyToken('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid or expired token');
    });

    it('should reject if user not found', async () => {
      (jwt.verify as jest.Mock).mockReturnValue(validPayload);
      mockFindOne.mockResolvedValue(null);

      const result = await authService.verifyToken('valid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should reject inactive user', async () => {
      (jwt.verify as jest.Mock).mockReturnValue(validPayload);
      mockFindOne.mockResolvedValue({ ...validUser, isActive: false });

      const result = await authService.verifyToken('valid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Account is inactive');
    });

    it('should include user role in response', async () => {
      (jwt.verify as jest.Mock).mockReturnValue(validPayload);
      mockFindOne.mockResolvedValue({ ...validUser, role: 'admin' });

      const result = await authService.verifyToken('valid-token');

      expect(result.valid).toBe(true);
      expect(result.user?.role).toBe('admin');
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
      };
      mockFindOne.mockResolvedValue(user);

      const result = await authService.getUserById('user-id');

      expect(result).toEqual(user);
      expect(mockFindOne).toHaveBeenCalledWith({ where: { id: 'user-id' } });
    });

    it('should return null for non-existent user', async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await authService.getUserById('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockFindOne.mockRejectedValue(new Error('Database error'));

      const result = await authService.getUserById('user-id');

      expect(result).toBeNull();
    });
  });
});
