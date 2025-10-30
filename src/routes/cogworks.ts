/**
 * @fileoverview Cogworks Bot API Routes
 * @description Express routes for Cogworks Bot statistics, status, and information.
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { ApiResponse } from '../types/api.js';
import { 
  CogworksStats, 
  CogworksInfo, 
  CogworksStatus, 
  CogworksCommandInfo, 
  CogworksUptimeInfo, 
  CogworksDataStore,
  BotRegistrationPayload,
  BotStatsPayload,
  CogworksPublicStatus,
  BotHealthResponse
} from '../types/cogworks.js';
import { DiscordService } from '../services/discordService.js';
import { logger } from '../utils/logger.js';

/* Constants */
const BOT_HEALTH_URL = 'http://localhost:3000';
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const OFFLINE_TIMEOUT = 600000; // 10 minutes
const CACHE_TTL = 30000; // 30 seconds

/* In-memory bot data store */
let botData: CogworksDataStore = {
  botId: null,
  username: null,
  guilds: 0,
  users: 0,
  uptime: 0,
  memoryUsage: 0,
  version: null,
  environment: null,
  lastUpdate: null,
  healthStatus: {
    ready: false,
    alive: false,
    lastCheck: null
  }
};

/* Status cache */
let cachedStatus: CogworksPublicStatus | null = null;
let cacheTimestamp: number = 0;

/* Health check interval */
let healthCheckInterval: NodeJS.Timeout | null = null;

/**
 * Check bot health by calling localhost:3000/health/ready
 */
async function checkBotHealth(): Promise<void> {
  try {
    const readyResponse = await axios.get<BotHealthResponse>(`${BOT_HEALTH_URL}/health/ready`, {
      timeout: 5000
    });

    const liveResponse = await axios.get<BotHealthResponse>(`${BOT_HEALTH_URL}/health/live`, {
      timeout: 5000
    });

    botData.healthStatus = {
      ready: readyResponse.data.ready ?? false,
      alive: liveResponse.data.alive ?? false,
      lastCheck: new Date()
    };

    logger.debug(`Bot health check: ready=${readyResponse.data.ready}, alive=${liveResponse.data.alive}`);
  } catch (error) {
    logger.warn('Bot health check failed:', error instanceof Error ? error.message : 'Unknown error');
    botData.healthStatus = {
      ready: false,
      alive: false,
      lastCheck: new Date()
    };
  }
}

/**
 * Check if bot is considered online based on last update time
 */
function isBotOnline(): boolean {
  if (!botData.lastUpdate) return false;
  const timeSinceUpdate = Date.now() - botData.lastUpdate.getTime();
  return timeSinceUpdate < OFFLINE_TIMEOUT;
}

/**
 * Verify bot token from Authorization header
 */
function verifyBotToken(req: Request): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  return token === process.env.COGWORKS_BOT_TOKEN;
}

/**
 * Middleware to require bot authentication
 */
function requireBotAuth(req: Request, res: Response, next: Function): void {
  if (!verifyBotToken(req)) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid bot token',
      timestamp: new Date().toISOString()
    });
    return;
  }
  next();
}

/**
 * Create Cogworks Bot routes with service dependency.
 * 
 * @param {DiscordService} discordService Discord service instance
 * @returns {Router} Express router with Cogworks Bot endpoints
 */
export const createCogworksRoutes = (discordService: DiscordService): Router => {
  const router = Router();

  // Start health check interval
  if (!healthCheckInterval) {
    healthCheckInterval = setInterval(checkBotHealth, HEALTH_CHECK_INTERVAL);
    logger.info('Started bot health check interval (every 30 seconds)');
    
    // Do initial health check
    checkBotHealth();
  }

  /**
   * POST /api/cogworks/register
   * Register bot instance with API -- Called when bot starts up
   */
  router.post('/register', requireBotAuth, async (req: Request, res: Response) => {
    try {
      const payload: BotRegistrationPayload = req.body;
      
      // Validate payload
      if (!payload.botId || !payload.username || payload.guilds === undefined) {
        res.status(400).json({
          success: false,
          error: 'Invalid registration payload',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Store bot data
      botData.botId = payload.botId;
      botData.username = payload.username;
      botData.guilds = payload.guilds;
      botData.users = payload.users;
      botData.uptime = payload.uptime;
      botData.memoryUsage = payload.memoryUsage;
      botData.version = payload.version;
      botData.environment = payload.environment;
      botData.lastUpdate = new Date();

      // Invalidate cache
      cachedStatus = null;

      // Trigger immediate health check
      await checkBotHealth();

      logger.info(`🤖 Cogworks bot registered: ${payload.username} (${payload.botId})`);

      res.json({
        success: true,
        message: 'Bot registered successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to register bot:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to register bot',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * PUT /api/cogworks/stats
   * Update bot statistics (called every 5 minutes by bot)
   */
  router.put('/stats', requireBotAuth, async (req: Request, res: Response) => {
    try {
      const payload: BotStatsPayload = req.body;
      
      // Validate payload
      if (!payload.botId || payload.guilds === undefined) {
        res.status(400).json({
          success: false,
          error: 'Invalid stats payload',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Update bot data
      botData.botId = payload.botId;
      botData.username = payload.username;
      botData.guilds = payload.guilds;
      botData.users = payload.users;
      botData.uptime = payload.uptime;
      botData.memoryUsage = payload.memoryUsage;
      botData.version = payload.version;
      botData.environment = payload.environment;
      botData.lastUpdate = new Date();

      // Invalidate cache
      cachedStatus = null;

      logger.debug(`📊 Bot stats updated: ${payload.guilds} guilds, ${payload.users} users`);

      res.json({
        success: true,
        message: 'Stats updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to update stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update stats',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/cogworks/status
   * Get public bot status (cached for 30 seconds)
   */
  router.get('/status', (req: Request, res: Response) => {
    try {
      const now = Date.now();

      // Return cached response if still valid
      if (cachedStatus && (now - cacheTimestamp) < CACHE_TTL) {
        res.json(cachedStatus);
        return;
      }

      // Build fresh status response
      const online = isBotOnline();
      const status: CogworksPublicStatus = {
        online,
        ready: botData.healthStatus.ready,
        guilds: botData.guilds,
        users: botData.users,
        uptime: botData.uptime,
        memoryUsageMB: Math.round(botData.memoryUsage / 1024 / 1024 * 100) / 100,
        version: botData.version || 'unknown',
        lastUpdate: botData.lastUpdate ? botData.lastUpdate.toISOString() : new Date(0).toISOString(),
        healthStatus: {
          ready: botData.healthStatus.ready,
          alive: botData.healthStatus.alive,
          lastCheck: botData.healthStatus.lastCheck ? botData.healthStatus.lastCheck.toISOString() : new Date(0).toISOString()
        }
      };

      // Cache the response
      cachedStatus = status;
      cacheTimestamp = now;

      res.json(status);
    } catch (error) {
      logger.error('Failed to get bot status:', error);
      res.status(500).json({
        online: false,
        error: 'Status check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /api/cogworks/command-log
   * Log command executions
   */
  router.post('/command-log', requireBotAuth, (req: Request, res: Response) => {
    try {
      const { command, guildId, userId, timestamp } = req.body;
      
      logger.info(`📝 Command logged: /${command} by ${userId} in ${guildId}`);
      
      res.json({
        success: true,
        message: 'Command logged successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to log command',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /api/cogworks/disconnect
   * Handle bot disconnection
   */
  router.post('/disconnect', requireBotAuth, (req: Request, res: Response) => {
    botData.healthStatus.ready = false;
    botData.healthStatus.alive = false;
    
    // Invalidate cache
    cachedStatus = null;
    
    logger.info('🔌 Cogworks bot disconnected from API');
    
    res.json({
      success: true,
      message: 'Bot disconnected successfully',
      timestamp: new Date().toISOString()
    });
  });

  /* ========== LEGACY ENDPOINTS (for backward compatibility) ========== */

  /**
   * GET /api/cogworks/stats (legacy)
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const stats = await discordService.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get stats',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/cogworks/info (legacy)
   */
  router.get('/info', async (req: Request, res: Response) => {
    try {
      const info = await discordService.getBotInfo();
      res.json(info);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get bot info',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/cogworks/commands (legacy)
   */
  router.get('/commands', async (req: Request, res: Response) => {
    try {
      const commands = await discordService.getCommands();
      res.json({ commands });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get commands',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/cogworks/ping (legacy)
   */
  router.get('/ping', (req: Request, res: Response) => {
    try {
      const pingData = discordService.getPing();
      res.json(pingData);
    } catch (error) {
      res.status(500).json({ 
        error: 'Ping failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/cogworks/uptime (legacy)
   */
  router.get('/uptime', (req: Request, res: Response) => {
    try {
      const uptimeData = discordService.getUptime();
      res.json(uptimeData);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get uptime',
        timestamp: new Date().toISOString()
      });
    }
  });

  return router;
};

/**
 * Stop health check interval (for cleanup)
 */
export function stopHealthCheck(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    logger.info('Stopped bot health check interval');
  }
}
