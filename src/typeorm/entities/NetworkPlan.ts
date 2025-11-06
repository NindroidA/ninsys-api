/**
 * @fileoverview NetworkPlan Entity for RackSmith
 * @description TypeORM entity for network configuration plans
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

import type { User } from './User.js';

@Entity('network_plans')
export class NetworkPlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'plan_type' })
  planType?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'json' })
  configuration!: Record<string, any>;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne('User', 'networkPlans')
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
