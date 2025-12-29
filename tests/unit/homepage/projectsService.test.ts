/**
 * @fileoverview Unit tests for Homepage Projects Service
 */

// Mock query builder
const mockQueryBuilder = {
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
  getRawOne: jest.fn(),
};

// Mock repository
const mockProjectRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

// Mock transaction manager
const mockTransactionManager = {
  update: jest.fn(),
};

jest.mock('../../../src/typeorm/index.js', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => mockProjectRepository),
    transaction: jest.fn((callback: any) => callback(mockTransactionManager)),
  },
}));

import { projectsService } from '../../../src/services/homepage/projectsService.js';

describe('projectsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset query builder mocks
    Object.values(mockQueryBuilder).forEach((mock) => {
      if (typeof mock === 'function' && mock.mockReturnThis) {
        mock.mockReturnThis();
      }
    });
  });

  describe('getAllProjects', () => {
    const mockProjects = [
      {
        id: 'project-1',
        title: 'Project One',
        description: 'First project',
        technologies: ['React', 'TypeScript'],
        category: 'current',
        featured: true,
        order: 0,
      },
      {
        id: 'project-2',
        title: 'Project Two',
        description: 'Second project',
        technologies: ['Node.js'],
        category: 'completed',
        featured: false,
        order: 1,
      },
    ];

    it('should return all projects sorted by order', async () => {
      mockQueryBuilder.getMany.mockResolvedValue(mockProjects);

      const result = await projectsService.getAllProjects();

      expect(result).toEqual(mockProjects);
      expect(mockProjectRepository.createQueryBuilder).toHaveBeenCalledWith('project');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('project.display_order', 'ASC');
    });

    it('should filter by category', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockProjects[0]]);

      const result = await projectsService.getAllProjects({ category: 'current' });

      expect(result).toHaveLength(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'project.category = :category',
        { category: 'current' }
      );
    });

    it('should filter by featured', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockProjects[0]]);

      const result = await projectsService.getAllProjects({ featured: true });

      expect(result).toHaveLength(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'project.featured = :featured',
        { featured: true }
      );
    });

    it('should filter by both category and featured', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockProjects[0]]);

      await projectsService.getAllProjects({ category: 'current', featured: true });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'project.category = :category',
        { category: 'current' }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'project.featured = :featured',
        { featured: true }
      );
    });
  });

  describe('getProjectById', () => {
    const mockProject = {
      id: 'project-1',
      title: 'Project One',
      description: 'First project',
      technologies: ['React'],
      category: 'current',
    };

    it('should return project by id', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);

      const result = await projectsService.getProjectById('project-1');

      expect(result).toEqual(mockProject);
      expect(mockProjectRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'project-1' },
      });
    });

    it('should return null if project not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      const result = await projectsService.getProjectById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createProject', () => {
    const projectData = {
      title: 'New Project',
      description: 'A new project',
      technologies: ['React', 'Node.js'],
      category: 'current' as const,
      date: '2024-12',
    };

    it('should create a new project', async () => {
      const createdProject = { id: 'new-id', ...projectData, order: 0, featured: false };
      mockQueryBuilder.getRawOne.mockResolvedValue({ maxOrder: -1 });
      mockProjectRepository.create.mockReturnValue(createdProject);
      mockProjectRepository.save.mockResolvedValue(createdProject);

      const result = await projectsService.createProject(projectData);

      expect(result.id).toBe('new-id');
      expect(result.title).toBe('New Project');
      expect(mockProjectRepository.create).toHaveBeenCalled();
      expect(mockProjectRepository.save).toHaveBeenCalled();
    });

    it('should set order to next available if not provided', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({ maxOrder: 1 });
      mockProjectRepository.create.mockImplementation((data) => data);
      mockProjectRepository.save.mockImplementation((data) => Promise.resolve({ id: 'new-id', ...data }));

      const result = await projectsService.createProject(projectData);

      expect(result.order).toBe(2);
    });

    it('should use provided order', async () => {
      const dataWithOrder = { ...projectData, order: 5 };
      mockQueryBuilder.getRawOne.mockResolvedValue({ maxOrder: 1 });
      mockProjectRepository.create.mockImplementation((data) => data);
      mockProjectRepository.save.mockImplementation((data) => Promise.resolve({ id: 'new-id', ...data }));

      const result = await projectsService.createProject(dataWithOrder);

      expect(result.order).toBe(5);
    });

    it('should set featured to false by default', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({ maxOrder: -1 });
      mockProjectRepository.create.mockImplementation((data) => data);
      mockProjectRepository.save.mockImplementation((data) => Promise.resolve({ id: 'new-id', ...data }));

      const result = await projectsService.createProject(projectData);

      expect(result.featured).toBe(false);
    });
  });

  describe('updateProject', () => {
    const existingProject = {
      id: 'project-1',
      title: 'Old Title',
      description: 'Old description',
      technologies: ['React'],
      category: 'current',
      order: 0,
    };

    it('should update project fields', async () => {
      mockProjectRepository.findOne.mockResolvedValue({ ...existingProject });
      mockProjectRepository.save.mockImplementation((data) => Promise.resolve(data));

      const result = await projectsService.updateProject('project-1', { title: 'New Title' });

      expect(result?.title).toBe('New Title');
      expect(mockProjectRepository.save).toHaveBeenCalled();
    });

    it('should return null if project not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      const result = await projectsService.updateProject('nonexistent', { title: 'New Title' });

      expect(result).toBeNull();
      expect(mockProjectRepository.save).not.toHaveBeenCalled();
    });

    it('should update multiple fields', async () => {
      mockProjectRepository.findOne.mockResolvedValue({ ...existingProject });
      mockProjectRepository.save.mockImplementation((data) => Promise.resolve(data));

      const result = await projectsService.updateProject('project-1', {
        title: 'New Title',
        description: 'New description',
        featured: true,
      });

      expect(result?.title).toBe('New Title');
      expect(result?.description).toBe('New description');
      expect(result?.featured).toBe(true);
    });
  });

  describe('deleteProject', () => {
    it('should delete project and return true', async () => {
      mockProjectRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await projectsService.deleteProject('project-1');

      expect(result).toBe(true);
      expect(mockProjectRepository.delete).toHaveBeenCalledWith('project-1');
    });

    it('should return false if project not found', async () => {
      mockProjectRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await projectsService.deleteProject('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('reorderProjects', () => {
    it('should reorder projects based on provided order', async () => {
      await projectsService.reorderProjects(['project-3', 'project-1', 'project-2']);

      expect(mockTransactionManager.update).toHaveBeenCalledTimes(3);
      expect(mockTransactionManager.update).toHaveBeenCalledWith(
        expect.anything(),
        { id: 'project-3' },
        { order: 0 }
      );
      expect(mockTransactionManager.update).toHaveBeenCalledWith(
        expect.anything(),
        { id: 'project-1' },
        { order: 1 }
      );
      expect(mockTransactionManager.update).toHaveBeenCalledWith(
        expect.anything(),
        { id: 'project-2' },
        { order: 2 }
      );
    });
  });

  describe('getNextOrder', () => {
    it('should return 0 when no projects exist', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({ maxOrder: null });

      const result = await projectsService.getNextOrder();

      expect(result).toBe(0);
    });

    it('should return next order value', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({ maxOrder: 5 });

      const result = await projectsService.getNextOrder();

      expect(result).toBe(6);
    });
  });
});
