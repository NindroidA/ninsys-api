/**
 * @fileoverview RackSmith Authentication Routes
 * @description Express routes for user authentication
 */

import { Router, Request, Response } from 'express';
import { rackSmithAuthService } from '../../services/racksmith/authService.js';
import { authLimiter } from '../../middleware/shared/rateLimiter.js';

export const createRackSmithAuthRoutes = (): Router => {
  const router = Router();

  /**
   * Register a new user
   * 
   * @route POST /api/racksmith/auth/register
   * @body {string} username - User's username (unique)
   * @body {string} email - User's email address
   * @body {string} password - User's password (min 8 characters)
   * @body {string} firstName - User's first name (optional)
   * @body {string} lastName - User's last name (optional)
   */
  router.post('/register', authLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      // Validation
      if (!username || !email || !password) {
        res.status(400).json({
          success: false,
          error: 'Username, email, and password are required'
        });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters long'
        });
        return;
      }

      // Username validation
      if (username.length < 3 || username.length > 20) {
        res.status(400).json({
          success: false,
          error: 'Username must be between 3 and 20 characters'
        });
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
        return;
      }

      const result = await rackSmithAuthService.register(username, email, password, firstName, lastName);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Error in register route:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  /**
   * Login a user
   * 
   * @route POST /api/racksmith/auth/login
   * @body {string} emailOrUsername - User's email address or username
   * @body {string} password - User's password
   * @returns {object} { success, token, user }
   */
  router.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
      const { emailOrUsername, password } = req.body;

      // Validation
      if (!emailOrUsername || !password) {
        res.status(400).json({
          success: false,
          error: 'Email/username and password are required'
        });
        return;
      }

      const result = await rackSmithAuthService.login(emailOrUsername, password);

      if (!result.success) {
        res.status(401).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Error in login route:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  /**
   * Get current user info
   * 
   * @route GET /api/racksmith/auth/me
   * @header Authorization - Bearer token
   * @returns {object} { success, user }
   */
  router.get('/me', async (req: Request, res: Response): Promise<void> => {
    try {
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
          error: result.error
        });
        return;
      }

      res.json({
        success: true,
        user: result.user
      });
    } catch (error) {
      console.error('Error in me route:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  return router;
};
