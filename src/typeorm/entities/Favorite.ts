/**
 * @fileoverview Favorite Entity for RackSmith
 * @description TypeORM entity for user favorites/bookmarks
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';

import type { User } from './User.js';

@Entity('favorites')
@Index(['userId', 'itemType'])
@Index(['userId', 'isPinned'])
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 50, name: 'item_type' })
  itemType!: string; // rack, device, connection, network-plan, floor-plan

  @Column({ type: 'uuid', name: 'item_id' })
  itemId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'boolean', default: false, name: 'is_pinned' })
  isPinned!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ type: 'int', default: 0, name: 'access_count' })
  accessCount!: number;

  @Column({ type: 'timestamp', nullable: true, name: 'last_accessed' })
  lastAccessed?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne('User', 'favorites')
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
