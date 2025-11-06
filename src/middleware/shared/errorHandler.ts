/**
 * @fileoverview Error Handling Middleware
 * @description Express error handling middleware for consistent error responses and proper error logging throughout the API.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../types/shared/api.js';
import { logger } from '../../utils/logger.js';

/**
 * Global error handling middleware for Express.
 * Catches unhandled errors and returns consistent error responses.
 * 
 * @param {Error} error Error that occurred
 * @param {Request} req Express request obj
 * @param {Response} res Express response obj
 * @param {NextFunction} next Express next function (unused but required for error middleware)
 */
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`API Error in ${req.method} ${req.path}:`, error);

  // don't send detailed error messages in production for security
  const errorMessage = process.env.NODE_ENV === 'prod' 
    ? 'Internal server error' 
    : error.message;

  res.status(500).json({ 
    error: errorMessage,
    timestamp: new Date().toISOString()
  });
};