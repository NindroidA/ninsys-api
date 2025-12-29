/**
 * @fileoverview GitHub API type definitions for Homepage API
 */

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  created_at: string;
  pushed_at: string;
  private: boolean;
}

export interface GitHubReposResponse {
  repos: GitHubRepo[];
  cached: boolean;
  cachedAt?: string;
}

export interface GitHubRepoFilters {
  per_page?: number;
  sort?: 'updated' | 'pushed' | 'full_name' | 'created';
  direction?: 'asc' | 'desc';
  type?: 'all' | 'owner' | 'public' | 'private';
}

export interface ImportedProject {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  category: 'current' | 'completed';
  githubUrl: string;
  liveUrl?: string;
  date: string;
}
