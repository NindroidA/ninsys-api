/**
 * @fileoverview Projects Routes for Homepage API
 * @description Express routes for portfolio project management
 */

import { Router, Request, Response } from 'express';
import { projectsService } from '../../services/homepage/projectsService.js';
import { requireAuth } from '../../middleware/shared/authHandler.js';
import { logger } from '../../utils/logger.js';
import type { ProjectCategory } from '../../types/homepage/project.js';

export const createProjectsRoutes = (): Router => {
  const router = Router();

  /**
   * GET /api/projects
   * List all projects (public)
   */
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: { category?: ProjectCategory; featured?: boolean } = {};

      if (req.query.category) {
        filters.category = req.query.category as ProjectCategory;
      }

      if (req.query.featured !== undefined) {
        filters.featured = req.query.featured === 'true';
      }

      const projects = await projectsService.getAllProjects(filters);

      res.json({
        success: true,
        data: { projects },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to list projects:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch projects',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /api/projects/:id
   * Get a single project (public)
   */
  router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const project = await projectsService.getProjectById(id);

      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        success: true,
        data: project,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch project',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * POST /api/projects
   * Create a new project (requires auth)
   */
  router.post('/', requireAuth as any, async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, description, technologies, category, image, githubUrl, liveUrl, date, featured, order } = req.body;

      // Validation
      if (!title || !description || !technologies || !category || !date) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: title, description, technologies, category, date',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!Array.isArray(technologies)) {
        res.status(400).json({
          success: false,
          error: 'Technologies must be an array',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!['current', 'completed'].includes(category)) {
        res.status(400).json({
          success: false,
          error: 'Category must be "current" or "completed"',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const project = await projectsService.createProject({
        title,
        description,
        technologies,
        category,
        image,
        githubUrl,
        liveUrl,
        date,
        featured,
        order,
      });

      res.status(201).json({
        success: true,
        data: project,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to create project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create project',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * PUT /api/projects/reorder
   * Reorder projects (requires auth)
   * Must be before /:id route to avoid conflict
   */
  router.put('/reorder', requireAuth as any, async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectIds } = req.body;

      if (!projectIds || !Array.isArray(projectIds)) {
        res.status(400).json({
          success: false,
          error: 'projectIds must be an array of project IDs',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      await projectsService.reorderProjects(projectIds);

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to reorder projects:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reorder projects',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * PUT /api/projects/:id
   * Update a project (requires auth)
   */
  router.put('/:id', requireAuth as any, async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const updates = req.body;

      // Validate category if provided
      if (updates.category && !['current', 'completed'].includes(updates.category)) {
        res.status(400).json({
          success: false,
          error: 'Category must be "current" or "completed"',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Validate technologies if provided
      if (updates.technologies && !Array.isArray(updates.technologies)) {
        res.status(400).json({
          success: false,
          error: 'Technologies must be an array',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const project = await projectsService.updateProject(id, updates);

      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        success: true,
        data: project,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to update project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update project',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * DELETE /api/projects/:id
   * Delete a project (requires auth)
   */
  router.delete('/:id', requireAuth as any, async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const deleted = await projectsService.deleteProject(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to delete project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete project',
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
};
