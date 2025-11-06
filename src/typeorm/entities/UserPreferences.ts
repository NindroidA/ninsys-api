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

@Entity('user_preferences')
export class UserPreferences {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id', unique: true })
  userId!: string;

  @Column({
    type: 'json',
    default: {
      mode: 'dark',
      primaryColor: '#3b82f6',
      accentColor: '#8b5cf6',
      fontSize: 'medium',
      density: 'comfortable'
    }
  })
  theme!: ThemePreferences;

  @Column({
    type: 'json',
    default: {
      rackSize_u: 42,
      rackColorTag: 'blue',
      deviceManufacturer: 'cisco',
      cableType: 'cat6',
      autoSave: true,
      autoSaveInterval: 5,
      confirmDelete: true,
      showWelcomeScreen: true
    }
  })
  defaults!: DefaultPreferences;

  @Column({
    type: 'json',
    default: {
      sidebarCollapsed: false,
      showRackLabels: true,
      showUNumbers: true,
      showPowerUsage: true,
      gridView: true,
      itemsPerPage: 20,
      defaultSortBy: 'name',
      defaultSortOrder: 'asc'
    }
  })
  view!: ViewPreferences;

  @Column({
    type: 'json',
    default: {
      enabled: true,
      showToasts: true,
      playSound: false,
      position: 'top-right'
    }
  })
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
