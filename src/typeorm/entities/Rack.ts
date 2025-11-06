/**
 * @fileoverview Rack Entity for RackSmith
 * @description TypeORM entity for server rack configurations
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

import type { User } from './User.js';
import type { Device } from './Device.js';

@Entity('racks')
export class Rack {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  location!: string;

  @Column({ type: 'int', name: 'size_u' })
  sizeU!: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'color_tag' })
  colorTag?: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt?: Date;

  // Relationships
  @ManyToOne('User', 'racks')
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany('Device', 'rack')
  devices!: Device[];
}
