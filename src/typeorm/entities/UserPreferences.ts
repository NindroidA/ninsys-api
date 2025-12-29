/**
 * @fileoverview UserPreferences Entity for RackSmith
 * @description TypeORM entity for user preferences and settings
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './User.js';

export interface ThemePreferences {
  mode: 'dark' | 'light';
  primaryColor: string;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  density: 'compact' | 'comfortable' | 'spacious';
}

export interface DefaultPreferences {
  rackSize_u: number;
  rackColorTag: string;
  deviceManufacturer: string;
  cableType: string;
  autoSave: boolean;
  autoSaveInterval: number;
  confirmDelete: boolean;
  showWelcomeScreen: boolean;
}

export interface ViewPreferences {
  sidebarCollapsed: boolean;
  showRackLabels: boolean;
  showUNumbers: boolean;
  showPowerUsage: boolean;
  gridView: boolean;
  itemsPerPage: number;
  defaultSortBy: string;
  defaultSortOrder: 'asc' | 'desc';
}

export interface NotificationPreferences {
  enabled: boolean;
  showToasts: boolean;
  playSound: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Default values for theme preferences
 * Used in service layer since MySQL < 8.0.13 doesn't support JSON defaults
 */
export const DEFAULT_THEME: ThemePreferences = {
  mode: 'dark',
  primaryColor: '#3b82f6',
  accentColor: '#8b5cf6',
  fontSize: 'medium',
  density: 'comfortable'
};

/**
 * Default values for default preferences
 */
export const DEFAULT_DEFAULTS: DefaultPreferences = {
  rackSize_u: 42,
  rackColorTag: 'blue',
  deviceManufacturer: 'cisco',
  cableType: 'cat6',
  autoSave: true,
  autoSaveInterval: 5,
  confirmDelete: true,
  showWelcomeScreen: true
};

/**
 * Default values for view preferences
 */
export const DEFAULT_VIEW: ViewPreferences = {
  sidebarCollapsed: false,
  showRackLabels: true,
  showUNumbers: true,
  showPowerUsage: true,
  gridView: true,
  itemsPerPage: 20,
  defaultSortBy: 'name',
  defaultSortOrder: 'asc'
};

/**
 * Default values for notification preferences
 */
export const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  enabled: true,
  showToasts: true,
  playSound: false,
  position: 'top-right'
};

@Entity('user_preferences')
export class UserPreferences {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id', unique: true })
  userId!: string;

  @Column({ type: 'json' })
  theme!: ThemePreferences;

  @Column({ type: 'json' })
  defaults!: DefaultPreferences;

  @Column({ type: 'json' })
  view!: ViewPreferences;

  @Column({ type: 'json' })
  notifications!: NotificationPreferences;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relationships
  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
