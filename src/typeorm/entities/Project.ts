/**
 * @fileoverview Project Entity for Homepage API
 * @description TypeORM entity for portfolio projects
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export type ProjectCategory = 'current' | 'completed';

@Entity('projects')
@Index('idx_projects_category', ['category'])
@Index('idx_projects_featured', ['featured'])
@Index('idx_projects_order', ['order'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'json' })
  technologies!: string[];

  @Column({ type: 'varchar', length: 50, default: 'current' })
  category!: ProjectCategory;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image?: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'github_url' })
  githubUrl?: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'live_url' })
  liveUrl?: string;

  @Column({ type: 'varchar', length: 20 })
  date!: string;

  @Column({ type: 'boolean', default: false })
  featured!: boolean;

  @Column({ type: 'int', default: 0, name: 'display_order' })
  order!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
