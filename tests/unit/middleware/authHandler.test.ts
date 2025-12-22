/**
 * @fileoverview Unit tests for RackSmith Auth Middleware
 */

import { Request, Response, NextFunction } from 'express';

// Mock the auth service
const mockVerifyToken = jest.fn();

jest.mock('../../../src/services/racksmith/authService.js', () => ({
  rackSmithAuthService: {
    verifyToken: mockVerifyToken,
  },
}));

import { requireRackSmithAuth } from '../../../src/middleware/racksmith/authHandler.js';

describe('requireRackSmithAuth', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      headers: {},
      method: 'GET',
      path: '/test',
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();

    // Reset NODE_ENV
    process.env.NODE_ENV = 'test';
  });

  describe('dev mode bypass', () => {
    it('should allow dev mode bypass when NODE_ENV=dev and X-Dev-Mode header is true', async () => {
      process.env.NODE_ENV = 'dev';
      mockReq.headers = { 'x-dev-mode': 'true' };

      await requireRackSmithAuth(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.rackSmithUser).toBeDefined();
      expect(mockReq.rackSmithUser?.id).toBe('dev-user-id');
      expect(mockReq.rackSmithUser?.role).toBe('admin');
    });

    it('should not allow dev mode bypass when NODE_ENV is not dev', async () => {
      process.env.NODE_ENV = 'prod';
      mockReq.headers = { 'x-dev-mode': 'true' };

      await requireRackSmithAuth(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should not allow dev mode bypass without X-Dev-Mode header', async () => {
      process.env.NODE_ENV = 'dev';
      mockReq.headers = {};

      await requireRackSmithAuth(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should attach mock user with correct properties in dev mode', async () => {
      process.env.NODE_ENV = 'dev';
      mockReq.headers = { 'x-dev-mode': 'true' };

      await requireRackSmithAuth(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.rackSmithUser).toEqual({
        id: 'dev-user-id',
        email: 'dev@racksmith.local',
        username: 'devuser',
        firstName: 'Dev',
        lastName: 'User',
        role: 'admin',
      });
    });
  });

  describe('token validation', () => {
    it('should pass with valid JWT token', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      mockVerifyToken.mockResolvedValue({
        valid: true,
        user: {
          id: 'user-id',
          email: 'test@example.com',
          username: 'testuser',
          role: 'user',
        },
      });

      await requireRackSmithAuth(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.rackSmithUser?.id).toBe('user-id');
    });

    it('should reject missing token', async () => {
      mockReq.headers = {};

      await requireRackSmithAuth(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'No token provided',
      });
    });

    it('should reject invalid token format (no Bearer prefix)', async () => {
      mockReq.headers = { authorization: 'invalid-token' };

      await requireRackSmithAuth(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'No token provided',
      });
    });

    it('should reject expired token', async () => {
      mockReq.headers = { authorization: 'Bearer expired-token' };
      mockVerifyToken.mockResolvedValue({
        valid: false,
        error: 'Token expired',
      });

      await requireRackSmithAuth(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Token expired',
      });
    });

    it('should reject invalid token', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      mockVerifyToken.mockResolvedValue({
        valid: false,
        error: 'Invalid token',
      });

      await requireRackSmithAuth(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('should use default error message if none provided', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      mockVerifyToken.mockResolvedValue({
        valid: false,
        // No error message
      });

      await requireRackSmithAuth(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
      });
    });
  });

  describe('user attachment', () => {
    it('should attach user to request on successful auth', async () => {
      const testUser = {
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
      };

      mockReq.headers = { authorization: 'Bearer valid-token' };
      mockVerifyToken.mockResolvedValue({
        valid: true,
        user: testUser,
      });

      await requireRackSmithAuth(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.rackSmithUser).toEqual(testUser);
    });
  });

  describe('error handling', () => {
    it('should return 500 on unexpected error', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      mockVerifyToken.mockRejectedValue(new Error('Unexpected error'));

      await requireRackSmithAuth(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
      });
    });
  });
});
