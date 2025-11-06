/**
 * @fileoverview FloorPlan Entity for RackSmith
 * @description TypeORM entity for data center floor plans
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

import type { User } from './User.js';

@Entity('floor_plans')
export class FloorPlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'json' })
  devices!: Array<{
    deviceId: string;
    x: number;
    y: number;
    rotation?: number;
  }>;

  @Column({ type: 'json', nullable: true })
  connections?: Array<{
    sourceId: string;
    targetId: string;
    type?: string;
  }>;

  @Column({ type: 'json', nullable: true })
  metadata?: {
    dimensions?: { width: number; height: number };
    scale?: number;
    gridSize?: number;
    backgroundColor?: string;
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne('User', 'floorPlans')
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
