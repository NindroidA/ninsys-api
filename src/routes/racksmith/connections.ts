/**
 * @fileoverview Connection Routes for RackSmith
 * @description API routes for connection management
 */

import { Router, Request, Response } from 'express';
import { connectionsService } from '../../services/racksmith/connectionsService.js';
import { requireRackSmithAuth } from '../../middleware/racksmith/authHandler.js';
import { logger } from '../../utils/logger.js';

export const createConnectionRoutes = (): Router => {
  const router = Router();
  router.use(requireRackSmithAuth);

  router.get('/', async (req: Request, res: Response) => {
    try {
      const userId = req.rackSmithUser!.id;
      const filters = {
        deviceId: req.query.deviceId as string,
        cableType: req.query.cableType as string,
        vlan: req.query.vlan as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };

      const result = await connectionsService.listConnections(userId, filters);
      res.json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (error) {
      logger.error('Failed to list connections:', error);
      res.status(500).json({ success: false, error: 'Failed to list connections', timestamp: new Date().toISOString() });
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const userId = req.rackSmithUser!.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ success: false, error: 'Connection ID is required', timestamp: new Date().toISOString() });
      }

      const connection = await connectionsService.getConnection(id, userId);
      res.json({ success: true, data: connection, timestamp: new Date().toISOString() });
    } catch (error) {
      logger.error('Failed to get connection:', error);
      const message = error instanceof Error ? error.message : 'Failed to get connection';
      const status = message === 'Connection not found' ? 404 : 500;
      res.status(status).json({ success: false, error: message, timestamp: new Date().toISOString() });
    }
  });

  router.post('/', async (req: Request, res: Response) => {
    try {
      const userId = req.rackSmithUser!.id;
      const connection = await connectionsService.createConnection(userId, req.body);
      res.status(201).json({ success: true, data: connection, timestamp: new Date().toISOString() });
    } catch (error) {
      logger.error('Failed to create connection:', error);
      const message = error instanceof Error ? error.message : 'Failed to create connection';
      res.status(400).json({ success: false, error: message, timestamp: new Date().toISOString() });
    }
  });

  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const userId = req.rackSmithUser!.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ success: false, error: 'Connection ID is required', timestamp: new Date().toISOString() });
      }

      const connection = await connectionsService.updateConnection(id, userId, req.body);
      res.json({ success: true, data: connection, timestamp: new Date().toISOString() });
    } catch (error) {
      logger.error('Failed to update connection:', error);
      const message = error instanceof Error ? error.message : 'Failed to update connection';
      res.status(404).json({ success: false, error: message, timestamp: new Date().toISOString() });
    }
  });

  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const userId = req.rackSmithUser!.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ success: false, error: 'Connection ID is required', timestamp: new Date().toISOString() });
      }

      const result = await connectionsService.deleteConnection(id, userId);
      res.json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (error) {
      logger.error('Failed to delete connection:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete connection';
      res.status(404).json({ success: false, error: message, timestamp: new Date().toISOString() });
    }
  });

  return router;
};
