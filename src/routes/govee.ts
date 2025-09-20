/**
 * @fileoverview Govee Smart Light API Routes
 * @description Express routes for controlling Govee smart lighting devices, including device management, group control, and preset applications.
 */

import { Router, Request, Response } from 'express';
import { ApiResponse } from '../types/api.ts';
import { GoveeDevice, DeviceGroup, LightPreset } from '../types/govee.ts';
import { GoveeService } from '../services/goveeService.ts';
import { goveeControlLimiter } from '../middleware/rateLimiter.ts';

/**
 * Create Govee smart light routes with service dependency.
 * 
 * @param {GoveeService} goveeService Govee service instance
 * @returns {Router} Express router with Govee control endpoints
 */
export const createGoveeRoutes = (goveeService: GoveeService): Router => {
  const router = Router();

  /**
   * GET /api/govee/devices
   * Retrieve all Govee devices and their organized groups
   * 
   * @route GET /api/govee/devices
   * @returns {ApiResponse<{devices: GoveeDevice[], groups: DeviceGroup[]}>} All devices and groups
   * @returns {200} Devices retrieved successfully
   * @returns {500} Failed to fetch devices
   */
  router.get('/devices', async (req: Request, res: Response<ApiResponse<{
    devices: GoveeDevice[];
    groups: DeviceGroup[];
  }>>) => {
    try {
      const devices = await goveeService.getDevices();
      const groups = goveeService.getDeviceGroups();
      
      res.json({
        success: true,
        data: { devices, groups },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch devices',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/govee/presets
   * Get all available lighting presets
   * 
   * @route GET /api/govee/presets
   * @returns {ApiResponse<LightPreset[]>} Array of available lighting presets
   * @returns {200} Presets retrieved successfully
   * @returns {500} Failed to fetch presets
   */
  router.get('/presets', (req: Request, res: Response<ApiResponse<LightPreset[]>>) => {
    try {
      const presets = goveeService.getPresets();
      
      res.json({
        success: true,
        data: presets,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch presets',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * PUT /api/govee/control
   * Control an individual Govee device
   * Rate limited to 10 requests per minute
   * 
   * @route PUT /api/govee/control
   * @param {object} req.body Control request parameters
   * @param {string} req.body.device Device MAC address
   * @param {string} req.body.model Device model number
   * @param {object} req.body.command Command to execute
   * @param {string} req.body.command.name Command name
   * @param {any} req.body.command.value Command value
   * @returns {ApiResponse} Control result from Govee API
   * @returns {200} Device controlled successfully
   * @returns {400} Missing required parameters
   * @returns {500} Device control failed
   * @returns {429} Rate limit exceeded
   */
  router.put('/control', goveeControlLimiter, async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { device, model, command } = req.body;

      if (!device || !model || !command) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: device, model, command',
          timestamp: new Date().toISOString()
        });
      }

      const result = await goveeService.controlDevice({
        device,
        model,
        cmd: command
      });
      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to control device',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * PUT /api/govee/control/group
   * Control all devices in a specific group
   * Rate limited to 10 requests per minute
   * 
   * @route PUT /api/govee/control/group
   * @param {object} req.body Group control parameters
   * @param {string} req.body.groupId Group identifier
   * @param {object} req.body.command Command to apply to all devices in group
   * @param {string} req.body.command.name Command name
   * @param {any} req.body.command.value Command value
   * @returns {ApiResponse} Group control result
   * @returns {200} Group controlled successfully
   * @returns {400} Missing required parameters
   * @returns {500} Group control failed
   * @returns {429} Rate limit exceeded
   */
  router.put('/control/group', goveeControlLimiter, async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { groupId, command } = req.body;

      if (!groupId || !command) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: groupId, command',
          timestamp: new Date().toISOString()
        });
      }

      await goveeService.controlGroup(groupId, command);
      
      res.json({
        success: true,
        data: { message: `Group ${groupId} controlled successfully` },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to control device group',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * PUT /api/govee/control/all
   * Control all discovered Govee devices at once
   * Rate limited to 10 requests per minute
   * 
   * @route PUT /api/govee/control/all
   * @param {object} req.body Universal control parameters
   * @param {object} req.body.command Command to apply to all devices
   * @param {string} req.body.command.name Command name
   * @param {any} req.body.command.value Command value
   * @returns {ApiResponse} Universal control result
   * @returns {200} All devices controlled successfully
   * @returns {400} Missing required parameters
   * @returns {500} Device control failed
   * @returns {429} Rate limit exceeded
   */
  router.put('/control/all', goveeControlLimiter, async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { command } = req.body;

      if (!command) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: command',
          timestamp: new Date().toISOString()
        });
      }

      await goveeService.setAllDevices(command);
      
      res.json({
        success: true,
        data: { message: 'All devices controlled successfully' },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to control all devices',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * PUT /api/govee/preset/:presetId
   * Apply a predefined lighting preset to configured devices
   * Rate limited to 10 requests per minute
   * 
   * @route PUT /api/govee/preset/:presetId
   * @param {string} presetId Preset identifier
   * @returns {ApiResponse} Preset application result
   * @returns {200} Preset applied successfully
   * @returns {500} Preset application failed
   * @returns {429} Rate limit exceeded
   */
  router.put('/preset/:presetId', goveeControlLimiter, async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { presetId } = req.params;

      await goveeService.applyPreset(presetId!);
      
      res.json({
        success: true,
        data: { message: `Preset ${presetId} applied successfully` },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to apply preset',
        timestamp: new Date().toISOString()
      });
    }
  });

  return router;
};