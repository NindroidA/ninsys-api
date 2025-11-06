/**
 * @fileoverview Cogworks Bot Service
 * @description Service class for managing Cogworks Bot integration, statistics, and status reporting.
 */

import { CogworksStats, CogworksInfo, CogworksStatus, CogworksCommandInfo, CogworksUptimeInfo } from '../../types/cogworks/cogworks.js';
import { logger } from '../../utils/logger.js';

/**
 * Service class for Cogworks Bot integration and statistics.
 * Provides comprehensive bot management, real-time statistics, and health monitoring.
 * 
 * @class DiscordService
 */
export class DiscordService {
  private botToken: string;   // cogworks bot token for authentication
  private startTime: number;  // timestampt when service was initialized
  private bot: any;           // optional discord js client

  /**
   * Initialize the Cogworks Discord service
   * 
   * @param {string} botToken Cogworks Bot token for authentication
   * @param {any} [discordClient] Optional Discord.js client instance for immediate attachment
   */
  constructor(botToken: string, discordClient?: any) {
    this.botToken = botToken;
    this.startTime = Date.now();
    this.bot = discordClient; // optional discord js client integration
  }

  /**
   * Attach a Discord.js client to enable real-time statistics and data.
   * Should be called after Discord client is ready and connected.
   * 
   * @param {any} client - Discord.js client instance
   */
  setBotClient(client: any): void {
    this.bot = client;
    logger.info('Discord client attached to service');
  }

  /**
   * Get comprehensive Cogworks Bot statistics.
   * Returns real-time data if Discord client is attached, fallback data otherwise.
   * 
   * @returns {Promise<CogworksStats>} Detailed bot statistics including guild count, memory usage, and performance metrics
   * @throws {Error} When statistics retrieval fails
   */
  async getStats(): Promise<CogworksStats> {
    try {
      if (this.bot && this.bot.isReady()) {
        // real discord js stats
        return {
          guilds: this.bot.guilds.cache.size,
          users: this.bot.users.cache.size,
          channels: this.bot.channels.cache.size,
          uptime: Math.floor((Date.now() - this.startTime) / 1000),
          memoryUsage: process.memoryUsage(),
          ping: this.bot.ws.ping,
          version: process.env.npm_package_version || '2.0.0'
        };
      } else {
        // fallback stats when bot is not connected
        return {
          guilds: 0,
          users: 0,
          channels: 0,
          uptime: Math.floor((Date.now() - this.startTime) / 1000),
          memoryUsage: process.memoryUsage(),
          ping: -1,
          version: process.env.npm_package_version || '2.0.0'
        };
      }
    } catch (error) {
      logger.error('Failed to fetch Discord bot stats:', error);
      throw error;
    }
  }

  /**
   * Get Cogworks Bot profile and config info.
   * Includes bot identity, features, and current status.
   * 
   * @returns {Promise<CogworksInfo>} Bot profile data including username, avatar, and feature list
   * @throws {Error} When bot information retrieval fails
   */
  async getBotInfo(): Promise<CogworksInfo> {
    try {
      if (this.bot && this.bot.isReady() && this.bot.user) {
        // real discord js bot info
        return {
          username: this.bot.user.username,
          discriminator: this.bot.user.discriminator,
          id: this.bot.user.id,
          avatar: this.bot.user.displayAvatarURL(),
          status: 'online',
          name: 'Cogworks Bot',
          description: 'Advanced Discord bot for Nindroid Systems',
          features: [
            'Music playback',
            'Server moderation',
            'Custom commands',
            'Smart light integration',
            'API endpoints'
          ]
        };
      } else {
        // fallback info when bot is not connected
        return {
          username: 'Cogworks Bot',
          discriminator: '0000',
          id: 'unknown',
          avatar: '',
          status: 'offline',
          name: 'Cogworks Bot',
          description: 'Advanced Discord bot for Nindroid Systems',
          features: [
            'Music playback',
            'Server moderation',
            'Custom commands',
            'Smart light integration',
            'API endpoints'
          ]
        };
      }
    } catch (error) {
      logger.error('Failed to fetch Discord bot info:', error);
      throw error;
    }
  }

  /**
   * Get current Cogworks Bot status and connectivity info.
   * Provides real-time status data for health monitoring.
   * 
   * @returns {CogworksStatus} Current bot connectivity status, uptime, and performance metrics
   */
  getStatus(): CogworksStatus {
    try {
      const uptime = Date.now() - this.startTime;
      return {
        online: this.bot ? this.bot.isReady() : false,
        uptime: Math.floor(uptime / 1000),
        ping: this.bot ? this.bot.ws.ping : -1,
        guilds: this.bot ? this.bot.guilds.cache.size : 0,
        users: this.bot ? this.bot.users.cache.size : 0,
        lastRestart: new Date(this.startTime).toISOString(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get Discord bot status:', error);
      return {
        online: false,
        uptime: 0,
        ping: -1,
        guilds: 0,
        users: 0,
        lastRestart: new Date(this.startTime).toISOString(),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get list of registered Discord slash commands.
   * Returns all available bot commands with descriptions and options.
   * 
   * @returns {Promise<CogworksCommandInfo[]>} Array of available bot commands with metadata
   * @throws {Error} When command retrieval fails
   */
  async getCommands(): Promise<CogworksCommandInfo[]> {
    try {
      if (this.bot && this.bot.isReady() && this.bot.application?.commands?.cache) {
        return this.bot.application.commands.cache.map((cmd: any) => ({
          name: cmd.name,
          description: cmd.description,
          options: cmd.options || []
        }));
      } else {
        // return empty array if bot not ready or no commands
        return [];
      }
    } catch (error) {
      logger.error('Failed to fetch Discord bot commands:', error);
      return [];
    }
  }

  /**
   * Get formatted uptime info.
   * Calculates and formats bot uptime in days, hours, minutes, and seconds.
   * 
   * @returns {CogworksUptimeInfo} Uptime data with both raw seconds and formatted string
   */
  getUptime(): CogworksUptimeInfo {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;

    return {
      uptime: uptimeSeconds,
      formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`,
      startTime: new Date(this.startTime).toISOString()
    };
  }

  /**
   * Check if Cogworks bot is healthy and operational.
   * Performs basic connectivity and readiness checks.
   * 
   * @returns {boolean} True if bot is connected and ready, false otherwise
   */
  isHealthy(): boolean {
    try {
      // return true if bot is connected and ready
      return this.bot ? this.bot.isReady() : false;
    } catch (error) {
      logger.error('Discord health check failed:', error);
      return false;
    }
  }

  /**
   * Get ping response data for connectivity testing.
   * Provides simple pong response with timestamp and uptime (for /ping endpoint).
   * 
   * @returns {object} Ping response with message, timestamp, and uptime
   * @returns {string} returns.message - Always returns "pong"
   * @returns {string} returns.timestamp - ISO timestamp of the response
   * @returns {number} returns.uptime - Service uptime in seconds
   */
  getPing(): { message: string; timestamp: string; uptime: number } {
    return {
      message: 'pong',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000)
    };
  }
}