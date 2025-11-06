/**
 * @fileoverview User Entity for RackSmith
 * @description TypeORM entity for user authentication and management
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

import type { Rack } from './Rack.js';
import type { Device } from './Device.js';
import type { Connection } from './Connection.js';
import type { NetworkPlan } from './NetworkPlan.js';
import type { ActivityLog } from './ActivityLog.js';
import type { Favorite } from './Favorite.js';
import type { FloorPlan } from './FloorPlan.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  password!: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'first_name' })
  firstName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'last_name' })
  lastName?: string;

  @Column({ type: 'varchar', length: 50, default: 'user' })
  role!: string;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login' })
  lastLogin?: Date;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relationships
  @OneToMany('Rack', 'user')
  racks!: Rack[];

  @OneToMany('Device', 'user')
  devices!: Device[];

  @OneToMany('Connection', 'user')
  connections!: Connection[];

  @OneToMany('NetworkPlan', 'user')
  networkPlans!: NetworkPlan[];

  @OneToMany('ActivityLog', 'user')
  activityLogs!: ActivityLog[];

  @OneToMany('Favorite', 'user')
  favorites!: Favorite[];

  @OneToMany('FloorPlan', 'user')
  floorPlans!: FloorPlan[];
}
