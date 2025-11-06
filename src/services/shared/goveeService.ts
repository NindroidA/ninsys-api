/**
 * @fileoverview Govee Smart Light Service
 * @description Service class for interacting with Govee API, managing devices, groups, and lighting presets for smart home automation.
 */

import axios, { AxiosInstance } from 'axios';
import { GoveeDevice, GoveeDevicesResponse, GoveeControlRequest, GoveeControlResponse, DeviceGroup, LightPreset } from '../../types/shared/govee.js';
import { GOVEE_BASE_URL, DEVICE_GROUPS, LIGHT_PRESETS } from '../../config/govee.js';
import { logger } from '../../utils/logger.js';

/**
 * Service class for managing Govee smart lighting devices.
 * Handles API communication, device grouping, and preset management.
 * 
 * @class GoveeService
 */
export class GoveeService {
  private client: AxiosInstance;            // axios http client configured for Govee API
  private devices: GoveeDevice[] = [];      // cached array if discovered Govee devices
  private deviceGroups: DeviceGroup[] = []; // organized device groups for logical control
  private populatedPresets: LightPreset[] = []; // presets with device commands populated

  /**
   * Initialize the Govee service with API credentials.
   * 
   * @param {string} apiKey - Govee API key for authentication
   */
  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: GOVEE_BASE_URL,
      headers: {
        'Govee-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  /**
   * Extract supported command names from Govee device capabilities.
   * Maps Govee capability types to standardized command names.
   * 
   * @param {any[]} capabilities Array of Govee device capabilities
   * @returns {string[]} Array of supported command names (turn, brightness, color, colorTem)
   */
  private extractSupportedCommands(capabilities: any[]): string[] {
    const commands: string[] = [];
    
    capabilities.forEach(cap => {
      switch (cap.type) {
        case 'devices.capabilities.on_off':
          commands.push('turn');
          break;
        case 'devices.capabilities.range':
          if (cap.instance === 'brightness') commands.push('brightness');
          break;
        case 'devices.capabilities.color_setting':
          if (cap.instance === 'colorRgb') commands.push('color');
          if (cap.instance === 'colorTemperatureK') commands.push('colorTem');
          break;
      }
    });
    
    return commands;
  }

  /**
   * Extract device properties from Govee capabilities for compatibility.
   * Converts Govee capability parameters to expected property format.
   * 
   * @param {any[]} capabilities Array of Govee device capabilities
   * @returns {any} Properties object with colorTem range if supported
   */
  private extractProperties(capabilities: any[]): any {
    const properties: any = {};
    
    const colorTempCap = capabilities.find(cap => 
      cap.type === 'devices.capabilities.color_setting' && 
      cap.instance === 'colorTemperatureK'
    );
    
    if (colorTempCap) {
      properties.colorTem = {
        range: {
          min: colorTempCap.parameters.range.min,
          max: colorTempCap.parameters.range.max
        }
      };
    }
    
    return properties;
  }

  /**
   * Fetch all available Govee devices from the API.
   * Automatically organizes devices into logical groups.
   * 
   * @returns {Promise<GoveeDevice[]>} Array of discovered devices
   * @throws {Error} When API request fails or returns error code
   */
  async getDevices(): Promise<GoveeDevice[]> {
    try {
      const response = await this.client.get<GoveeDevicesResponse>('/user/devices');
      
      if (response.data.code !== 200) {
        throw new Error(`Govee API error: ${response.data.message}`);
      }

      if (!response.data.data || !Array.isArray(response.data.data)) {
        logger.warn('No devices found in Govee API response');
        this.devices = [];
        this.organizeDeviceGroups();
        this.buildPresets();
        return this.devices;
      }

      this.devices = response.data.data.map((device: any) => ({
        device: device.device,
        model: device.sku,
        deviceName: device.deviceName,
        controllable: true, // assume controllable if it has capabilities
        retrievable: true,
        supportCmds: this.extractSupportedCommands(device.capabilities),
        properties: this.extractProperties(device.capabilities)
      }));

      this.organizeDeviceGroups();
      this.buildPresets(); // build presets after devices are loaded
      
      logger.info(`Retrieved ${this.devices.length} Govee devices`);
      return this.devices;
    } catch (error) {
      logger.error('Failed to fetch Govee devices:', error);
      this.devices = [];
      this.organizeDeviceGroups();
      this.buildPresets();
      throw error;
    }
  }

  /**
   * Organize devices into logical groups based on model and name patterns.
   * Groups include: light-bulbs (H6004), light-bars (H6047), light-strips (H619B, H612F, H61C2), light-lamps (H8022).
   * 
   * @private
   */
  private organizeDeviceGroups(): void {
    if (!this.devices || !Array.isArray(this.devices)) {
      this.devices = [];
      this.deviceGroups = DEVICE_GROUPS.map(group => ({ ...group, devices: [] }));
      return;
    }

    this.deviceGroups = DEVICE_GROUPS.map(group => ({
      ...group,
      devices: this.devices.filter(device => {
        switch (group.id) {
          case 'light-bulbs':
            return device.model === 'H6004' && (device.deviceName.includes('Fan Light') || device.deviceName.includes('Window'));
          case 'light-bars':
            return device.model === 'H6047';
          case 'light-strips':
            return device.model === 'H619B' || device.model === 'H612F' || device.model === 'H61C2';
          case 'light-lamps':
            return device.model === 'H8022';
          default:
            return false;
        }
      })
    }));
  }

  /**
   * Build preset commands based on available devices and their capabilities.
   * Called after devices are loaded and organized.
   * 
   * @private
   */
  private buildPresets(): void {
    this.populatedPresets = LIGHT_PRESETS.map(preset => {
      const commands: LightPreset['commands'] = [];

      // get target device groups for this preset
      const targetGroups = this.deviceGroups.filter(group => 
        preset.groups.includes(group.id)
      );

      // build commands for each device in target groups
      targetGroups.forEach(group => {
        group.devices.forEach(device => {
          const deviceCommands: Array<{ name: string; value: any }> = [];

          // confirm device is on first
          if (device.supportCmds.includes('turn')) {
            deviceCommands.push({
              name: 'devices.capabilities.on_off',
              value: 1
            });
          }

          // set brightness if supported
          if (device.supportCmds.includes('brightness')) {
            deviceCommands.push({
              name: 'devices.capabilities.range',
              value: preset.brightness
            });
          }

          // set color/colorTemp based on preset config
          if (preset.color && device.supportCmds.includes('color')) {
            deviceCommands.push({
              name: 'devices.capabilities.color_setting',
              value: preset.color
            });
          } else if (preset.colorTemp && device.supportCmds.includes('colorTem')) {
            deviceCommands.push({
              name: 'devices.capabilities.color_setting',
              value: preset.colorTemp
            });
          }

          // only add device if it has commands to execute
          if (deviceCommands.length > 0) {
            commands.push({
              deviceId: device.device,
              model: device.model,
              commands: deviceCommands
            });
          }
        });
      });

      return {
        ...preset,
        commands
      };
    });

    logger.info(`Built ${this.populatedPresets.length} presets with device commands`);
  }

  /**
   * Helper method to map Govee capability type names to their corresponding instance names
   * 
   * @param {string} commandType - The capability type (e.g., 'devices.capabilities.on_off')
   * @returns {string} The corresponding Govee instance name (e.g., 'powerSwitch')
   */
  private getInstanceName(commandType: string): string {
    switch (commandType) {
      case 'devices.capabilities.on_off':
        return 'powerSwitch';
      case 'devices.capabilities.range':
        return 'brightness';
      case 'devices.capabilities.color_setting':
        return 'colorRgb'; // or 'colorTemperatureK'
      default:
        return 'powerSwitch'; // fallback
    }
  }

  /**
   * Send a control command to a specific Govee device.
   * 
   * @param {GoveeControlRequest} request Device control request parameters
   * @returns {Promise<GoveeControlResponse>} API response from Govee
   * @throws {Error} When device control fails or API returns error
   */
  async controlDevice(request: GoveeControlRequest): Promise<GoveeControlResponse> {
    try {
      const goveeRequest = {
        requestId: `req-${Date.now()}`, // generate unique request ID
        payload: {
          sku: request.model,
          device: request.device,
          capability: {
            type: request.cmd.name,
            instance: this.getInstanceName(request.cmd.name),
            value: request.cmd.value
          }
        }
      };

      const response = await this.client.post<GoveeControlResponse>('/device/control', goveeRequest);
      
      if (response.data.code !== 200) {
        throw new Error(`Govee control error: ${response.data.message}`);
      }

      logger.info(`Device control successful: ${request.device} - ${request.cmd.name}`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to control Govee device:', error);
      throw error;
    }
  }

  /**
   * Apply a command to all devices in a specific group.
   * 
   * @param {string} groupId ID of the device group to control
   * @param {object} command Command object with name and value
   * @param {string} command.name Command name
   * @param {any} command.value Command value
   * @returns {Promise<void>}
   * @throws {Error} When group is not found
   */
  async controlGroup(groupId: string, command: { name: string; value: any }): Promise<void> {
    const group = this.deviceGroups.find(g => g.id === groupId);
    if (!group) {
      throw new Error(`Device group not found: ${groupId}`);
    }

    const promises = group.devices.map(device =>
      this.controlDevice({
        device: device.device,
        model: device.model,
        cmd: command
      })
    );

    await Promise.allSettled(promises);
    logger.info(`Group control applied to ${group.name}: ${command.name}`);
  }

  /**
   * Apply a predefined lighting preset to configured devices.
   * 
   * @param {string} presetId ID of the preset to apply
   * @returns {Promise<void>}
   * @throws {Error} When preset is not found
   */
  async applyPreset(presetId: string): Promise<void> {
    const preset = this.populatedPresets.find(p => p.id === presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    if (preset.commands.length === 0) {
      logger.warn(`Preset ${presetId} has no commands - no compatible devices found`);
      return;
    }

    const promises = preset.commands.map(async (cmd) => {
      for (const command of cmd.commands) {
        try {
          await this.controlDevice({
            device: cmd.deviceId,
            model: cmd.model,
            cmd: command
          });
          // small delay between commands to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 150));
        } catch (error) {
          logger.error(`Failed to apply command to device ${cmd.deviceId}:`, error);
        }
      }
    });

    await Promise.allSettled(promises);
    logger.info(`Applied preset: ${preset.name} to ${preset.commands.length} devices`);
  }

  /**
   * Get organized device groups.
   * 
   * @returns {DeviceGroup[]} Array of device groups
   */
  getDeviceGroups(): DeviceGroup[] {
    return this.deviceGroups;
  }

  /**
   * Get available lighting presets with populated commands.
   * 
   * @returns {LightPreset[]} Array of available presets
   */
  getPresets(): LightPreset[] {
    return this.populatedPresets.length > 0 ? this.populatedPresets : LIGHT_PRESETS;
  }

  /**
   * Apply a command to all discovered devices.
   * Automatically fetches devices if not already loaded.
   * 
   * @param {object} command Command object to apply
   * @param {string} command.name Command name
   * @param {any} command.value Command value
   * @returns {Promise<void>}
   */
  async setAllDevices(command: { name: string; value: any }): Promise<void> {
    if (this.devices.length === 0) {
      await this.getDevices();
    }

    const promises = this.devices.map(device =>
      this.controlDevice({
        device: device.device,
        model: device.model,
        cmd: command
      })
    );

    await Promise.allSettled(promises);
    logger.info(`Applied command to all devices: ${command.name}`);
  }

  /**
   * Rebuild presets with current device configuration.
   * Useful if devices change or new devices are added.
   * 
   * @returns {void}
   */
  rebuildPresets(): void {
    this.buildPresets();
    logger.info('Presets rebuilt with current device configuration');
  }
}