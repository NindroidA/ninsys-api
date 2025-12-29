/**
 * @fileoverview AboutContent Entity for Homepage API
 * @description TypeORM entity for about page content
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  email?: string;
}

export interface ProfileData {
  name: string;
  tagline: string;
  location: string;
  bio: string[];
  avatarUrl?: string;
  social: SocialLinks;
}

export type SectionType = 'skills' | 'interests' | 'experience' | 'education' | 'custom';
export type SectionSize = 'small' | 'medium' | 'large';

export interface AboutSection {
  id: string;
  type: SectionType;
  title: string;
  icon?: string;
  order: number;
  size: SectionSize;
  content: any;
}

@Entity('about_content')
export class AboutContent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true, default: 'main' })
  key!: string;

  @Column({ type: 'json' })
  profile!: ProfileData;

  @Column({ type: 'json' })
  sections!: AboutSection[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

/**
 * Default profile data for initial creation
 */
export const DEFAULT_PROFILE: ProfileData = {
  name: '',
  tagline: '',
  location: '',
  bio: [],
  social: {}
};

/**
 * Default sections for initial creation
 */
export const DEFAULT_SECTIONS: AboutSection[] = [];
