/**
 * @fileoverview Cogworks Bot Types
 * @description TypeScript definitions for Cogworks Bot integration.
 */

/**
 * Bot registration payload (sent on startup).
 * @interface BotRegistrationPayload
 */
export interface BotRegistrationPayload {
  botId: string;
  username: string;
  guilds: number;
  users: number;
  uptime: number;
  memoryUsage: number;
  version: string;
  environment: 'production' | 'development';
}

/**
 * Bot stats update payload (sent every 5 minutes).
 * @interface BotStatsPayload
 */
export interface BotStatsPayload {
  botId: string;
  username: string;
  guilds: number;
  users: number;
  uptime: number;
  memoryUsage: number;
  version: string;
  environment: 'production' | 'development';
}

/**
 * Bot health check response from localhost:3000/health/ready
 * @interface BotHealthResponse
 */
export interface BotHealthResponse {
  ready?: boolean;
  alive?: boolean;
  uptime: number;
  timestamp: string;
}

/**
 * Public status endpoint response.
 * @interface CogworksPublicStatus
 */
export interface CogworksPublicStatus {
  online: boolean;
  ready: boolean;
  guilds: number;
  users: number;
  uptime: number;
  memoryUsageMB: number;
  version: string;
  lastUpdate: string;
  healthStatus: {
    ready: boolean;
    alive: boolean;
    lastCheck: string;
  };
}

/**
 * Internal bot data store.
 * @interface CogworksDataStore
 */
export interface CogworksDataStore {
  botId: string | null;
  username: string | null;
  guilds: number;
  users: number;
  uptime: number;
  memoryUsage: number;
  version: string | null;
  environment: 'production' | 'development' | null;
  lastUpdate: Date | null;
  healthStatus: {
    ready: boolean;
    alive: boolean;
    lastCheck: Date | null;
  };
}

/**
 * Cogworks Bot status info (legacy).
 * @interface CogworksStatus
 */
export interface CogworksStatus {
  online: boolean;
  uptime: number;
  ping: number;
  guilds: number;
  users: number;
  lastRestart: string;
  timestamp: string;
}

/**
 * Cogworks Bot statistics (legacy).
 * @interface CogworksStats
 */
export interface CogworksStats {
  guilds: number;
  users: number;
  channels: number;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  ping: number;
  version: string;
}

/**
 * Cogworks Bot profile info (legacy).
 * @interface CogworksInfo
 */
export interface CogworksInfo {
  username: string;
  discriminator: string;
  id: string;
  avatar: string;
  status: string;
  name?: string;
  description?: string;
  features?: string[];
}

/**
 * Cogworks slash command info.
 * @interface CogworksCommandInfo
 */
export interface CogworksCommandInfo {
  name: string;
  description: string;
  options: any[];
}

/**
 * Cogworks uptime info with formatting.
 * @interface CogworksUptimeInfo
 */
export interface CogworksUptimeInfo {
  uptime: number;
  formatted: string;
  startTime: string;
}
