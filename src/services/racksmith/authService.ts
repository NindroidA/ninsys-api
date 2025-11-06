/**
 * @fileoverview RackSmith Authentication Service
 * @description Handles user registration, login, and JWT token management
 */

import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AppDataSource } from '../../typeorm/index.js';
import { User } from '../../typeorm/entities/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '24h';

export interface AuthTokenPayload {
  userId: string;
  email: string;
}

export interface LoginResult {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  error?: string;
}

export interface RegisterResult {
  success: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  error?: string;
}

export class RackSmithAuthService {
  private userRepository = AppDataSource.getRepository(User);

  /**
   * Register a new user
   */
  async register(
    username: string,
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<RegisterResult> {
    try {
      // Check if user already exists by email
      const existingEmail = await this.userRepository.findOne({ where: { email } });
      if (existingEmail) {
        return {
          success: false,
          error: 'User with this email already exists'
        };
      }

      // Check if username already exists
      const existingUsername = await this.userRepository.findOne({ where: { username } });
      if (existingUsername) {
        return {
          success: false,
          error: 'Username already taken'
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create new user
      const user = this.userRepository.create({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'user',
        isActive: true
      });

      await this.userRepository.save(user);

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      };
    } catch (error) {
      console.error('Error registering user:', error);
      return {
        success: false,
        error: 'Failed to register user'
      };
    }
  }

  /**
   * Login a user (supports email OR username)
   */
  async login(emailOrUsername: string, password: string): Promise<LoginResult> {
    try {
      // Find user by email or username
      const user = await this.userRepository.findOne({
        where: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      });

      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is inactive'
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Update last login timestamp
      user.lastLogin = new Date();
      await this.userRepository.save(user);

      // Generate JWT token
      const payload = { userId: user.id, email: user.email };
      const options: SignOptions = { expiresIn: JWT_EXPIRY };
      const token = jwt.sign(payload, JWT_SECRET, options);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      };
    } catch (error) {
      console.error('Error logging in user:', error);
      return {
        success: false,
        error: 'Failed to login'
      };
    }
  }

  /**
   * Verify JWT token and return user info
   */
  async verifyToken(token: string): Promise<{ valid: boolean; user?: any; error?: string }> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
      
      const user = await this.userRepository.findOne({ where: { id: decoded.userId } });
      if (!user) {
        return { valid: false, error: 'User not found' };
      }

      // Check if user is active
      if (!user.isActive) {
        return { valid: false, error: 'Account is inactive' };
      }

      return {
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      };
    } catch (error) {
      return { valid: false, error: 'Invalid or expired token' };
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { id: userId } });
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }
}

export const rackSmithAuthService = new RackSmithAuthService();
