/**
 * @fileoverview GitHub Service for Homepage API
 * @description GitHub API integration with caching for repo fetching
 */

import axios from 'axios';
import type { GitHubRepo, GitHubRepoFilters, GitHubReposResponse } from '../../types/homepage/github.js';
import type { CreateProjectDto } from '../../types/homepage/project.js';
import { projectsService } from './projectsService.js';
import { logger } from '../../utils/logger.js';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class GitHubService {
  private pat: string | null;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes
  private baseUrl = 'https://api.github.com';

  constructor() {
    this.pat = process.env.GITHUB_PAT || null;
  }

  /**
   * Check if GitHub integration is configured
   */
  isConfigured(): boolean {
    return this.pat !== null && this.pat.length > 0;
  }

  /**
   * Fetch repositories from GitHub
   */
  async getRepositories(filters?: GitHubRepoFilters): Promise<GitHubReposResponse> {
    if (!this.isConfigured()) {
      throw new Error('GitHub integration not configured. Add GITHUB_PAT to environment variables.');
    }

    const perPage = filters?.per_page ?? 30;
    const sort = filters?.sort ?? 'updated';
    const direction = filters?.direction ?? 'desc';
    const type = filters?.type ?? 'owner';

    const cacheKey = `repos:${perPage}:${sort}:${direction}:${type}`;
    const cached = this.getFromCache<GitHubRepo[]>(cacheKey);

    if (cached) {
      return {
        repos: cached.data,
        cached: true,
        cachedAt: new Date(cached.timestamp).toISOString(),
      };
    }

    try {
      const response = await axios.get<GitHubRepo[]>(`${this.baseUrl}/user/repos`, {
        headers: {
          Authorization: `Bearer ${this.pat}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        params: {
          per_page: perPage,
          sort,
          direction,
          type,
        },
      });

      const repos = response.data;
      this.setCache(cacheKey, repos);

      return {
        repos,
        cached: false,
      };
    } catch (error) {
      logger.error('Failed to fetch GitHub repos:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error('GitHub authentication failed. Check your GITHUB_PAT.');
      }
      throw new Error('Failed to fetch repositories from GitHub');
    }
  }

  /**
   * Get a specific repository by name
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepo | null> {
    if (!this.isConfigured()) {
      throw new Error('GitHub integration not configured. Add GITHUB_PAT to environment variables.');
    }

    const cacheKey = `repo:${owner}/${repo}`;
    const cached = this.getFromCache<GitHubRepo>(cacheKey);

    if (cached) {
      return cached.data;
    }

    try {
      const response = await axios.get<GitHubRepo>(`${this.baseUrl}/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${this.pat}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      const repoData = response.data;
      this.setCache(cacheKey, repoData);

      return repoData;
    } catch (error) {
      logger.error(`Failed to fetch GitHub repo ${owner}/${repo}:`, error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch repository from GitHub');
    }
  }

  /**
   * Import a GitHub repository as a project
   */
  async importAsProject(repoName: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('GitHub integration not configured. Add GITHUB_PAT to environment variables.');
    }

    // First, get user info to determine owner
    const userResponse = await axios.get<{ login: string }>(`${this.baseUrl}/user`, {
      headers: {
        Authorization: `Bearer ${this.pat}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    const owner = userResponse.data.login;
    const repo = await this.getRepository(owner, repoName);

    if (!repo) {
      throw new Error(`Repository '${repoName}' not found`);
    }

    // Map repo data to project
    const projectData: CreateProjectDto = {
      title: repo.name,
      description: repo.description || `GitHub repository: ${repo.full_name}`,
      technologies: repo.language ? [repo.language] : [],
      category: 'current',
      githubUrl: repo.html_url,
      liveUrl: repo.homepage || undefined,
      date: new Date(repo.created_at).toISOString().slice(0, 7), // YYYY-MM format
      featured: false,
    };

    // Add topics as additional technologies if available
    if (repo.topics && repo.topics.length > 0) {
      projectData.technologies = [...new Set([...projectData.technologies, ...repo.topics])];
    }

    return projectsService.createProject(projectData);
  }

  /**
   * Get cached data if not expired
   */
  private getFromCache<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.cacheDuration) {
      this.cache.delete(key);
      return null;
    }

    return entry as CacheEntry<T>;
  }

  /**
   * Store data in cache
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const githubService = new GitHubService();
