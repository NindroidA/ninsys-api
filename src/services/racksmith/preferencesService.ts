/**
 * @fileoverview User Preferences Service
 * @description Handles user preferences CRUD operations
 */

import { AppDataSource } from '../../typeorm/index.js';
import { UserPreferences, ThemePreferences, DefaultPreferences, ViewPreferences, NotificationPreferences } from '../../typeorm/entities/UserPreferences.js';

const DEFAULT_THEME: ThemePreferences = {
  mode: 'dark',
  primaryColor: '#3b82f6',
  accentColor: '#8b5cf6',
  fontSize: 'medium',
  density: 'comfortable'
};

const DEFAULT_DEFAULTS: DefaultPreferences = {
  rackSize_u: 42,
  rackColorTag: 'blue',
  deviceManufacturer: 'cisco',
  cableType: 'cat6',
  autoSave: true,
  autoSaveInterval: 5,
  confirmDelete: true,
  showWelcomeScreen: true
};

const DEFAULT_VIEW: ViewPreferences = {
  sidebarCollapsed: false,
  showRackLabels: true,
  showUNumbers: true,
  showPowerUsage: true,
  gridView: true,
  itemsPerPage: 20,
  defaultSortBy: 'name',
  defaultSortOrder: 'asc'
};

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  enabled: true,
  showToasts: true,
  playSound: false,
  position: 'top-right'
};

export class UserPreferencesService {
  private preferencesRepository = AppDataSource.getRepository(UserPreferences);

  /**
   * Get user preferences (create with defaults if not exist)
   */
  async getPreferences(userId: string): Promise<UserPreferences> {
    let preferences = await this.preferencesRepository.findOne({ where: { userId } });

    if (!preferences) {
      // Create default preferences
      preferences = this.preferencesRepository.create({
        userId,
        theme: DEFAULT_THEME,
        defaults: DEFAULT_DEFAULTS,
        view: DEFAULT_VIEW,
        notifications: DEFAULT_NOTIFICATIONS
      });
      await this.preferencesRepository.save(preferences);
    }

    return preferences;
  }

  /**
   * Update all preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<{
      theme: ThemePreferences;
      defaults: DefaultPreferences;
      view: ViewPreferences;
      notifications: NotificationPreferences;
    }>
  ): Promise<UserPreferences> {
    let preferences = await this.preferencesRepository.findOne({ where: { userId } });

    if (!preferences) {
      preferences = this.preferencesRepository.create({
        userId,
        theme: updates.theme || DEFAULT_THEME,
        defaults: updates.defaults || DEFAULT_DEFAULTS,
        view: updates.view || DEFAULT_VIEW,
        notifications: updates.notifications || DEFAULT_NOTIFICATIONS
      });
    } else {
      if (updates.theme) preferences.theme = updates.theme;
      if (updates.defaults) preferences.defaults = updates.defaults;
      if (updates.view) preferences.view = updates.view;
      if (updates.notifications) preferences.notifications = updates.notifications;
    }

    return await this.preferencesRepository.save(preferences);
  }

  /**
   * Partial update (patch) preferences
   */
  async patchPreferences(
    userId: string,
    updates: Partial<{
      theme: Partial<ThemePreferences>;
      defaults: Partial<DefaultPreferences>;
      view: Partial<ViewPreferences>;
      notifications: Partial<NotificationPreferences>;
    }>
  ): Promise<UserPreferences> {
    let preferences = await this.getPreferences(userId);

    if (updates.theme) {
      preferences.theme = { ...preferences.theme, ...updates.theme };
    }
    if (updates.defaults) {
      preferences.defaults = { ...preferences.defaults, ...updates.defaults };
    }
    if (updates.view) {
      preferences.view = { ...preferences.view, ...updates.view };
    }
    if (updates.notifications) {
      preferences.notifications = { ...preferences.notifications, ...updates.notifications };
    }

    return await this.preferencesRepository.save(preferences);
  }

  /**
   * Reset preferences to defaults
   */
  async resetPreferences(userId: string): Promise<UserPreferences> {
    let preferences = await this.preferencesRepository.findOne({ where: { userId } });

    if (!preferences) {
      preferences = this.preferencesRepository.create({
        userId,
        theme: DEFAULT_THEME,
        defaults: DEFAULT_DEFAULTS,
        view: DEFAULT_VIEW,
        notifications: DEFAULT_NOTIFICATIONS
      });
    } else {
      preferences.theme = DEFAULT_THEME;
      preferences.defaults = DEFAULT_DEFAULTS;
      preferences.view = DEFAULT_VIEW;
      preferences.notifications = DEFAULT_NOTIFICATIONS;
    }

    return await this.preferencesRepository.save(preferences);
  }
}

export const userPreferencesService = new UserPreferencesService();
