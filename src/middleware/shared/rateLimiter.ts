/**
 * @fileoverview Rate Limiting Middleware
 * @description Express middleware for rate limiting API requests (to prevent abuse and protect against excessive usage of Govee API endpoints).
 */

import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

const isDev = process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development';

/**
 * No-op middleware that skips rate limiting (used in dev mode)
 */
const skipLimiter = (_req: Request, _res: Response, next: NextFunction) => next();

/**
 * Create a rate limiter with custom configuration.
 * In dev mode, returns a no-op middleware that skips rate limiting.
 *
 * @param {number} windowMs Time window in milliseconds
 * @param {number} max Maximum number of requests per window
 * @returns {import('express').RequestHandler} Express middleware function
 */
export const createRateLimiter = (windowMs: number, max: number): import('express').RequestHandler => {
  if (isDev) {
    return skipLimiter;
  }

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: 'Too many requests, please try again later.',
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

/* General rate limiter for most API endpoints -- Allows 100 requests per 15 minutes */
export const generalLimiter: import('express').RequestHandler = createRateLimiter(15 * 60 * 1000, 100);

/* Strict rate limiter for Govee device control endpoints -- Allows 10 requests per 1 minute to respect Govee API limits */
export const goveeControlLimiter: import('express').RequestHandler = createRateLimiter(60 * 1000, 10);

/* Auth rate limiter for authentication endpoints -- Allows 5 requests per 15 minutes to prevent brute force attacks */
export const authLimiter: import('express').RequestHandler = createRateLimiter(15 * 60 * 1000, 5);