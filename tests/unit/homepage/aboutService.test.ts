/**
 * @fileoverview Unit tests for Homepage About Service
 */

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

// Mock repository
const mockAboutRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

jest.mock('../../../src/typeorm/index.js', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => mockAboutRepository),
  },
}));

import { aboutService } from '../../../src/services/homepage/aboutService.js';

describe('aboutService', () => {
  const mockProfile = {
    name: 'John Doe',
    tagline: 'Software Developer',
    location: 'New York',
    bio: ['Bio paragraph 1', 'Bio paragraph 2'],
    social: {
      github: 'https://github.com/johndoe',
      email: 'john@example.com',
    },
  };

  const mockSections = [
    {
      id: 'section-1',
      type: 'skills',
      title: 'Skills',
      order: 0,
      size: 'medium',
      content: { categories: [] },
    },
    {
      id: 'section-2',
      type: 'experience',
      title: 'Experience',
      order: 1,
      size: 'large',
      content: { items: [] },
    },
  ];

  const mockAboutContent = {
    id: 'about-1',
    key: 'main',
    profile: mockProfile,
    sections: mockSections,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAboutContent', () => {
    it('should return existing about content', async () => {
      mockAboutRepository.findOne.mockResolvedValue(mockAboutContent);

      const result = await aboutService.getAboutContent();

      expect(result.profile).toEqual(mockProfile);
      expect(result.sections).toEqual(mockSections);
      expect(mockAboutRepository.findOne).toHaveBeenCalledWith({
        where: { key: 'main' },
      });
    });

    it('should create default content if none exists', async () => {
      mockAboutRepository.findOne.mockResolvedValue(null);
      mockAboutRepository.create.mockImplementation((data) => data);
      mockAboutRepository.save.mockImplementation((data) => Promise.resolve({ id: 'new-id', ...data }));

      const result = await aboutService.getAboutContent();

      expect(result.profile).toBeDefined();
      expect(result.sections).toBeDefined();
      expect(mockAboutRepository.create).toHaveBeenCalled();
      expect(mockAboutRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateAboutContent', () => {
    it('should update profile data', async () => {
      mockAboutRepository.findOne.mockResolvedValue({ ...mockAboutContent });
      mockAboutRepository.save.mockImplementation((data) => Promise.resolve(data));

      const newProfile = { ...mockProfile, name: 'Jane Doe' };
      const result = await aboutService.updateAboutContent({ profile: newProfile });

      expect(result.profile.name).toBe('Jane Doe');
      expect(mockAboutRepository.save).toHaveBeenCalled();
    });

    it('should update sections', async () => {
      mockAboutRepository.findOne.mockResolvedValue({ ...mockAboutContent });
      mockAboutRepository.save.mockImplementation((data) => Promise.resolve(data));

      const newSections = [{ ...mockSections[0], title: 'Updated Skills' }];
      const result = await aboutService.updateAboutContent({ sections: newSections });

      expect(result.sections).toEqual(newSections);
    });

    it('should create new content if none exists', async () => {
      mockAboutRepository.findOne.mockResolvedValue(null);
      mockAboutRepository.create.mockImplementation((data) => data);
      mockAboutRepository.save.mockImplementation((data) => Promise.resolve({ id: 'new-id', ...data }));

      const result = await aboutService.updateAboutContent({ profile: mockProfile });

      expect(mockAboutRepository.create).toHaveBeenCalled();
      expect(mockAboutRepository.save).toHaveBeenCalled();
    });

    it('should merge profile updates with existing profile', async () => {
      mockAboutRepository.findOne.mockResolvedValue({ ...mockAboutContent });
      mockAboutRepository.save.mockImplementation((data) => Promise.resolve(data));

      const partialProfile = { name: 'Updated Name' };
      const result = await aboutService.updateAboutContent({ profile: partialProfile as any });

      // Should keep existing fields and update specified ones
      expect(result.profile.name).toBe('Updated Name');
    });
  });

  describe('updateSectionsOrder', () => {
    it('should update section order', async () => {
      mockAboutRepository.findOne.mockResolvedValue({
        ...mockAboutContent,
        sections: [...mockSections],
      });
      mockAboutRepository.save.mockImplementation((data) => Promise.resolve(data));

      const orders = [
        { id: 'section-2', order: 0 },
        { id: 'section-1', order: 1 },
      ];

      const result = await aboutService.updateSectionsOrder(orders);

      const section1 = result.sections.find((s: any) => s.id === 'section-1');
      const section2 = result.sections.find((s: any) => s.id === 'section-2');

      expect(section2.order).toBe(0);
      expect(section1.order).toBe(1);
    });

    it('should throw error if content not found', async () => {
      mockAboutRepository.findOne.mockResolvedValue(null);

      await expect(aboutService.updateSectionsOrder([]))
        .rejects.toThrow('About content not found');
    });

    it('should sort sections by new order', async () => {
      mockAboutRepository.findOne.mockResolvedValue({
        ...mockAboutContent,
        sections: [...mockSections],
      });
      mockAboutRepository.save.mockImplementation((data) => Promise.resolve(data));

      const orders = [
        { id: 'section-2', order: 0 },
        { id: 'section-1', order: 1 },
      ];

      const result = await aboutService.updateSectionsOrder(orders);

      // First section should be section-2 after sorting
      expect(result.sections[0].id).toBe('section-2');
    });
  });

  describe('addSection', () => {
    it('should add a new section', async () => {
      mockAboutRepository.findOne.mockResolvedValue({
        ...mockAboutContent,
        sections: [...mockSections],
      });
      mockAboutRepository.save.mockImplementation((data) => Promise.resolve(data));

      const newSection = {
        type: 'education' as const,
        title: 'Education',
        order: 2,
        size: 'medium' as const,
        content: { items: [] },
      };

      const result = await aboutService.addSection(newSection);

      expect(result.sections).toHaveLength(3);
      const addedSection = result.sections.find((s: any) => s.title === 'Education');
      expect(addedSection).toBeDefined();
      expect(addedSection.id).toBe('mock-uuid-1234');
    });

    it('should throw error if content not found', async () => {
      mockAboutRepository.findOne.mockResolvedValue(null);

      await expect(aboutService.addSection({
        type: 'skills',
        title: 'Skills',
        order: 0,
        size: 'medium',
        content: { categories: [] },
      })).rejects.toThrow('About content not found');
    });
  });

  describe('updateSection', () => {
    it('should update a specific section', async () => {
      mockAboutRepository.findOne.mockResolvedValue({
        ...mockAboutContent,
        sections: [...mockSections],
      });
      mockAboutRepository.save.mockImplementation((data) => Promise.resolve(data));

      const result = await aboutService.updateSection('section-1', { title: 'Updated Skills' });

      const updatedSection = result.sections.find((s: any) => s.id === 'section-1');
      expect(updatedSection.title).toBe('Updated Skills');
    });

    it('should throw error if section not found', async () => {
      mockAboutRepository.findOne.mockResolvedValue({
        ...mockAboutContent,
        sections: [...mockSections],
      });

      await expect(aboutService.updateSection('nonexistent', { title: 'Test' }))
        .rejects.toThrow('Section not found');
    });

    it('should preserve section id', async () => {
      mockAboutRepository.findOne.mockResolvedValue({
        ...mockAboutContent,
        sections: [...mockSections],
      });
      mockAboutRepository.save.mockImplementation((data) => Promise.resolve(data));

      const result = await aboutService.updateSection('section-1', { title: 'New Title' });

      const updatedSection = result.sections.find((s: any) => s.id === 'section-1');
      expect(updatedSection.id).toBe('section-1');
    });
  });

  describe('deleteSection', () => {
    it('should delete a section', async () => {
      mockAboutRepository.findOne.mockResolvedValue({
        ...mockAboutContent,
        sections: [...mockSections],
      });
      mockAboutRepository.save.mockImplementation((data) => Promise.resolve(data));

      const result = await aboutService.deleteSection('section-1');

      expect(result.sections).toHaveLength(1);
      expect(result.sections.find((s: any) => s.id === 'section-1')).toBeUndefined();
    });

    it('should throw error if content not found', async () => {
      mockAboutRepository.findOne.mockResolvedValue(null);

      await expect(aboutService.deleteSection('section-1'))
        .rejects.toThrow('About content not found');
    });
  });
});
