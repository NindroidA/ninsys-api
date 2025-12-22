/**
 * @fileoverview Integration tests for RackSmith Device Routes
 */

import request from 'supertest';
import express, { Express } from 'express';
import { testUser } from '../../setup.js';

// Mock the devices service
const mockListDevices = jest.fn();
const mockGetDevice = jest.fn();
const mockCreateDevice = jest.fn();
const mockUpdateDevice = jest.fn();
const mockDeleteDevice = jest.fn();

jest.mock('../../../src/services/racksmith/devicesService.js', () => ({
  devicesService: {
    listDevices: mockListDevices,
    getDevice: mockGetDevice,
    createDevice: mockCreateDevice,
    updateDevice: mockUpdateDevice,
    deleteDevice: mockDeleteDevice,
  },
}));

// Mock auth service for token verification
const mockVerifyToken = jest.fn();
jest.mock('../../../src/services/racksmith/authService.js', () => ({
  rackSmithAuthService: {
    verifyToken: mockVerifyToken,
  },
}));

// Mock TypeORM
jest.mock('../../../src/typeorm/index.js', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
      })),
    })),
  },
}));

import { createDeviceRoutes } from '../../../src/routes/racksmith/devices.js';
import { requireRackSmithAuth } from '../../../src/middleware/racksmith/authHandler.js';

describe('RackSmith Device Routes', () => {
  let app: Express;
  const validToken = 'Bearer valid-token';

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/racksmith/devices', requireRackSmithAuth, createDeviceRoutes());
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default auth mock
    mockVerifyToken.mockResolvedValue({
      valid: true,
      user: {
        id: testUser.id,
        email: testUser.email,
        username: testUser.username,
        role: 'user',
      },
    });
  });

  describe('GET /api/racksmith/devices', () => {
    it('should list devices with authentication', async () => {
      mockListDevices.mockResolvedValue({
        devices: [
          { id: 'device-1', name: 'Server 1' },
          { id: 'device-2', name: 'Switch 1' },
        ],
        total: 2,
        page: 1,
        limit: 25,
        totalPages: 1,
      });

      const response = await request(app)
        .get('/api/racksmith/devices')
        .set('Authorization', validToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // API wraps result in data property
      expect(response.body.data.devices).toHaveLength(2);
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .get('/api/racksmith/devices');

      expect(response.status).toBe(401);
    });

    it('should pass filters to service', async () => {
      mockListDevices.mockResolvedValue({
        devices: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 0,
      });

      await request(app)
        .get('/api/racksmith/devices')
        .query({ rackId: 'rack-1', type: 'server', page: 2 })
        .set('Authorization', validToken);

      // Route parses page to integer
      expect(mockListDevices).toHaveBeenCalledWith(
        testUser.id,
        expect.objectContaining({
          rackId: 'rack-1',
          type: 'server',
          page: 2,
        })
      );
    });

    it('should include pagination info', async () => {
      mockListDevices.mockResolvedValue({
        devices: [],
        total: 100,
        page: 2,
        limit: 25,
        totalPages: 4,
      });

      const response = await request(app)
        .get('/api/racksmith/devices')
        .query({ page: 2 })
        .set('Authorization', validToken);

      expect(response.body.data.total).toBe(100);
      expect(response.body.data.page).toBe(2);
      expect(response.body.data.totalPages).toBe(4);
    });
  });

  describe('GET /api/racksmith/devices/:id', () => {
    it('should return device by ID', async () => {
      const mockDevice = {
        id: 'device-1',
        name: 'Server 1',
        type: 'server',
        rack: { id: 'rack-1', name: 'Rack A' },
      };
      mockGetDevice.mockResolvedValue(mockDevice);

      const response = await request(app)
        .get('/api/racksmith/devices/device-1')
        .set('Authorization', validToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockDevice);
    });

    it('should return 404 if device not found', async () => {
      mockGetDevice.mockRejectedValue(new Error('Device not found'));

      const response = await request(app)
        .get('/api/racksmith/devices/nonexistent')
        .set('Authorization', validToken);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/racksmith/devices', () => {
    const validDevice = {
      name: 'New Server',
      type: 'server',
      manufacturer: 'Dell',
      model: 'PowerEdge R740',
      rackId: 'rack-1',
      positionU: 5,
      sizeU: 2,
    };

    it('should create device with valid data', async () => {
      mockCreateDevice.mockResolvedValue({
        id: 'new-device',
        ...validDevice,
        userId: testUser.id,
      });

      const response = await request(app)
        .post('/api/racksmith/devices')
        .set('Authorization', validToken)
        .send(validDevice);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validDevice.name);
    });

    it('should pass device data to service', async () => {
      mockCreateDevice.mockResolvedValue({
        id: 'new-device',
        ...validDevice,
        userId: testUser.id,
      });

      await request(app)
        .post('/api/racksmith/devices')
        .set('Authorization', validToken)
        .send(validDevice);

      expect(mockCreateDevice).toHaveBeenCalledWith(testUser.id, validDevice);
    });

    it('should return 400 for invalid rack', async () => {
      mockCreateDevice.mockRejectedValue(new Error('Rack not found'));

      const response = await request(app)
        .post('/api/racksmith/devices')
        .set('Authorization', validToken)
        .send(validDevice);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Rack not found');
    });

    it('should return 400 for occupied position', async () => {
      mockCreateDevice.mockRejectedValue(new Error('Position 5U is already occupied'));

      const response = await request(app)
        .post('/api/racksmith/devices')
        .set('Authorization', validToken)
        .send(validDevice);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('occupied');
    });
  });

  describe('PUT /api/racksmith/devices/:id', () => {
    it('should update device', async () => {
      mockUpdateDevice.mockResolvedValue({
        id: 'device-1',
        name: 'Updated Server',
        type: 'server',
      });

      const response = await request(app)
        .put('/api/racksmith/devices/device-1')
        .set('Authorization', validToken)
        .send({ name: 'Updated Server' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Server');
    });

    it('should return 404 if device not found', async () => {
      mockUpdateDevice.mockRejectedValue(new Error('Device not found'));

      const response = await request(app)
        .put('/api/racksmith/devices/nonexistent')
        .set('Authorization', validToken)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid position', async () => {
      mockUpdateDevice.mockRejectedValue(new Error('Position 50U is already occupied'));

      const response = await request(app)
        .put('/api/racksmith/devices/device-1')
        .set('Authorization', validToken)
        .send({ positionU: 50 });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/racksmith/devices/:id', () => {
    it('should soft delete device', async () => {
      mockDeleteDevice.mockResolvedValue({ message: 'Device deleted successfully' });

      const response = await request(app)
        .delete('/api/racksmith/devices/device-1')
        .set('Authorization', validToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 if device not found', async () => {
      mockDeleteDevice.mockRejectedValue(new Error('Device not found'));

      const response = await request(app)
        .delete('/api/racksmith/devices/nonexistent')
        .set('Authorization', validToken);

      expect(response.status).toBe(404);
    });
  });
});
