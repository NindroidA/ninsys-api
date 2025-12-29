/**
 * @fileoverview About Service for Homepage API
 * @description Business logic for about page content management
 */

import { AppDataSource } from '../../typeorm/index.js';
import { AboutContent, DEFAULT_PROFILE, DEFAULT_SECTIONS } from '../../typeorm/entities/AboutContent.js';
import type { AboutData, UpdateAboutDto, AboutSection, ProfileData } from '../../types/homepage/about.js';
import { v4 as uuidv4 } from 'uuid';

export class AboutService {
  private aboutRepository = AppDataSource.getRepository(AboutContent);

  /**
   * Get about page content, creating defaults if not exists
   */
  async getAboutContent(): Promise<AboutData> {
    let content = await this.aboutRepository.findOne({ where: { key: 'main' } });

    if (!content) {
      // Create default content
      content = this.aboutRepository.create({
        key: 'main',
        profile: DEFAULT_PROFILE,
        sections: DEFAULT_SECTIONS,
      });
      content = await this.aboutRepository.save(content);
    }

    return {
      profile: content.profile,
      sections: content.sections,
    };
  }

  /**
   * Update about page content (full replacement)
   */
  async updateAboutContent(data: UpdateAboutDto): Promise<AboutData> {
    let content = await this.aboutRepository.findOne({ where: { key: 'main' } });

    if (!content) {
      // Create new content
      content = this.aboutRepository.create({
        key: 'main',
        profile: data.profile as ProfileData ?? DEFAULT_PROFILE,
        sections: data.sections ?? DEFAULT_SECTIONS,
      });
    } else {
      // Update existing content
      if (data.profile) {
        content.profile = { ...content.profile, ...data.profile } as ProfileData;
      }
      if (data.sections) {
        content.sections = data.sections;
      }
    }

    content = await this.aboutRepository.save(content);

    return {
      profile: content.profile,
      sections: content.sections,
    };
  }

  /**
   * Update section order
   */
  async updateSectionsOrder(orders: { id: string; order: number }[]): Promise<AboutData> {
    const content = await this.aboutRepository.findOne({ where: { key: 'main' } });

    if (!content) {
      throw new Error('About content not found');
    }

    // Create a map of id to new order
    const orderMap = new Map(orders.map(o => [o.id, o.order]));

    // Update orders in sections
    content.sections = content.sections.map(section => ({
      ...section,
      order: orderMap.get(section.id) ?? section.order,
    }));

    // Sort by new order
    content.sections.sort((a, b) => a.order - b.order);

    await this.aboutRepository.save(content);

    return {
      profile: content.profile,
      sections: content.sections,
    };
  }

  /**
   * Add a new section
   */
  async addSection(section: Omit<AboutSection, 'id'>): Promise<AboutData> {
    const content = await this.aboutRepository.findOne({ where: { key: 'main' } });

    if (!content) {
      throw new Error('About content not found');
    }

    const newSection: AboutSection = {
      ...section,
      id: uuidv4(),
    };

    content.sections.push(newSection);
    content.sections.sort((a, b) => a.order - b.order);

    await this.aboutRepository.save(content);

    return {
      profile: content.profile,
      sections: content.sections,
    };
  }

  /**
   * Update a specific section
   */
  async updateSection(sectionId: string, data: Partial<AboutSection>): Promise<AboutData> {
    const content = await this.aboutRepository.findOne({ where: { key: 'main' } });

    if (!content) {
      throw new Error('About content not found');
    }

    const sectionIndex = content.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) {
      throw new Error('Section not found');
    }

    content.sections[sectionIndex] = {
      ...content.sections[sectionIndex],
      ...data,
      id: sectionId, // Preserve ID
    } as AboutSection;

    await this.aboutRepository.save(content);

    return {
      profile: content.profile,
      sections: content.sections,
    };
  }

  /**
   * Delete a section
   */
  async deleteSection(sectionId: string): Promise<AboutData> {
    const content = await this.aboutRepository.findOne({ where: { key: 'main' } });

    if (!content) {
      throw new Error('About content not found');
    }

    content.sections = content.sections.filter(s => s.id !== sectionId);

    await this.aboutRepository.save(content);

    return {
      profile: content.profile,
      sections: content.sections,
    };
  }
}

export const aboutService = new AboutService();
