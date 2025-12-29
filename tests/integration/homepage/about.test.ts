/**
 * @fileoverview Integration tests for Homepage About Routes
 * @description Tests validation and error handling for about page endpoints
 */

import request from 'supertest';
import express, { Express } from 'express';

// Mock the about service
const mockGetAboutContent = jest.fn();
const mockUpdateAboutContent = jest.fn();
const mockAddSection = jest.fn();
const mockUpdateSection = jest.fn();
const mockDeleteSection = jest.fn();
const mockUpdateSectionsOrder = jest.fn();

jest.mock('../../../src/services/homepage/aboutService.js', () => ({
  aboutService: {
    getAboutContent: mockGetAboutContent,
    updateAboutContent: mockUpdateAboutContent,
    addSection: mockAddSection,
    updateSection: mockUpdateSection,
    deleteSection: mockDeleteSection,
    updateSectionsOrder: mockUpdateSectionsOrder,
  },
}));

// Mock auth middleware to allow testing validation without auth concerns
jest.mock('../../../src/middleware/shared/authHandler.js', () => ({
  requireAuth: (req: any, res: any, next: () => void) => next(),
}));

// Mock rate limiter to avoid rate limiting in tests
jest.mock('../../../src/middleware/shared/rateLimiter.js', () => ({
  authLimiter: (req: unknown, res: unknown, next: () => void) => next(),
  generalLimiter: (req: unknown, res: unknown, next: () => void) => next(),
  goveeControlLimiter: (req: unknown, res: unknown, next: () => void) => next(),
  createRateLimiter: () => (req: unknown, res: unknown, next: () => void) => next(),
}));

// Mock logger to avoid console output during tests
jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { createAboutRoutes } from '../../../src/routes/homepage/about.js';

describe('Homepage About Routes - Request Validation', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/about', createAboutRoutes());
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('PUT /api/about - Request Body Validation', () => {
    it('should reject missing request body', async () => {
      const response = await request(app)
        .put('/api/about')
        .send();

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Request body is required');
    });

    it('should reject empty object request body', async () => {
      const response = await request(app)
        .put('/api/about')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('At least one of profile or sections must be provided');
    });

    it('should reject request body with only unrelated fields', async () => {
      const response = await request(app)
        .put('/api/about')
        .send({ unrelatedField: 'value', anotherField: 123 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('At least one of profile or sections must be provided');
    });

    it('should reject array request body', async () => {
      const response = await request(app)
        .put('/api/about')
        .send([{ profile: { name: 'Test' } }]);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Request body is required. Ensure Content-Type is application/json');
    });

    it('should accept request body with profile field', async () => {
      const mockProfile = { name: 'John Doe', title: 'Developer' };
      mockUpdateAboutContent.mockResolvedValue({
        profile: mockProfile,
        sections: [],
      });

      const response = await request(app)
        .put('/api/about')
        .send({ profile: mockProfile });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockUpdateAboutContent).toHaveBeenCalledWith({
        profile: mockProfile,
        sections: undefined,
      });
    });

    it('should accept request body with sections field', async () => {
      const mockSections = [{ id: '1', title: 'Skills' }];
      mockUpdateAboutContent.mockResolvedValue({
        profile: {},
        sections: mockSections,
      });

      const response = await request(app)
        .put('/api/about')
        .send({ sections: mockSections });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockUpdateAboutContent).toHaveBeenCalledWith({
        profile: undefined,
        sections: mockSections,
      });
    });

    it('should accept request body with both profile and sections', async () => {
      const mockProfile = { name: 'John Doe' };
      const mockSections = [{ id: '1', title: 'Skills' }];
      mockUpdateAboutContent.mockResolvedValue({
        profile: mockProfile,
        sections: mockSections,
      });

      const response = await request(app)
        .put('/api/about')
        .send({ profile: mockProfile, sections: mockSections });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockUpdateAboutContent).toHaveBeenCalledWith({
        profile: mockProfile,
        sections: mockSections,
      });
    });

    it('should accept request body with profile, sections, and extra fields', async () => {
      const mockProfile = { name: 'John Doe' };
      const mockSections = [{ id: '1', title: 'Skills' }];
      mockUpdateAboutContent.mockResolvedValue({
        profile: mockProfile,
        sections: mockSections,
      });

      const response = await request(app)
        .put('/api/about')
        .send({
          profile: mockProfile,
          sections: mockSections,
          extraField: 'ignored',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Extra fields should be ignored, only profile and sections passed to service
      expect(mockUpdateAboutContent).toHaveBeenCalledWith({
        profile: mockProfile,
        sections: mockSections,
      });
    });
  });

  describe('PUT /api/about/sections - Array Validation', () => {
    it('should reject missing sections field', async () => {
      const response = await request(app)
        .put('/api/about/sections')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('sections must be an array');
    });

    it('should reject non-array sections field', async () => {
      const response = await request(app)
        .put('/api/about/sections')
        .send({ sections: 'not an array' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('sections must be an array');
    });

    it('should accept valid sections array', async () => {
      const mockSections = [
        { id: '1', order: 0 },
        { id: '2', order: 1 },
      ];
      mockUpdateSectionsOrder.mockResolvedValue({ sections: mockSections });

      const response = await request(app)
        .put('/api/about/sections')
        .send({ sections: mockSections });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockUpdateSectionsOrder).toHaveBeenCalledWith(mockSections);
    });
  });

  describe('POST /api/about/sections - Field Validation', () => {
    it('should reject request with missing required fields', async () => {
      const response = await request(app)
        .post('/api/about/sections')
        .send({ type: 'skills' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should reject request with invalid type', async () => {
      const response = await request(app)
        .post('/api/about/sections')
        .send({
          type: 'invalid',
          title: 'Test',
          order: 0,
          size: 'medium',
          content: {},
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid type');
    });

    it('should reject request with invalid size', async () => {
      const response = await request(app)
        .post('/api/about/sections')
        .send({
          type: 'skills',
          title: 'Test',
          order: 0,
          size: 'invalid',
          content: {},
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid size');
    });

    it('should accept valid section creation request', async () => {
      const validSection = {
        type: 'skills',
        title: 'My Skills',
        icon: 'code',
        order: 0,
        size: 'medium',
        content: { items: ['JavaScript', 'TypeScript'] },
      };
      mockAddSection.mockResolvedValue({ sections: [validSection] });

      const response = await request(app)
        .post('/api/about/sections')
        .send(validSection);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockAddSection).toHaveBeenCalledWith(validSection);
    });
  });

  describe('GET /api/about - Public Endpoint', () => {
    it('should return about content successfully', async () => {
      const mockData = {
        profile: { name: 'John Doe' },
        sections: [],
      };
      mockGetAboutContent.mockResolvedValue(mockData);

      const response = await request(app).get('/api/about');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockData);
    });
  });
});
