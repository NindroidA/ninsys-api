/**
 * @fileoverview Authentication Handling Middleware
 * @description Authentication require and optional handling middleware for proper route authentication.
 */

import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../types/shared/auth.js";
import { authService } from "../../services/shared/authService.js";
import { logger } from "../../utils/logger.js";

/**
 * Middleware to require TOTP authentication.
 * Checks for valid JWT token in Authorization header or auth_token query param.
 * 
 * @param {AuthenticatedRequest} req Custom authenticated request obj
 * @param {Response} res Express response obj
 * @param {NextFunction} next Express next function
 */
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // get token from Authorization header (Bearer token) or query param
    const headers = (req as any).headers;
    const authHeader = headers?.authorization || headers?.Authorization;
    let token = authHeader?.replace('Bearer ', '');
    
    
    if (!token) {
      token = (req as any).query?.auth_token as string;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Use "login <6-digit-code>" to authenticate.',
        timestamp: new Date().toISOString()
      });
    }

    // verify JWT token
    const payload = authService.verifySessionToken(token);
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session. Please login again.',
        timestamp: new Date().toISOString()
      });
    }

    // add user info to request
    req.user = {
      authenticated: true,
      expires: payload.exp * 1000 // convert to milliseconds
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Optional auth middleware - adds user info if token present, but doesn't require it.
 * 
 * @param {AuthenticatedRequest} req Custom authenticated request obj
 * @param {Response} res Express response obj (unused but probably required lol)
 * @param {NextFunction} next Express next function
 */
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const headers = (req as any).headers;
    const authHeader = headers?.authorization || headers?.Authorization;
    let token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      token = (req as any).query?.auth_token as string;
    }

    if (token) {
      const payload = authService.verifySessionToken(token);
      if (payload) {
        req.user = {
          authenticated: true,
          expires: payload.exp * 1000
        };
      }
    }

    next();
  } catch (error) {
    // don't fail on auth errors for optional auth
    next();
  }
};