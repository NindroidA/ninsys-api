/**
 * @fileoverview TOTP Authentication Service
 * @description Complete authentication system using TOTP codes and JWT sessions.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { ApiResponse } from '../../types/shared/api.js';
import { logger } from '../../utils/logger.js';
import { JWTPayload, AuthenticatedRequest } from '../../types/shared/auth.js';
import dotenv from 'dotenv';

// load env vars from .env file
dotenv.config();

/**
 * Auth service class for TOTP and session management.
 * 
 * @class AuthService
 */
export class AuthService {
  private jwtSecret: string;
  private totpSecret: string;
  private sessionDuration: number = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET!;
    this.totpSecret = process.env.TOTP_SECRET!;
  }

  /**
   * Generate initial TOTP setup (one-time use for admin).
   * Call this once to get the QR code for Google Authenticator setup.
   * 
   * @returns {Promise<{ string; string; string }>} secret, qrCode, manualEntryKey
   */
  async generateTOTPSetup(): Promise<{ secret: string; qrCode: string; manualEntryKey: string }> {
    const secret = speakeasy.generateSecret({
      name: 'Nindroid Systems API',
      issuer: 'NinSys-API',
      length: 32
    });

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32!,
      qrCode: qrCodeDataUrl,
      manualEntryKey: secret.base32!
    };
  }

  /**
   * Verify TOTP code from user.
   * 
   * @param {string} token User inputed token
   * @returns {boolean} True if token is correct, false otherwise
   */
  verifyTOTP(token: string): boolean {
    return speakeasy.totp.verify({
      secret: this.totpSecret,
      token,
      window: 2, // allow +=60 seconds for clock drift
      encoding: 'base32'
    });
  }

  /**
   * Generate JWT session token.
   * 
   * @returns {string} JWT session token
   */
  generateSessionToken(): string {
    const payload: JWTPayload = {
      authenticated: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + this.sessionDuration) / 1000)
    };

    return jwt.sign(payload, this.jwtSecret);
  }

  /**
   * Verify and decode JWT session token.
   * 
   * @param {string} token Inputed JWT token
   * @returns {JWTPayload}
   */
  verifySessionToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get session expiry timestamp.
   * 
   * @returns {number} Timestamp
   */
  getSessionExpiry(): number {
    return Date.now() + this.sessionDuration;
  }
}

/* Global auth service instance */
export const authService = new AuthService();