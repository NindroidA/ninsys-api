/**
 * @fileoverview ActivityLog Entity for RackSmith
 * @description TypeORM entity for tracking user actions and system events
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';

import type { User } from './User.js';

@Entity('activity_logs')
@Index(['userId', 'createdAt'])
@Index(['entityType', 'entityId'])
@Index(['action'])
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 50 })
  action!: string; // create, update, delete, login, logout, etc.

  @Column({ type: 'varchar', length: 50, name: 'entity_type' })
  entityType!: string; // user, rack, device, connection, etc.

  @Column({ type: 'uuid', nullable: true, name: 'entity_id' })
  entityId?: string;

  @Column({ type: 'json', nullable: true })
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };

  @Column({ type: 'json', nullable: true })
  metadata?: {
    ip?: string;
    userAgent?: string;
    [key: string]: any;
  };

  @Column({ type: 'varchar', length: 20, default: 'info' })
  severity!: string; // info, warning, error, critical

  @Column({ type: 'varchar', length: 50, nullable: true })
  category?: string; // infrastructure, security, configuration, etc.

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relationships
  @ManyToOne('User', 'activityLogs')
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
