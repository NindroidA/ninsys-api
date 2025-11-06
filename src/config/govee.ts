/**
 * @fileoverview Govee Configuration
 * @description Configuration constants, device groupings, and lighting presets for Govee smart light integration.
 */

import { DeviceGroup, LightPreset } from '../types/shared/govee.js';

/* Base URL for Govee API endpoints */
export const GOVEE_BASE_URL = 'https://openapi.api.govee.com/router/api/v1';

/**
 * Predefined device groups for logical organization.
 * Devices will be automatically assigned to groups based on model and name matching.
 * @type {DeviceGroup[]}
 */
export const DEVICE_GROUPS: DeviceGroup[] = [
  {
    id: 'light-bulbs',
    name: 'Light Bulbs',
    devices: [], // populated dynamically with H6004 devices containing 'Fan Light' or 'Window'
    type: 'bulbs'
  },
  {
    id: 'light-bars',
    name: 'Light Bars',
    devices: [], // populated dynamically with H6047 RGBIC Gaming Light Bars
    type: 'bar'
  },
  {
    id: 'light-strips',
    name: 'Light Strips',
    devices: [], // populated dynamically with H619B, H612F, and H61C2 Light Strips
    type: 'strip'
  },
  {
    id: 'light-lamps',
    name: 'Light Lamps',
    devices: [], // populated dynaically with H8022 Table Lamp
    type: 'lamp'
  }
];

/**
 * Predefined lighting scenes and configurations.
 * Commands will be populated dynamically based on available devices.
 * @type {LightPreset[]}
 */
export const LIGHT_PRESETS: LightPreset[] = [
  {
    id: 'magenta',
    name: 'Magenta Vibes',
    description: 'Cool magenta lighting for focus and creativity',
    color: 0xFF00FF, // magenta RGB
    brightness: 75,
    groups: ['light-bars', 'light-strips', 'light-lamps'],
    commands: []
  },
  {
    id: 'gaming',
    name: 'Gaming Mode',
    description: 'Dynamic RGB lighting for gaming sessions',
    color: 0xFF00FF, // magenta RGB (will be dynamic later)
    brightness: 75,
    groups: ['light-bars', 'light-strips'],
    commands: []
  },
  {
    id: 'cozy',
    name: 'Cozy Mode',
    description: 'Warm white lighting for relaxation',
    colorTemp: 2700, // warm white
    brightness: 40,
    groups: ['light-bars', 'light-strips', 'light-lamps'],
    commands: []
  },
  {
    id: 'productivity',
    name: 'Productivity Mode',
    description: 'Bright, cool white lighting for work',
    colorTemp: 5000, // cool white
    brightness: 85,
    groups: ['light-bars', 'light-strips'],
    commands: []
  },
  {
    id: 'night',
    name: 'Night Mode',
    description: 'Dim ambient lighting for entertainment',
    color: 0x4B0082, // dim blue
    brightness: 15,
    groups: ['light-bars', 'light-strips', 'light-lamps'],
    commands: []
  },
  {
    id: 'party',
    name: 'Party Mode',
    description: 'Dynamic color changing for party time',
    color: 0xFF00FF, // magenta RGB (will change to dymanic later)
    brightness: 100,
    groups: ['light-bars', 'light-strips', 'light-lamps'],
    commands: []
  },
];