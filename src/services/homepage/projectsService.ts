/**
 * @fileoverview Projects Service for Homepage API
 * @description Business logic for portfolio project management
 */

import { AppDataSource } from '../../typeorm/index.js';
import { Project } from '../../typeorm/entities/Project.js';
import type { CreateProjectDto, UpdateProjectDto, ProjectFilters } from '../../types/homepage/project.js';

export class ProjectsService {
  private projectRepository = AppDataSource.getRepository(Project);

  /**
   * Get all projects with optional filtering
   */
  async getAllProjects(filters?: ProjectFilters): Promise<Project[]> {
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .orderBy('project.display_order', 'ASC')
      .addOrderBy('project.created_at', 'DESC');

    if (filters?.category) {
      queryBuilder.andWhere('project.category = :category', { category: filters.category });
    }

    if (filters?.featured !== undefined) {
      queryBuilder.andWhere('project.featured = :featured', { featured: filters.featured });
    }

    return queryBuilder.getMany();
  }

  /**
   * Get a single project by ID
   */
  async getProjectById(id: string): Promise<Project | null> {
    return this.projectRepository.findOne({ where: { id } });
  }

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectDto): Promise<Project> {
    // Get the next order value if not provided
    const order = data.order ?? await this.getNextOrder();

    const project = this.projectRepository.create({
      ...data,
      order,
      featured: data.featured ?? false,
    });

    return this.projectRepository.save(project);
  }

  /**
   * Update an existing project
   */
  async updateProject(id: string, data: UpdateProjectDto): Promise<Project | null> {
    const project = await this.projectRepository.findOne({ where: { id } });

    if (!project) {
      return null;
    }

    // Merge updates
    Object.assign(project, data);

    return this.projectRepository.save(project);
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<boolean> {
    const result = await this.projectRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Reorder projects based on array of IDs
   */
  async reorderProjects(projectIds: string[]): Promise<void> {
    // Use a transaction for atomic updates
    await AppDataSource.transaction(async (transactionalEntityManager) => {
      for (let i = 0; i < projectIds.length; i++) {
        await transactionalEntityManager.update(
          Project,
          { id: projectIds[i] },
          { order: i }
        );
      }
    });
  }

  /**
   * Get the next available order value
   */
  async getNextOrder(): Promise<number> {
    const result = await this.projectRepository
      .createQueryBuilder('project')
      .select('MAX(project.display_order)', 'maxOrder')
      .getRawOne();

    return (result?.maxOrder ?? -1) + 1;
  }
}

export const projectsService = new ProjectsService();
