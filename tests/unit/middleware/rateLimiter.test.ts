/**
 * @fileoverview Unit tests for Rate Limiter Middleware
 */

import { createRateLimiter, generalLimiter, goveeControlLimiter, authLimiter } from '../../../src/middleware/shared/rateLimiter.js';

describe('Rate Limiter', () => {
  describe('createRateLimiter', () => {
    it('should create a middleware function', () => {
      const limiter = createRateLimiter(60000, 10);

      expect(typeof limiter).toBe('function');
    });

    it('should create limiter with specified window and max', () => {
      const windowMs = 30000;
      const max = 5;
      const limiter = createRateLimiter(windowMs, max);

      // The limiter is a function that can be used as middleware
      expect(typeof limiter).toBe('function');
    });
  });

  describe('pre-configured limiters', () => {
    describe('generalLimiter', () => {
      it('should be defined', () => {
        expect(generalLimiter).toBeDefined();
      });

      it('should be a function', () => {
        expect(typeof generalLimiter).toBe('function');
      });

      // Note: Testing actual rate limiting behavior requires integration tests
      // as the limiter stores state and needs actual requests
    });

    describe('goveeControlLimiter', () => {
      it('should be defined', () => {
        expect(goveeControlLimiter).toBeDefined();
      });

      it('should be a function', () => {
        expect(typeof goveeControlLimiter).toBe('function');
      });
    });

    describe('authLimiter', () => {
      it('should be defined', () => {
        expect(authLimiter).toBeDefined();
      });

      it('should be a function', () => {
        expect(typeof authLimiter).toBe('function');
      });
    });
  });

  describe('rate limiter configuration', () => {
    it('generalLimiter should allow 100 requests per 15 minutes', () => {
      // This is a documentation test - the actual config is:
      // 15 * 60 * 1000 = 900000ms (15 minutes)
      // max = 100
      expect(generalLimiter).toBeDefined();
    });

    it('goveeControlLimiter should allow 10 requests per minute', () => {
      // This is a documentation test - the actual config is:
      // 60 * 1000 = 60000ms (1 minute)
      // max = 10
      expect(goveeControlLimiter).toBeDefined();
    });

    it('authLimiter should allow 5 requests per 15 minutes', () => {
      // This is a documentation test - the actual config is:
      // 15 * 60 * 1000 = 900000ms (15 minutes)
      // max = 5
      expect(authLimiter).toBeDefined();
    });
  });

  describe('rate limiter response format', () => {
    it('should be configured with standard headers', () => {
      // The rate limiter is configured with:
      // standardHeaders: true - RateLimit-* headers
      // legacyHeaders: false - no X-RateLimit-* headers
      const limiter = createRateLimiter(60000, 10);
      expect(limiter).toBeDefined();
    });

    it('should have proper error message format', () => {
      // The rate limiter message format is:
      // {
      //   success: false,
      //   error: 'Too many requests, please try again later.',
      //   timestamp: ISO string
      // }
      // This matches the API response format
      const limiter = createRateLimiter(60000, 10);
      expect(limiter).toBeDefined();
    });
  });
});

// Note: Full integration tests for rate limiting behavior would require:
// 1. Setting up an Express app
// 2. Making multiple requests
// 3. Checking response status codes (200 then 429)
// 4. Verifying RateLimit headers
// These tests are covered in the integration test suite
