/**
 * @fileoverview Unit tests for Homepage GitHub Service
 */

import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock projectsService - use factory to avoid hoisting issues
const mockCreateProject = jest.fn();
jest.mock('../../../src/services/homepage/projectsService.js', () => ({
  projectsService: {
    createProject: mockCreateProject,
  },
}));

import { GitHubService } from '../../../src/services/homepage/githubService.js';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('githubService', () => {
  let githubService: GitHubService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Set GITHUB_PAT for tests
    process.env.GITHUB_PAT = 'test-github-pat';
    // Create fresh instance each test
    githubService = new GitHubService();
  });

  afterEach(() => {
    delete process.env.GITHUB_PAT;
  });

  describe('isConfigured', () => {
    it('should return true when GITHUB_PAT is set', () => {
      expect(githubService.isConfigured()).toBe(true);
    });

    it('should return false when GITHUB_PAT is not set', () => {
      delete process.env.GITHUB_PAT;
      const unconfiguredService = new GitHubService();

      expect(unconfiguredService.isConfigured()).toBe(false);
    });
  });

  describe('getRepositories', () => {
    const mockRepos = [
      {
        id: 1,
        name: 'repo-1',
        full_name: 'user/repo-1',
        description: 'First repo',
        html_url: 'https://github.com/user/repo-1',
        language: 'TypeScript',
      },
      {
        id: 2,
        name: 'repo-2',
        full_name: 'user/repo-2',
        description: 'Second repo',
        html_url: 'https://github.com/user/repo-2',
        language: 'JavaScript',
      },
    ];

    it('should fetch repositories from GitHub', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockRepos });

      const result = await githubService.getRepositories();

      expect(result.repos).toEqual(mockRepos);
      expect(result.cached).toBe(false);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/user/repos',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-github-pat',
          }),
        })
      );
    });

    it('should apply filters to request', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockRepos });

      await githubService.getRepositories({
        per_page: 50,
        sort: 'pushed',
        direction: 'asc',
        type: 'owner',
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/user/repos',
        expect.objectContaining({
          params: {
            per_page: 50,
            sort: 'pushed',
            direction: 'asc',
            type: 'owner',
          },
        })
      );
    });

    it('should use default filter values', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockRepos });

      await githubService.getRepositories();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/user/repos',
        expect.objectContaining({
          params: {
            per_page: 30,
            sort: 'updated',
            direction: 'desc',
            type: 'owner',
          },
        })
      );
    });

    it('should return cached data if available', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockRepos });

      // First call - fetches from API
      await githubService.getRepositories();

      // Second call - should use cache
      const result = await githubService.getRepositories();

      expect(result.cached).toBe(true);
      expect(result.cachedAt).toBeDefined();
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should throw error when not configured', async () => {
      delete process.env.GITHUB_PAT;
      const unconfiguredService = new GitHubService();

      await expect(unconfiguredService.getRepositories())
        .rejects.toThrow('GitHub integration not configured');
    });

    it('should throw auth error on 401', async () => {
      const error = {
        response: { status: 401 },
        isAxiosError: true,
      };
      mockedAxios.get.mockRejectedValueOnce(error);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(githubService.getRepositories())
        .rejects.toThrow('GitHub authentication failed');
    });
  });

  describe('getRepository', () => {
    const mockRepo = {
      id: 1,
      name: 'repo-1',
      full_name: 'user/repo-1',
      description: 'First repo',
      html_url: 'https://github.com/user/repo-1',
      language: 'TypeScript',
    };

    it('should fetch specific repository', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockRepo });

      const result = await githubService.getRepository('user', 'repo-1');

      expect(result).toEqual(mockRepo);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/repos/user/repo-1',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-github-pat',
          }),
        })
      );
    });

    it('should return null on 404', async () => {
      const error = {
        response: { status: 404 },
        isAxiosError: true,
      };
      mockedAxios.get.mockRejectedValueOnce(error);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      const result = await githubService.getRepository('user', 'nonexistent');

      expect(result).toBeNull();
    });

    it('should cache repository data', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockRepo });

      await githubService.getRepository('user', 'repo-1');
      const result = await githubService.getRepository('user', 'repo-1');

      expect(result).toEqual(mockRepo);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should throw error when not configured', async () => {
      delete process.env.GITHUB_PAT;
      const unconfiguredService = new GitHubService();

      await expect(unconfiguredService.getRepository('user', 'repo'))
        .rejects.toThrow('GitHub integration not configured');
    });
  });

  describe('importAsProject', () => {
    const mockUser = { login: 'testuser' };
    const mockRepo = {
      id: 1,
      name: 'my-repo',
      full_name: 'testuser/my-repo',
      description: 'My awesome repo',
      html_url: 'https://github.com/testuser/my-repo',
      homepage: 'https://my-repo.com',
      language: 'TypeScript',
      topics: ['react', 'typescript'],
      created_at: '2024-01-15T00:00:00Z',
    };

    it('should import repository as project', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockUser })
        .mockResolvedValueOnce({ data: mockRepo });

      mockCreateProject.mockResolvedValue({
        id: 'new-project-id',
        title: 'my-repo',
      });

      const result = await githubService.importAsProject('my-repo');

      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'my-repo',
          description: 'My awesome repo',
          technologies: expect.arrayContaining(['TypeScript', 'react', 'typescript']),
          category: 'current',
          githubUrl: 'https://github.com/testuser/my-repo',
          liveUrl: 'https://my-repo.com',
        })
      );
      expect(result).toEqual({ id: 'new-project-id', title: 'my-repo' });
    });

    it('should use repo name if description is empty', async () => {
      const repoWithoutDesc = { ...mockRepo, description: null };
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockUser })
        .mockResolvedValueOnce({ data: repoWithoutDesc });

      mockCreateProject.mockResolvedValue({ id: 'new-id' });

      await githubService.importAsProject('my-repo');

      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'GitHub repository: testuser/my-repo',
        })
      );
    });

    it('should throw error if repo not found', async () => {
      const error = {
        response: { status: 404 },
        isAxiosError: true,
      };
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockUser })
        .mockRejectedValueOnce(error);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(githubService.importAsProject('nonexistent'))
        .rejects.toThrow("Repository 'nonexistent' not found");
    });

    it('should throw error when not configured', async () => {
      delete process.env.GITHUB_PAT;
      const unconfiguredService = new GitHubService();

      await expect(unconfiguredService.importAsProject('repo'))
        .rejects.toThrow('GitHub integration not configured');
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      const mockRepos = [{ id: 1, name: 'repo-1' }];
      mockedAxios.get.mockResolvedValue({ data: mockRepos });

      // Populate cache
      await githubService.getRepositories();

      // Clear cache
      githubService.clearCache();

      // Should fetch again
      await githubService.getRepositories();

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });
});
