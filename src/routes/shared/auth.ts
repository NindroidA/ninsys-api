/**
 * @fileoverview Authentication API Routes
 * @description Express routes for authentication.
 */

import { Router, Request, Response } from "express";
import { AuthService } from "../../services/shared/authService.js";
import { ApiResponse } from "../../types/shared/api.js";
import { logger } from "../../utils/logger.js";
import { AuthenticatedRequest } from "../../types/shared/auth.js";
import { optionalAuth } from "../../middleware/shared/authHandler.js";

/**
 * Create auth routes with service dependency.
 * 
 * @param {AuthService} authService Authentication service instance
 * @returns {Router} Express router with auth endpoints
 */
export const createAuthRoutes = (authService: AuthService): Router => {
  const router = Router();
  const route = (handler: any) => handler as any;

  /**
   * POST /api/auth/login
   * Authenticate with TOTP code
   */
  router.post('/login', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'TOTP code required',
          timestamp: new Date().toISOString()
        });
      }

      // verify TOTP code
      const isValid = authService.verifyTOTP(code);
      if (!isValid) {
        // log failed attempts for security monitoring
        logger.warn(`Failed TOTP login attempt from ${req.ip}`);
        return res.status(401).json({
          success: false,
          error: 'Invalid authentication code',
          timestamp: new Date().toISOString()
        });
      }

      // generate session token
      const token = authService.generateSessionToken();
      const expires = authService.getSessionExpiry();

      logger.info(`Successful TOTP authentication from ${req.ip}`);

      res.json({
        success: true,
        data: {
          token,
          expires: new Date(expires).toISOString(),
          message: 'Authenticated successfully'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Authentication failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/auth/status
   * Check current authentication status
   */
  router.get('/status', optionalAuth as any, route((req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const isAuthenticated = req.user?.authenticated || false;
    const expires = req.user?.expires;

    res.json({
      success: true,
      data: {
        authenticated: isAuthenticated,
        expires: expires ? new Date(expires).toISOString() : null,
        remaining: expires ? Math.max(0, expires - Date.now()) : 0
      },
      timestamp: new Date().toISOString()
    });
  }));

  /**
   * POST /api/auth/logout
   * Logout (client-side token removal, server doesn't track sessions)
   */
  router.post('/logout', (req: Request, res: Response<ApiResponse>) => {
    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/auth/setup (DEBUG ONLY - Remove in production)
   * Generate TOTP setup QR code for initial configuration
   * Only enable this temporarily when setting up authenticator
   */
  if (process.env.NODE_ENV === 'dev') {
    router.get('/setup', async (req: Request, res: Response) => {
      try {
        const setup = await authService.generateTOTPSetup();
        
        // return simple HTML page with QR code for ezpz scanning
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>TOTP Setup</title>
              <style>
                body { font-family: monospace; text-align: center; padding: 50px; }
                .qr { margin: 20px; }
                .secret { background: #f0f0f0; padding: 10px; margin: 20px; }
              </style>
            </head>
            <body>
              <h1>Nindroid Systems TOTP Setup</h1>
              <div class="qr">
                <img src="${setup.qrCode}" alt="TOTP QR Code" />
              </div>
              <p>Scan with Google Authenticator or similar app</p>
              <div class="secret">
                <p><strong>Manual Entry Key:</strong></p>
                <code>${setup.manualEntryKey}</code>
              </div>
              <p><em>Save TOTP_SECRET=${setup.secret} to your .env file</em></p>
            </body>
          </html>
        `;
        
        res.send(html);
      } catch (error) {
        logger.error('Setup generation error:', error);
        res.status(500).json({ error: 'Failed to generate setup' });
      }
    });
  }

  return router;
};