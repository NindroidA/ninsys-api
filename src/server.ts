/**
 * @fileoverview Nindroid Systems API Server
 * @description Main Express server for Nindroid Systems API -- Built with Bun runtime.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import packageJson from '../package.json' with { type: 'json' };
const { version, description } = packageJson;

import { GoveeService } from './services/goveeService.js';
import { DiscordService } from './services/discordService.js';
import { createHealthRoutes } from './routes/health.js';
import { createCogworksRoutes, stopHealthCheck } from './routes/cogworks.js';
import { createGoveeRoutes } from './routes/govee.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { authService } from './services/authService.js';
import { createAuthRoutes } from './routes/auth.js';
import { requireAuth } from './middleware/authHandler.js';

// load env vars from .env file
dotenv.config();

// express app instance
const app = express();

// server port
const PORT = process.env.PORT || 3001;

/**
 * Validate that all required environment variables are present.
 * Exits the process if any required variables are missing.
 */
const requiredEnvVars = [
  'GOVEE_API_KEY', 
  'COGWORKS_BOT_TOKEN',
  'JWT_SECRET',
  'TOTP_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

/* Initialize service instances with environment config. */
const goveeService = new GoveeService(process.env.GOVEE_API_KEY!);
const discordService = new DiscordService(process.env.COGWORKS_BOT_TOKEN!);

/* Configure middleware stack */
app.use(helmet());                                // security middleware for http headers
app.use(express.json({ limit: '10mb' }));         // json body parsing
app.use(express.urlencoded({ extended: true }));  // url encoded body parsing

// http request logging (only in production)
if (process.env.NODE_ENV === 'prod') {
  app.use(morgan('combined'));
}

/* CORS configuration for allowed origins */
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'https://nindroidsystems.com'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * Apply rate limiting to all routes
 * General limit: 100 requests per 15 minutes
 */
app.use(generalLimiter);

/* Mount API route handlers */
app.use('/health', createHealthRoutes(goveeService, discordService));
app.use('/api/auth', createAuthRoutes(authService));
app.use('/api/cogworks', createCogworksRoutes(discordService));
app.use('/api/govee', createGoveeRoutes(goveeService));

/**
 * Root endpoint -- API info and available endpoints
 * 
 * @route GET /
 * @returns {object} API metadata and endpoint listing
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Nindroid Systems API',
      version,
      description,
      runtime: 'node',
      endpoints: {
        // System endpoints
        'health': '/health',
        'health.cogworks-bot': '/health/cogworks-bot',

        // Auth endpoints
        'auth.login': 'POST /api/auth/login',
        'auth.status': 'GET /api/auth/status', 
        'auth.logout': 'POST /api/auth/logout',
        'auth.setup': 'GET /api/auth/setup (dev only)',
        
        // Cogworks Bot endpoints
        'cogworks.stats': '/api/cogworks/stats',
        'cogworks.info': '/api/cogworks/info',
        'cogworks.status': '/api/cogworks/status',
        'cogworks.commands': '/api/cogworks/commands',
        'cogworks.ping': '/api/cogworks/ping',
        'cogworks.uptime': '/api/cogworks/uptime',
        
        // Govee endpoints
        'govee.devices': '/api/govee/devices',
        'govee.presets': '/api/govee/presets',
        'govee.control': '/api/govee/control',
        'govee.controlGroup': '/api/govee/control/group',
        'govee.controlAll': '/api/govee/control/all',
        'govee.preset': '/api/govee/preset/:presetId'
      }
    },
    timestamp: new Date().toISOString()
  });
});

/* Global error handling middleware */
app.use(errorHandler);

/**
 * 404 handler -- returns info about available endpoints
 * 
 * @route * *
 * @returns {object} Error message with available endpoints
 */
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found!',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      '/health', '/health/cogworks-bot', 
      '/api/auth/login', '/api/auth/status', '/api/auth/logout',
      '/api/cogworks/stats', '/api/cogworks/info', '/api/cogworks/status',
      '/api/cogworks/commands', '/api/cogworks/ping', '/api/cogworks/uptime',
      '/api/govee/devices', '/api/govee/presets', '/api/govee/control',
      '/api/govee/control/group', '/api/govee/control/all', '/api/govee/preset/:id'
    ],
    timestamp: new Date().toISOString()
  });
});

/* Start HTTP server -- logs startup info and initializes Govee devices */
app.listen(PORT, () => {
  logger.info(`📡 Nindroid Systems API running on port ${PORT}`);
  logger.info(`⚡ Runtime: Node`);
  logger.info(`🔧 Environment: ${process.env.NODE_ENV!}`);
  logger.info(`📝 CORS enabled for: ${allowedOrigins.join(', ')}`);
  
  // init Govee devices on startup for faster first requests
  goveeService.getDevices().catch(error => {
    logger.error('Failed to initialize Govee devices:', error);
  });
});

/**
 * Graceful shutdown handlers
 * Ensure clean server shutdown on process termination signals
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  stopHealthCheck();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  stopHealthCheck();
  process.exit(0);
});

export default app;