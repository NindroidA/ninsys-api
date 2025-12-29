/**
 * @fileoverview Project type definitions for Homepage API
 */

export type ProjectCategory = 'current' | 'completed';

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  category: ProjectCategory;
  image?: string;
  githubUrl?: string;
  liveUrl?: string;
  date: string;
  featured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  title: string;
  description: string;
  technologies: string[];
  category: ProjectCategory;
  image?: string;
  githubUrl?: string;
  liveUrl?: string;
  date: string;
  featured?: boolean;
  order?: number;
}

export interface UpdateProjectDto {
  title?: string;
  description?: string;
  technologies?: string[];
  category?: ProjectCategory;
  image?: string;
  githubUrl?: string;
  liveUrl?: string;
  date?: string;
  featured?: boolean;
  order?: number;
}

export interface ReorderProjectsDto {
  projectIds: string[];
}

export interface ProjectFilters {
  category?: ProjectCategory;
  featured?: boolean;
}
