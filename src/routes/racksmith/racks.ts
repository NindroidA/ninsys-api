/**
 * @fileoverview RackSmith Racks Routes
 * @description CRUD operations for server racks
 */

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../typeorm/index.js';
import { Rack } from '../../typeorm/entities/Rack.js';
import { requireRackSmithAuth } from '../../middleware/racksmith/authHandler.js';

export const createRacksRoutes = (): Router => {
  const router = Router();
  const rackRepository = AppDataSource.getRepository(Rack);

  // All routes require authentication
  router.use(requireRackSmithAuth);

  /**
   * Get all racks for the authenticated user
   * 
   * @route GET /api/racksmith/racks
   * @query {number} page - Page number (default: 1)
   * @query {number} limit - Items per page (default: 10)
   * @query {string} search - Search by name or location
   */
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.rackSmithUser!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      const skip = (page - 1) * limit;

      const queryBuilder = rackRepository
        .createQueryBuilder('rack')
        .where('rack.userId = :userId', { userId })
        .leftJoinAndSelect('rack.devices', 'devices')
        .skip(skip)
        .take(limit)
        .orderBy('rack.createdAt', 'DESC');

      if (search) {
        queryBuilder.andWhere(
          '(rack.name LIKE :search OR rack.location LIKE :search)',
          { search: `%${search}%` }
        );
      }

      const [racks, total] = await queryBuilder.getManyAndCount();

      res.json({
        success: true,
        data: racks,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting racks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get racks'
      });
    }
  });

  /**
   * Get a specific rack by ID
   * 
   * @route GET /api/racksmith/racks/:id
   */
  router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.rackSmithUser!.id;
      const { id } = req.params;

      const rack = await rackRepository.findOne({
        where: { id, userId },
        relations: ['devices']
      });

      if (!rack) {
        res.status(404).json({
          success: false,
          error: 'Rack not found'
        });
        return;
      }

      res.json({
        success: true,
        data: rack
      });
    } catch (error) {
      console.error('Error getting rack:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get rack'
      });
    }
  });

  /**
   * Create a new rack
   * 
   * @route POST /api/racksmith/racks
   * @body {string} name - Rack name
   * @body {string} location - Rack location
   * @body {number} sizeU - Rack size in U units
   */
  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.rackSmithUser!.id;
      const { name, location, sizeU } = req.body;

      // Validation
      if (!name || !location || !sizeU) {
        res.status(400).json({
          success: false,
          error: 'Name, location, and sizeU are required'
        });
        return;
      }

      if (sizeU < 1 || sizeU > 100) {
        res.status(400).json({
          success: false,
          error: 'Size must be between 1 and 100 U'
        });
        return;
      }

      const rack = rackRepository.create({
        name,
        location,
        sizeU,
        userId
      });

      await rackRepository.save(rack);

      res.status(201).json({
        success: true,
        data: rack
      });
    } catch (error) {
      console.error('Error creating rack:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create rack'
      });
    }
  });

  /**
   * Update a rack
   * 
   * @route PUT /api/racksmith/racks/:id
   * @body {string} name - Rack name
   * @body {string} location - Rack location
   * @body {number} sizeU - Rack size in U units
   */
  router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.rackSmithUser!.id;
      const { id } = req.params;
      const { name, location, sizeU } = req.body;

      const rack = await rackRepository.findOne({
        where: { id, userId }
      });

      if (!rack) {
        res.status(404).json({
          success: false,
          error: 'Rack not found'
        });
        return;
      }

      // Update fields if provided
      if (name) rack.name = name;
      if (location) rack.location = location;
      if (sizeU) {
        if (sizeU < 1 || sizeU > 100) {
          res.status(400).json({
            success: false,
            error: 'Size must be between 1 and 100 U'
          });
          return;
        }
        rack.sizeU = sizeU;
      }

      await rackRepository.save(rack);

      res.json({
        success: true,
        data: rack
      });
    } catch (error) {
      console.error('Error updating rack:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update rack'
      });
    }
  });

  /**
   * Delete a rack
   * 
   * @route DELETE /api/racksmith/racks/:id
   */
  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.rackSmithUser!.id;
      const { id } = req.params;

      const rack = await rackRepository.findOne({
        where: { id, userId },
        relations: ['devices']
      });

      if (!rack) {
        res.status(404).json({
          success: false,
          error: 'Rack not found'
        });
        return;
      }

      // Check if rack has devices
      if (rack.devices && rack.devices.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Cannot delete rack with devices. Remove devices first.'
        });
        return;
      }

      await rackRepository.remove(rack);

      res.json({
        success: true,
        message: 'Rack deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting rack:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete rack'
      });
    }
  });

  return router;
};
