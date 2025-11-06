/**
 * @fileoverview Connection Entity for RackSmith
 * @description TypeORM entity for network connections between devices
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

import type { User } from './User.js';

@Entity('connections')
export class Connection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  label?: string;

  @Column({ type: 'uuid', name: 'source_device_id' })
  sourceDeviceId!: string;

  @Column({ type: 'int', name: 'source_port' })
  sourcePort!: number;

  @Column({ type: 'uuid', name: 'target_device_id' })
  targetDeviceId!: string;

  @Column({ type: 'int', name: 'target_port' })
  targetPort!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  type?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'cable_type' })
  cableType?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'cable_length_ft' })
  cableLengthFt?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vlan?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne('User', 'connections')
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
