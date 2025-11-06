/**
 * @fileoverview RackSmith Authentication Middleware
 * @description Express middleware for protecting RackSmith routes
 */

import { Request, Response, NextFunction } from 'express';
import { rackSmithAuthService } from '../../services/racksmith/authService.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      rackSmithUser?: {
        id: string;
        email: string;
        username: string;
        firstName?: string;
        lastName?: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware to require authentication for RackSmith routes
 * In development mode, authentication can be bypassed by sending a special header
 */
export const requireRackSmithAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Dev mode bypass: Check for X-Dev-Mode header
    if (process.env.NODE_ENV === 'dev' && req.headers['x-dev-mode'] === 'true') {
      // Create a mock dev user
      req.rackSmithUser = {
        id: 'dev-user-id',
        email: 'dev@racksmith.local',
        username: 'devuser',
        firstName: 'Dev',
        lastName: 'User',
        role: 'admin'
      };
      next();
      return;
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided'
      });
      return;
    }

    const token = authHeader.substring(7);
    const result = await rackSmithAuthService.verifyToken(token);

    if (!result.valid) {
      res.status(401).json({
        success: false,
        error: result.error || 'Invalid token'
      });
      return;
    }

    // Attach user to request
    req.rackSmithUser = result.user;
    next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
