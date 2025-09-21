/**
 * @fileoverview Cogworks Bot API Routes
 * @description Express routes for Cogworks Bot statistics, status, and information.
 */

import { Router, Request, Response } from 'express';
import { ApiResponse } from '../types/api.js';
import { CogworksStats, CogworksInfo, CogworksStatus, CogworksCommandInfo, CogworksUptimeInfo, CogworksDataStore } from '../types/cogworks.js';
import { DiscordService } from '../services/discordService.js';

/* In-memory bot data store */
let botData: CogworksDataStore = {
  stats: null,
  info: null,
  status: null,
  commands: [],
  lastUpdate: null,
  isConnected: false
};

/**
 * Create Cogworks Bot routes with service dependency.
 * 
 * @param {DiscordService} discordService Discord service instance
 * @returns {Router} Express router with Cogworks Bot endpoints
 */
export const createCogworksRoutes = (discordService: DiscordService): Router => {
  const router = Router();

  /**
   * POST /api/cogworks/register
   * Register bot instance with API -- Called when bot starts up
   */
  router.post('/register', async (req: Request, res: Response) => {
    try {
      const botPayload = req.body;
      
      // store initial bot data
      botData.stats = {
        guilds: botPayload.guilds,
        users: botPayload.users,
        channels: botPayload.channels,
        uptime: botPayload.uptime,
        memoryUsage: botPayload.memoryUsage,
        ping: botPayload.ping,
        version: botPayload.version
      };

      botData.info = {
        username: botPayload.username,
        discriminator: botPayload.discriminator,
        id: botPayload.id,
        avatar: botPayload.avatar,
        status: botPayload.online ? 'online' : 'offline',
        name: 'Cogworks Bot',
        description: 'Discord ticketing bot developed for ease-of-use',
        features: [
          'Ticketing Module',
          'Job Application Module', 
          'Announcement Module',
        ]
      };

      botData.status = {
        online: botPayload.online,
        uptime: botPayload.uptime,
        ping: botPayload.ping,
        guilds: botPayload.guilds,
        users: botPayload.users,
        lastRestart: new Date(Date.now() - (botPayload.uptime * 1000)).toISOString(),
        timestamp: botPayload.timestamp
      };

      botData.lastUpdate = new Date();
      botData.isConnected = true;

      res.json({
        success: true,
        message: 'Bot registered successfully',
        timestamp: new Date().toISOString()
      });

      console.log('🤖 Cogworks bot registered with API');
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to register bot',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * PUT /api/cogworks/stats
   * Sync bot statistics from external bot process (called every 5 minutes by bot)
   */
  router.put('/stats', async (req: Request, res: Response) => {
    try {
      const statsPayload = req.body;
      
      // update stored bot data
      botData.stats = {
        guilds: statsPayload.guilds,
        users: statsPayload.users,
        channels: statsPayload.channels,
        uptime: statsPayload.uptime,
        memoryUsage: statsPayload.memoryUsage,
        ping: statsPayload.ping,
        version: statsPayload.version
      };

      botData.status = {
        online: statsPayload.online,
        uptime: statsPayload.uptime,
        ping: statsPayload.ping,
        guilds: statsPayload.guilds,
        users: statsPayload.users,
        lastRestart: new Date(Date.now() - (statsPayload.uptime * 1000)).toISOString(),
        timestamp: statsPayload.timestamp
      };

      botData.lastUpdate = new Date();
      botData.isConnected = true;

      res.json({
        success: true,
        message: 'Stats updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update stats',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /api/cogworks/command-log
   * Log command executions
   */
  router.post('/command-log', (req: Request, res: Response) => {
    try {
      const { command, guildId, userId, timestamp } = req.body;
      
      // log command execution
      console.log(`📝 Command logged: /${command} by ${userId} in ${guildId}`);
      
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
  router.post('/disconnect', (req: Request, res: Response) => {
    botData.isConnected = false;
    if (botData.status) {
      botData.status.online = false;
    }
    
    console.log('🔌 Cogworks bot disconnected from API');
    
    res.json({
      success: true,
      message: 'Bot disconnected successfully',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/cogworks/stats
   * Get comprehensive bot statistics
   * 
   * @route GET /api/cogworks/stats
   * @returns {CogworksStats} Detailed bot statistics including memory usage
   * @returns {200} Statistics retrieved successfully
   * @returns {500} Failed to get statistics
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
   * GET /api/cogworks/info
   * Get bot profile information
   * 
   * @route GET /api/cogworks/info
   * @returns {CogworksInfo} Bot profile and configuration data
   * @returns {200} Information retrieved successfully
   * @returns {500} Failed to get bot information
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
   * GET /api/cogworks/status
   * Get current bot status and connectivity information
   * 
   * @route GET /api/cogworks/status
   * @returns {CogworksStatus} Current bot online status and metrics
   * @returns {200} Status retrieved successfully
   * @returns {500} Status check failed
   */
  router.get('/status', (req: Request, res: Response) => {
    try {
      const status = discordService.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({
        online: false,
        error: 'Status check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/cogworks/commands
   * Get list of registered Discord slash commands for Cogworks
   * 
   * @route GET /api/cogworks/commands
   * @returns {object} Object containing commands array
   * @returns {200} Commands retrieved successfully
   * @returns {500} Failed to get commands
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
   * GET /api/cogworks/ping
   * Simple ping endpoint for connectivity testing
   * 
   * @route GET /api/cogworks/ping
   * @returns {object} Pong response with timestamp and uptime
   * @returns {200} Ping successful
   * @returns {500} Ping failed
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
   * GET /api/cogworks/uptime
   * Get formatted uptime information
   * 
   * @route GET /api/cogworks/uptime
   * @returns {CogworksUptimeInfo} Uptime data
   * @returns {200} Uptime retrieved successfully
   * @returns {500} Failed to get uptime
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
