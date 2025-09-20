/**
 * @fileoverview Govee Smart Light Types
 * @description TypeScript definitions for Govee API responses, device management, and smart lighting control functionality.
 */

/**
 * Represents a single Govee smart device.
 * @interface GoveeDevice
 */
export interface GoveeDevice {
  device: string;           // uniquie device identifier
  model: string;            // device model number (e.g., H6004)
  deviceName: string;       // device name set by owner
  controllable: boolean;    // whether device can be controlled via API
  retrievable: boolean;     // whether device state can be restrieved via API
  supportCmds: string[];    // array of supported command types
  properties: {             // device specific properties
    colorTem?: {            // color temp range
      range: {
        min: number;
        max: number;
      };
    };
  };
}

/**
 * Govee API response structure for device listing.
 * @interface GoveeDevicesResponse
 */
export interface GoveeDevicesResponse {
  code: number;     // http status code from Govee API
  message: string;  // status msg
  data: {           // response payload (containing device array)
    devices: GoveeDevice[];
  };
}

/**
 * Request structure for controlling Govee devices.
 * @interface GoveeControlRequest
 */
export interface GoveeControlRequest {
  device: string;   // target device id
  model: string;    // device model number
  cmd: {            // command to execute on the device
    name: string;
    value: any;
  };
}

/**
 * Govee API response structure for control commands.
 * @interface GoveeControlResponse
 */
export interface GoveeControlResponse {
  code: number;     // http status code from Govee API
  message: string;  // status msg
  data: any;        // response payload
}

/**
 * Logical grouping of related Govee devices.
 * @interface DeviceGroup
 */
export interface DeviceGroup {
  id: string;                      // uniquie group id
  name: string;                    // group name
  devices: GoveeDevice[];          // array of devices in this group
  type: 'bulbs' | 'bar' | 'strip'; // group categories (for UI)
}

/**
 * Predefined lighting configuration preset.
 * @interface LightPreset
 */
export interface LightPreset {
  id: string;           // unique preset id
  name: string;         // preset name
  description: string;  // description of lighting effect
  commands: Array<{     // array of commands to execute for this preset
    deviceId: string;   // target device id
    model: string;      // target device model number
    commands: Array<{   // commands to execute for this device
      name: string;
      value: any;
    }>;
  }>;
}