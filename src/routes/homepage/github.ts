/**
 * @fileoverview GitHub Routes for Homepage API
 * @description Express routes for GitHub integration
 */

import { Router, Request, Response } from 'express';
import { githubService } from '../../services/homepage/githubService.js';
import { requireAuth } from '../../middleware/shared/authHandler.js';
import { logger } from '../../utils/logger.js';

export const createGitHubRoutes = (): Router => {
  const router = Router();

  /**
   * GET /api/github/repos
   * Fetch repositories from GitHub (public, uses server-stored PAT)
   */
  router.get('/repos', async (req: Request, res: Response): Promise<void> => {
    try {
      if (!githubService.isConfigured()) {
        res.status(503).json({
          success: false,
          error: 'GitHub integration not configured. Add GITHUB_PAT to environment variables.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const filters = {
        per_page: req.query.per_page ? parseInt(req.query.per_page as string) : undefined,
        sort: req.query.sort as 'updated' | 'pushed' | 'full_name' | 'created' | undefined,
        direction: req.query.direction as 'asc' | 'desc' | undefined,
        type: req.query.type as 'all' | 'owner' | 'public' | 'private' | undefined,
      };

      const result = await githubService.getRepositories(filters);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to fetch GitHub repos:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch repositories';
      res.status(500).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /api/github/repos/:owner/:repo
   * Get a specific repository (public, uses server-stored PAT)
   */
  router.get('/repos/:owner/:repo', async (req: Request, res: Response): Promise<void> => {
    try {
      if (!githubService.isConfigured()) {
        res.status(503).json({
          success: false,
          error: 'GitHub integration not configured. Add GITHUB_PAT to environment variables.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const owner = req.params.owner as string;
      const repo = req.params.repo as string;
      const repoData = await githubService.getRepository(owner, repo);

      if (!repoData) {
        res.status(404).json({
          success: false,
          error: 'Repository not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        success: true,
        data: repoData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to fetch GitHub repo:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch repository';
      res.status(500).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * POST /api/github/import/:repoName
   * Import a GitHub repo as a project (requires auth)
   */
  router.post('/import/:repoName', requireAuth as any, async (req: Request, res: Response): Promise<void> => {
    try {
      if (!githubService.isConfigured()) {
        res.status(503).json({
          success: false,
          error: 'GitHub integration not configured. Add GITHUB_PAT to environment variables.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { repoName } = req.params;

      if (!repoName) {
        res.status(400).json({
          success: false,
          error: 'Repository name is required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const project = await githubService.importAsProject(repoName);

      res.status(201).json({
        success: true,
        data: { project },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to import GitHub repo:', error);
      const message = error instanceof Error ? error.message : 'Failed to import repository';
      const status = message.includes('not found') ? 404 : 500;
      res.status(status).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * POST /api/github/cache/clear
   * Clear the GitHub API cache (requires auth)
   */
  router.post('/cache/clear', requireAuth as any, async (req: Request, res: Response): Promise<void> => {
    try {
      githubService.clearCache();

      res.json({
        success: true,
        message: 'GitHub cache cleared',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to clear GitHub cache:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache',
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
};
