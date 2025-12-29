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

import { GoveeService } from './services/shared/goveeService.js';
import { DiscordService } from './services/cogworks/discordService.js';
import { createHealthRoutes } from './routes/shared/health.js';
import { createCogworksRoutes, stopHealthCheck } from './routes/cogworks/cogworks.js';
import { createGoveeRoutes } from './routes/shared/govee.js';
import { createRackSmithAuthRoutes } from './routes/racksmith/auth.js';
import { createRacksRoutes } from './routes/racksmith/racks.js';
import { createUserPreferencesRoutes } from './routes/racksmith/preferences.js';
import { createDeviceRoutes } from './routes/racksmith/devices.js';
import { createConnectionRoutes } from './routes/racksmith/connections.js';
import { createProjectsRoutes } from './routes/homepage/projects.js';
import { createAboutRoutes } from './routes/homepage/about.js';
import { createGitHubRoutes } from './routes/homepage/github.js';
import { generalLimiter } from './middleware/shared/rateLimiter.js';
import { errorHandler } from './middleware/shared/errorHandler.js';
import { logger } from './utils/logger.js';
import { authService } from './services/shared/authService.js';
import { createAuthRoutes } from './routes/shared/auth.js';
import { requireAuth } from './middleware/shared/authHandler.js';
import { initializeDatabase, closeDatabase } from './typeorm/index.js';

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
  'TOTP_SECRET',
  'MYSQL_DB_HOST',
  'MYSQL_DB_PORT',
  'MYSQL_DB_USERNAME',
  'MYSQL_DB_PASSWORD',
  'MYSQL_DB_DATABASE'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Warn about optional environment variables
if (!process.env.GITHUB_PAT) {
  logger.warn('⚠️  GITHUB_PAT not configured - GitHub integration features will be disabled');
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
app.use('/api/racksmith/auth', createRackSmithAuthRoutes());
app.use('/api/racksmith/racks', createRacksRoutes());
app.use('/api/racksmith/devices', createDeviceRoutes());
app.use('/api/racksmith/connections', createConnectionRoutes());
app.use('/api/users/me/preferences', createUserPreferencesRoutes());

/* Homepage API routes */
app.use('/api/projects', createProjectsRoutes());
app.use('/api/about', createAboutRoutes());
app.use('/api/github', createGitHubRoutes());

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
        'govee.preset': '/api/govee/preset/:presetId',

        // Homepage API endpoints
        'projects.list': 'GET /api/projects',
        'projects.get': 'GET /api/projects/:id',
        'projects.create': 'POST /api/projects',
        'projects.update': 'PUT /api/projects/:id',
        'projects.delete': 'DELETE /api/projects/:id',
        'projects.reorder': 'PUT /api/projects/reorder',
        'about.get': 'GET /api/about',
        'about.update': 'PUT /api/about',
        'about.sections': 'PUT /api/about/sections',
        'github.repos': 'GET /api/github/repos',
        'github.import': 'POST /api/github/import/:repoName'
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
      '/api/govee/control/group', '/api/govee/control/all', '/api/govee/preset/:id',
      '/api/projects', '/api/about', '/api/github/repos'
    ],
    timestamp: new Date().toISOString()
  });
});

/* Start HTTP server -- logs startup info and initializes Govee devices */
app.listen(PORT, async () => {
  logger.info(`📡 Nindroid Systems API running on port ${PORT}`);
  logger.info(`⚡ Runtime: Node`);
  logger.info(`🔧 Environment: ${process.env.NODE_ENV!}`);
  logger.info(`📝 CORS enabled for: ${allowedOrigins.join(', ')}`);
  
  // Initialize database connection
  try {
    await initializeDatabase();
  } catch (error) {
    logger.error('Failed to initialize database:', error);
  }
  
  // init Govee devices on startup for faster first requests
  goveeService.getDevices().catch(error => {
    logger.error('Failed to initialize Govee devices:', error);
  });
});

/**
 * Graceful shutdown handlers
 * Ensure clean server shutdown on process termination signals
 */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  stopHealthCheck();
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  stopHealthCheck();
  await closeDatabase();
  process.exit(0);
});

export default app;