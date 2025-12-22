/**
 * @fileoverview Unit tests for RackSmith User Preferences Service
 */

import { testUser } from '../../setup.js';

// Mock repository
const mockPreferencesRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

jest.mock('../../../src/typeorm/index.js', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => mockPreferencesRepository),
  },
}));

import { UserPreferencesService } from '../../../src/services/racksmith/preferencesService.js';

describe('UserPreferencesService', () => {
  let preferencesService: UserPreferencesService;
  const userId = testUser.id;

  // Default values from the service
  const DEFAULT_THEME = {
    mode: 'dark',
    primaryColor: '#3b82f6',
    accentColor: '#8b5cf6',
    fontSize: 'medium',
    density: 'comfortable',
  };

  const DEFAULT_DEFAULTS = {
    rackSize_u: 42,
    rackColorTag: 'blue',
    deviceManufacturer: 'cisco',
    cableType: 'cat6',
    autoSave: true,
    autoSaveInterval: 5,
    confirmDelete: true,
    showWelcomeScreen: true,
  };

  const DEFAULT_VIEW = {
    sidebarCollapsed: false,
    showRackLabels: true,
    showUNumbers: true,
    showPowerUsage: true,
    gridView: true,
    itemsPerPage: 20,
    defaultSortBy: 'name',
    defaultSortOrder: 'asc',
  };

  const DEFAULT_NOTIFICATIONS = {
    enabled: true,
    showToasts: true,
    playSound: false,
    position: 'top-right',
  };

  const fullDefaults = {
    userId,
    theme: DEFAULT_THEME,
    defaults: DEFAULT_DEFAULTS,
    view: DEFAULT_VIEW,
    notifications: DEFAULT_NOTIFICATIONS,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    preferencesService = new UserPreferencesService();
  });

  describe('getPreferences', () => {
    it('should return existing preferences', async () => {
      const existingPrefs = {
        id: 'prefs-1',
        ...fullDefaults,
      };
      mockPreferencesRepository.findOne.mockResolvedValue(existingPrefs);

      const result = await preferencesService.getPreferences(userId);

      expect(result).toEqual(existingPrefs);
      expect(mockPreferencesRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should create defaults if preferences do not exist', async () => {
      mockPreferencesRepository.findOne.mockResolvedValue(null);
      mockPreferencesRepository.create.mockReturnValue(fullDefaults);
      mockPreferencesRepository.save.mockResolvedValue({ id: 'new-prefs', ...fullDefaults });

      const result = await preferencesService.getPreferences(userId);

      expect(mockPreferencesRepository.create).toHaveBeenCalledWith(fullDefaults);
      expect(mockPreferencesRepository.save).toHaveBeenCalled();
      expect(result.theme).toEqual(DEFAULT_THEME);
    });

    it('should include all preference sections in result', async () => {
      mockPreferencesRepository.findOne.mockResolvedValue(null);
      mockPreferencesRepository.create.mockReturnValue(fullDefaults);
      mockPreferencesRepository.save.mockResolvedValue({ id: 'new-prefs', ...fullDefaults });

      const result = await preferencesService.getPreferences(userId);

      expect(result.theme).toBeDefined();
      expect(result.defaults).toBeDefined();
      expect(result.view).toBeDefined();
      expect(result.notifications).toBeDefined();
    });
  });

  describe('updatePreferences', () => {
    it('should replace entire sections', async () => {
      const existingPrefs = { id: 'prefs-1', ...fullDefaults };
      mockPreferencesRepository.findOne.mockResolvedValue({ ...existingPrefs });

      const newTheme = {
        mode: 'light',
        primaryColor: '#ff0000',
        accentColor: '#00ff00',
        fontSize: 'large',
        density: 'compact',
      };

      mockPreferencesRepository.save.mockImplementation((prefs) => Promise.resolve(prefs));

      const result = await preferencesService.updatePreferences(userId, { theme: newTheme });

      expect(result.theme).toEqual(newTheme);
    });

    it('should create if preferences do not exist', async () => {
      mockPreferencesRepository.findOne.mockResolvedValue(null);
      mockPreferencesRepository.create.mockReturnValue({
        userId,
        theme: DEFAULT_THEME,
        defaults: DEFAULT_DEFAULTS,
        view: DEFAULT_VIEW,
        notifications: DEFAULT_NOTIFICATIONS,
      });
      mockPreferencesRepository.save.mockImplementation((prefs) => Promise.resolve(prefs));

      const customTheme = { ...DEFAULT_THEME, mode: 'light' };
      await preferencesService.updatePreferences(userId, { theme: customTheme });

      expect(mockPreferencesRepository.create).toHaveBeenCalled();
    });

    it('should only update specified sections', async () => {
      const existingPrefs = { id: 'prefs-1', ...fullDefaults };
      mockPreferencesRepository.findOne.mockResolvedValue({ ...existingPrefs });
      mockPreferencesRepository.save.mockImplementation((prefs) => Promise.resolve(prefs));

      const result = await preferencesService.updatePreferences(userId, {
        view: { ...DEFAULT_VIEW, gridView: false },
      });

      expect(result.theme).toEqual(DEFAULT_THEME); // Unchanged
      expect(result.view.gridView).toBe(false); // Changed
    });
  });

  describe('patchPreferences', () => {
    it('should merge partial updates', async () => {
      const existingPrefs = { id: 'prefs-1', ...fullDefaults };
      mockPreferencesRepository.findOne.mockResolvedValue({ ...existingPrefs });
      mockPreferencesRepository.save.mockImplementation((prefs) => Promise.resolve(prefs));

      const result = await preferencesService.patchPreferences(userId, {
        theme: { mode: 'light' },
      });

      expect(result.theme.mode).toBe('light');
      expect(result.theme.primaryColor).toBe('#3b82f6'); // Unchanged
      expect(result.theme.accentColor).toBe('#8b5cf6'); // Unchanged
    });

    it('should not overwrite unspecified fields', async () => {
      const existingPrefs = {
        id: 'prefs-1',
        ...fullDefaults,
        defaults: { ...DEFAULT_DEFAULTS, autoSave: false },
      };
      mockPreferencesRepository.findOne.mockResolvedValue({ ...existingPrefs });
      mockPreferencesRepository.save.mockImplementation((prefs) => Promise.resolve(prefs));

      const result = await preferencesService.patchPreferences(userId, {
        defaults: { confirmDelete: false },
      });

      expect(result.defaults.autoSave).toBe(false); // Preserved from existing
      expect(result.defaults.confirmDelete).toBe(false); // Changed
      expect(result.defaults.rackSize_u).toBe(42); // Unchanged
    });

    it('should create with defaults and then apply patch if not exists', async () => {
      // First call for getPreferences - no existing prefs
      mockPreferencesRepository.findOne.mockResolvedValueOnce(null);
      mockPreferencesRepository.create.mockReturnValue({ ...fullDefaults });
      mockPreferencesRepository.save.mockImplementation((prefs) => Promise.resolve({ id: 'new-prefs', ...prefs }));

      const result = await preferencesService.patchPreferences(userId, {
        notifications: { playSound: true },
      });

      expect(result.notifications.playSound).toBe(true);
      expect(result.notifications.enabled).toBe(true); // Default preserved
    });

    it('should handle patching multiple sections', async () => {
      const existingPrefs = { id: 'prefs-1', ...fullDefaults };
      mockPreferencesRepository.findOne.mockResolvedValue({ ...existingPrefs });
      mockPreferencesRepository.save.mockImplementation((prefs) => Promise.resolve(prefs));

      const result = await preferencesService.patchPreferences(userId, {
        theme: { mode: 'light' },
        view: { itemsPerPage: 50 },
      });

      expect(result.theme.mode).toBe('light');
      expect(result.view.itemsPerPage).toBe(50);
    });
  });

  describe('resetPreferences', () => {
    it('should reset all sections to defaults', async () => {
      const customPrefs = {
        id: 'prefs-1',
        userId,
        theme: { ...DEFAULT_THEME, mode: 'light' },
        defaults: { ...DEFAULT_DEFAULTS, rackSize_u: 24 },
        view: { ...DEFAULT_VIEW, gridView: false },
        notifications: { ...DEFAULT_NOTIFICATIONS, playSound: true },
      };
      mockPreferencesRepository.findOne.mockResolvedValue({ ...customPrefs });
      mockPreferencesRepository.save.mockImplementation((prefs) => Promise.resolve(prefs));

      const result = await preferencesService.resetPreferences(userId);

      expect(result.theme).toEqual(DEFAULT_THEME);
      expect(result.defaults).toEqual(DEFAULT_DEFAULTS);
      expect(result.view).toEqual(DEFAULT_VIEW);
      expect(result.notifications).toEqual(DEFAULT_NOTIFICATIONS);
    });

    it('should create with defaults if preferences do not exist', async () => {
      mockPreferencesRepository.findOne.mockResolvedValue(null);
      mockPreferencesRepository.create.mockReturnValue(fullDefaults);
      mockPreferencesRepository.save.mockResolvedValue({ id: 'new-prefs', ...fullDefaults });

      const result = await preferencesService.resetPreferences(userId);

      expect(mockPreferencesRepository.create).toHaveBeenCalledWith(fullDefaults);
      expect(result.theme).toEqual(DEFAULT_THEME);
    });

    it('should preserve userId and id when resetting', async () => {
      const existingPrefs = {
        id: 'existing-id',
        userId,
        theme: { ...DEFAULT_THEME, mode: 'light' },
        defaults: DEFAULT_DEFAULTS,
        view: DEFAULT_VIEW,
        notifications: DEFAULT_NOTIFICATIONS,
      };
      mockPreferencesRepository.findOne.mockResolvedValue({ ...existingPrefs });
      mockPreferencesRepository.save.mockImplementation((prefs) => Promise.resolve(prefs));

      const result = await preferencesService.resetPreferences(userId);

      expect(result.id).toBe('existing-id');
      expect(result.userId).toBe(userId);
    });
  });
});
