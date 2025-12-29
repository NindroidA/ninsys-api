/**
 * @fileoverview About Routes for Homepage API
 * @description Express routes for about page content management
 */

import { Router, Request, Response } from 'express';
import { aboutService } from '../../services/homepage/aboutService.js';
import { requireAuth } from '../../middleware/shared/authHandler.js';
import { logger } from '../../utils/logger.js';

export const createAboutRoutes = (): Router => {
  const router = Router();

  /**
   * GET /api/about
   * Get about page data (public)
   */
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const aboutData = await aboutService.getAboutContent();

      res.json({
        success: true,
        data: aboutData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get about content:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch about content',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * PUT /api/about
   * Update about page data (requires auth)
   */
  router.put('/', requireAuth as any, async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        res.status(400).json({
          success: false,
          error: 'Request body is required. Ensure Content-Type is application/json',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { profile, sections } = req.body;

      if (!profile && !sections) {
        res.status(400).json({
          success: false,
          error: 'At least one of profile or sections must be provided',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const aboutData = await aboutService.updateAboutContent({ profile, sections });

      res.json({
        success: true,
        data: aboutData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to update about content:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update about content',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * PUT /api/about/sections
   * Reorder sections (requires auth)
   */
  router.put('/sections', requireAuth as any, async (req: Request, res: Response): Promise<void> => {
    try {
      const { sections } = req.body;

      if (!sections || !Array.isArray(sections)) {
        res.status(400).json({
          success: false,
          error: 'sections must be an array of { id, order } objects',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const aboutData = await aboutService.updateSectionsOrder(sections);

      res.json({
        success: true,
        data: aboutData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to reorder sections:', error);
      const message = error instanceof Error ? error.message : 'Failed to reorder sections';
      res.status(500).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * POST /api/about/sections
   * Add a new section (requires auth)
   */
  router.post('/sections', requireAuth as any, async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, title, icon, order, size, content } = req.body;

      // Validation
      if (!type || !title || order === undefined || !size || !content) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: type, title, order, size, content',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const validTypes = ['skills', 'interests', 'experience', 'education', 'custom'];
      if (!validTypes.includes(type)) {
        res.status(400).json({
          success: false,
          error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const validSizes = ['small', 'medium', 'large'];
      if (!validSizes.includes(size)) {
        res.status(400).json({
          success: false,
          error: `Invalid size. Must be one of: ${validSizes.join(', ')}`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const aboutData = await aboutService.addSection({
        type,
        title,
        icon,
        order,
        size,
        content,
      });

      res.status(201).json({
        success: true,
        data: aboutData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to add section:', error);
      const message = error instanceof Error ? error.message : 'Failed to add section';
      res.status(500).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * PUT /api/about/sections/:sectionId
   * Update a specific section (requires auth)
   */
  router.put('/sections/:sectionId', requireAuth as any, async (req: Request, res: Response): Promise<void> => {
    try {
      const sectionId = req.params.sectionId as string;
      const updates = req.body;

      // Validate type if provided
      if (updates.type) {
        const validTypes = ['skills', 'interests', 'experience', 'education', 'custom'];
        if (!validTypes.includes(updates.type)) {
          res.status(400).json({
            success: false,
            error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }

      // Validate size if provided
      if (updates.size) {
        const validSizes = ['small', 'medium', 'large'];
        if (!validSizes.includes(updates.size)) {
          res.status(400).json({
            success: false,
            error: `Invalid size. Must be one of: ${validSizes.join(', ')}`,
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }

      const aboutData = await aboutService.updateSection(sectionId, updates);

      res.json({
        success: true,
        data: aboutData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to update section:', error);
      const message = error instanceof Error ? error.message : 'Failed to update section';
      const status = message === 'Section not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * DELETE /api/about/sections/:sectionId
   * Delete a section (requires auth)
   */
  router.delete('/sections/:sectionId', requireAuth as any, async (req: Request, res: Response): Promise<void> => {
    try {
      const sectionId = req.params.sectionId as string;
      const aboutData = await aboutService.deleteSection(sectionId);

      res.json({
        success: true,
        data: aboutData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to delete section:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete section';
      res.status(500).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
};
