/**
 * @fileoverview Port Entity for RackSmith
 * @description TypeORM entity for device network ports
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

import type { Device } from './Device.js';

@Entity('ports')
export class Port {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'device_id' })
  deviceId!: string;

  @Column({ type: 'int', name: 'port_number' })
  portNumber!: number;

  @Column({ type: 'varchar', length: 50, name: 'port_type' })
  portType!: string; // RJ45, SFP, SFP+, QSFP, etc.

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: string; // active, inactive, disabled, error

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vlan?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  speed?: string; // 1Gbps, 10Gbps, 100Mbps, etc.

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne('Device', 'ports')
  @JoinColumn({ name: 'device_id' })
  device!: Device;
}
