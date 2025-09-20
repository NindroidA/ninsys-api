
/**
 * @fileoverview Health Check Routes
 * @description Express routes for system and service health monitoring. Provides endpoints for overall system health and Cogworks Bot status.
 */

import { Router, Request, Response } from 'express';
import { ApiResponse, HealthCheck } from '../types/api.ts';
import { CogworksStatus } from '../types/cogworks.ts';
import { GoveeService } from '../services/goveeService.ts';
import { DiscordService } from '../services/discordService.ts';

/**
 * Create health check routes with service dependencies.
 * 
 * @param {GoveeService} goveeService Govee smart light service instance
 * @param {DiscordService} discordService Cogworks Bot service instance
 * @returns {Router} Express router with health check endpoints
 */
export const createHealthRoutes = (goveeService: GoveeService, discordService: DiscordService): Router => {
  const router = Router();

  /**
   * GET /health
   * System-wide health check endpoint
   * 
   * @route GET /health
   * @returns {ApiResponse<HealthCheck>} Overall system health status
   * @returns {200} System is healthy
   * @returns {500} Health check failed
   */
  router.get('/', async (req: Request, res: Response<ApiResponse<HealthCheck>>) => {
    try {
      const memUsage = process.memoryUsage();
      
      const healthData: HealthCheck = {
        status: 'healthy',
        uptime: process.uptime(),
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024),
          total: Math.round(memUsage.heapTotal / 1024 / 1024)
        },
        services: {
          govee: true, // pershlaps will add actual Govee API health check in the future
          cogworks: discordService.isHealthy()
        }
      };

      res.json({
        success: true,
        data: healthData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Health check failed!',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /health/cogworks-bot
   * Cogworks Bot specific health check
   * 
   * @route GET /health/cogworks-bot
   * @returns {CogworksStatus} Cogworks Bot connectivity and status
   * @returns {200} Bot status retrieved successfully
   * @returns {500} Bot health check failed
   */
  router.get('/bot', (req: Request, res: Response) => {
    try {
      const status = discordService.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({
        online: false,
        error: 'Health check failed!',
        timestamp: new Date().toISOString()
      });
    }
  });

  return router;
};