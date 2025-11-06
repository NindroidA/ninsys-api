/**
 * @fileoverview User Preferences Routes
 * @description Express routes for user preferences management
 */

import { Router, Request, Response } from 'express';
import { userPreferencesService } from '../../services/racksmith/preferencesService.js';
import { requireRackSmithAuth } from '../../middleware/racksmith/authHandler.js';

export const createUserPreferencesRoutes = (): Router => {
  const router = Router();

  // All routes require authentication
  router.use(requireRackSmithAuth);

  /**
   * Get user preferences
   * 
   * @route GET /api/users/me/preferences
   * @returns {object} { success, data: preferences }
   */
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.rackSmithUser!.id;
      const preferences = await userPreferencesService.getPreferences(userId);

      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      console.error('Error getting preferences:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get preferences'
      });
    }
  });

  /**
   * Update all preferences (full replacement)
   * 
   * @route PUT /api/users/me/preferences
   * @body {object} theme - Theme preferences
   * @body {object} defaults - Default values
   * @body {object} view - View preferences
   * @body {object} notifications - Notification preferences
   */
  router.put('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.rackSmithUser!.id;
      const { theme, defaults, view, notifications } = req.body;

      const preferences = await userPreferencesService.updatePreferences(userId, {
        theme,
        defaults,
        view,
        notifications
      });

      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update preferences'
      });
    }
  });

  /**
   * Partial update preferences (merge with existing)
   * 
   * @route PATCH /api/users/me/preferences
   * @body {object} theme - Partial theme preferences
   * @body {object} defaults - Partial default values
   * @body {object} view - Partial view preferences
   * @body {object} notifications - Partial notification preferences
   */
  router.patch('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.rackSmithUser!.id;
      const { theme, defaults, view, notifications } = req.body;

      const preferences = await userPreferencesService.patchPreferences(userId, {
        theme,
        defaults,
        view,
        notifications
      });

      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      console.error('Error patching preferences:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update preferences'
      });
    }
  });

  /**
   * Reset preferences to defaults
   * 
   * @route POST /api/users/me/preferences/reset
   */
  router.post('/reset', async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.rackSmithUser!.id;
      const preferences = await userPreferencesService.resetPreferences(userId);

      res.json({
        success: true,
        data: preferences,
        message: 'Preferences reset to defaults'
      });
    } catch (error) {
      console.error('Error resetting preferences:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset preferences'
      });
    }
  });

  return router;
};
