/**
 * @fileoverview Device Entity for RackSmith
 * @description TypeORM entity for network devices
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

import type { User } from './User.js';
import type { Rack } from './Rack.js';
import type { Port } from './Port.js';

export interface PortConfig {
  number: number;
  type: 'ethernet' | 'fiber' | 'sfp' | 'usb' | 'power';
  speed?: string;
  status: 'available' | 'in-use';
}

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  type!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  manufacturer?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  model?: string;

  @Column({ type: 'int', name: 'size_u', nullable: true })
  sizeU?: number;

  @Column({ type: 'int', name: 'port_count', default: 0 })
  portCount!: number;

  @Column({ type: 'int', name: 'power_watts', nullable: true })
  powerWatts?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'json', nullable: true })
  ports?: PortConfig[];

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'uuid', name: 'rack_id', nullable: true })
  rackId?: string;

  @Column({ type: 'int', name: 'position_u', nullable: true })
  positionU?: number;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt?: Date;

  // Relationships
  @ManyToOne('User', 'devices')
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne('Rack', 'devices', { nullable: true })
  @JoinColumn({ name: 'rack_id' })
  rack?: Rack;

  @OneToMany('Port', 'device')
  portsList!: Port[];
}
