/**
 * @fileoverview Unit tests for Error Handler Middleware
 */

import { Request, Response, NextFunction } from 'express';

// Mock logger
const mockLoggerError = jest.fn();
jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    error: mockLoggerError,
  },
}));

import { errorHandler } from '../../../src/middleware/shared/errorHandler.js';

describe('errorHandler', () => {
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
      method: 'GET',
      path: '/api/test',
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();

    // Reset NODE_ENV
    delete process.env.NODE_ENV;
  });

  describe('error response', () => {
    it('should return 500 status', () => {
      const error = new Error('Test error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it('should include timestamp in response', () => {
      const error = new Error('Test error');
      const beforeTime = new Date().toISOString();

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.timestamp).toBeDefined();
      expect(new Date(response.timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeTime).getTime() - 1000
      );
    });
  });

  describe('production mode', () => {
    it('should hide error details in production', () => {
      process.env.NODE_ENV = 'prod';
      const error = new Error('Sensitive database error: password = secret123');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.error).toBe('Internal server error');
      expect(response.error).not.toContain('password');
      expect(response.error).not.toContain('secret123');
    });
  });

  describe('development mode', () => {
    it('should show error details in development', () => {
      process.env.NODE_ENV = 'dev';
      const error = new Error('Detailed error message');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.error).toBe('Detailed error message');
    });

    it('should show error details in test mode', () => {
      process.env.NODE_ENV = 'test';
      const error = new Error('Test error message');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.error).toBe('Test error message');
    });

    it('should show error details when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      const error = new Error('Unset env error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.error).toBe('Unset env error');
    });
  });

  describe('logging', () => {
    it('should log errors', () => {
      const error = new Error('Logged error');
      mockReq.method = 'POST';
      mockReq.path = '/api/users';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockLoggerError).toHaveBeenCalledWith(
        'API Error in POST /api/users:',
        error
      );
    });

    it('should include method and path in log', () => {
      const error = new Error('Test');
      mockReq.method = 'DELETE';
      mockReq.path = '/api/items/123';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockLoggerError).toHaveBeenCalledWith(
        'API Error in DELETE /api/items/123:',
        error
      );
    });
  });

  describe('error types', () => {
    it('should handle Error objects', () => {
      const error = new Error('Standard error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it('should handle TypeError', () => {
      const error = new TypeError('Type mismatch');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it('should handle RangeError', () => {
      const error = new RangeError('Out of range');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it('should handle custom errors', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }
      const error = new CustomError('Custom error occurred');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('next function', () => {
    it('should not call next (error is handled)', () => {
      const error = new Error('Test');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
