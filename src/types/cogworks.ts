/**
 * @fileoverview Cogworks Bot Types
 * @description TypeScript definitions for Cogworks Bot integration.
 */

/**
 * Cogworks Bot status info.
 * @interface CogworksStatus
 */
export interface CogworksStatus {
  online: boolean;      // whether the bot is online and connected
  uptime: number;       // bot uptime in seconds
  ping: number;         // websocket ping latency in milliseconds
  guilds: number;       // number of discord servers (guilds) the bot is in
  users: number;        // number of cached discord users
  lastRestart: string;  // ISO timestamp of last bot restart
  timestamp: string;    // ISO timestamp of status check
}

/**
 * Cogworks Bot statistics.
 * @interface CogworksStats
 */
export interface CogworksStats {
  guilds: number;                  // number of discord servers (guilds)
  users: number;                   // number of cached discord users
  channels: number;                // number of cached discord channels
  uptime: number;                  // bot uptime in seconds
  memoryUsage: NodeJS.MemoryUsage; // node memory usage stats
  ping: number;                    // websocket ping latency in milliseconds
  version: string;                 // bot version string
}

/**
 * Cogworks Bot profile info.
 * @interface CogworksInfo
 */
export interface CogworksInfo {
  username: string;      // bot username
  discriminator: string; // bot discriminator
  id: string;            // bot discord id
  avatar: string;        // url to bot avatar image
  status: string;        // current bot status
  name?: string;         // optional display name for bot
  description?: string;  // optional description of bot functionality
  features?: string[];   // optional array of bot feature descriptionbs
}

/**
 * Cogworks slash command info.
 * @interface CogworksCommandInfo
 */
export interface CogworksCommandInfo {
  name: string;        // cmd name
  description: string; // cmd description
  options: any[];      // array of cmd options/params
}

/**
 * Cogworks uptime info with formatting.
 * @interface CogworksUptimeInfo
 */
export interface CogworksUptimeInfo {
  uptime: number;    // raw uptime in seconds
  formatted: string; // formatted uptime string
  startTime: string; // ISO timestamp of bot start time
}

export interface CogworksDataStore {
  stats: CogworksStats | null;
  info: CogworksInfo | null;
  status: CogworksStatus | null;
  commands: CogworksCommandInfo[];
  lastUpdate: Date | null;
  isConnected: boolean;
}
