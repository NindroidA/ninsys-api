/**
 * @fileoverview Device Routes for RackSmith
 * @description API routes for device management
 */

import { Router, Request, Response } from 'express';
import { devicesService } from '../../services/racksmith/devicesService.js';
import { requireRackSmithAuth } from '../../middleware/racksmith/authHandler.js';
import { logger } from '../../utils/logger.js';

export const createDeviceRoutes = (): Router => {
  const router = Router();

  // All routes require authentication
  router.use(requireRackSmithAuth);

  /**
   * GET /api/racksmith/devices
   * List devices with pagination and filtering
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const userId = req.rackSmithUser!.id;

      const filters = {
        rackId: req.query.rackId as string,
        type: req.query.type as string,
        manufacturer: req.query.manufacturer as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };

      const result = await devicesService.listDevices(userId, filters);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to list devices:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list devices',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/racksmith/devices/:id
   * Get single device
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const userId = req.rackSmithUser!.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Device ID is required',
          timestamp: new Date().toISOString()
        });
      }

      const device = await devicesService.getDevice(id, userId);

      res.json({
        success: true,
        data: device,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to get device:', error);
      const message = error instanceof Error ? error.message : 'Failed to get device';
      const status = message === 'Device not found' ? 404 : 500;

      res.status(status).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /api/racksmith/devices
   * Create a new device
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const userId = req.rackSmithUser!.id;

      const device = await devicesService.createDevice(userId, req.body);

      res.status(201).json({
        success: true,
        data: device,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to create device:', error);
      const message = error instanceof Error ? error.message : 'Failed to create device';
      const status = message.includes('not found') || message.includes('occupied') ? 400 : 500;

      res.status(status).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * PUT /api/racksmith/devices/:id
   * Update a device
   */
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const userId = req.rackSmithUser!.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Device ID is required',
          timestamp: new Date().toISOString()
        });
      }

      const device = await devicesService.updateDevice(id, userId, req.body);

      res.json({
        success: true,
        data: device,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to update device:', error);
      const message = error instanceof Error ? error.message : 'Failed to update device';
      const status = message.includes('not found') ? 404 : message.includes('occupied') ? 400 : 500;

      res.status(status).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * DELETE /api/racksmith/devices/:id
   * Delete a device (soft delete)
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const userId = req.rackSmithUser!.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Device ID is required',
          timestamp: new Date().toISOString()
        });
      }

      const result = await devicesService.deleteDevice(id, userId);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to delete device:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete device';
      const status = message === 'Device not found' ? 404 : 500;

      res.status(status).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      });
    }
  });

  return router;
};
