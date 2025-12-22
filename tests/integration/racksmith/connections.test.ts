/**
 * @fileoverview Integration tests for RackSmith Connection Routes
 */

import request from 'supertest';
import express, { Express } from 'express';
import { testUser } from '../../setup.js';

// Mock the connections service
const mockListConnections = jest.fn();
const mockGetConnection = jest.fn();
const mockCreateConnection = jest.fn();
const mockUpdateConnection = jest.fn();
const mockDeleteConnection = jest.fn();

jest.mock('../../../src/services/racksmith/connectionsService.js', () => ({
  connectionsService: {
    listConnections: mockListConnections,
    getConnection: mockGetConnection,
    createConnection: mockCreateConnection,
    updateConnection: mockUpdateConnection,
    deleteConnection: mockDeleteConnection,
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
      remove: jest.fn(),
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

import { createConnectionRoutes } from '../../../src/routes/racksmith/connections.js';
import { requireRackSmithAuth } from '../../../src/middleware/racksmith/authHandler.js';

describe('RackSmith Connection Routes', () => {
  let app: Express;
  const validToken = 'Bearer valid-token';

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/racksmith/connections', requireRackSmithAuth, createConnectionRoutes());
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

  describe('GET /api/racksmith/connections', () => {
    it('should list connections with authentication', async () => {
      mockListConnections.mockResolvedValue({
        connections: [
          { id: 'conn-1', sourceDeviceId: 'device-1', targetDeviceId: 'device-2' },
          { id: 'conn-2', sourceDeviceId: 'device-2', targetDeviceId: 'device-3' },
        ],
        total: 2,
        page: 1,
        limit: 50,
        totalPages: 1,
      });

      const response = await request(app)
        .get('/api/racksmith/connections')
        .set('Authorization', validToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.connections).toHaveLength(2);
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .get('/api/racksmith/connections');

      expect(response.status).toBe(401);
    });

    it('should filter by deviceId', async () => {
      mockListConnections.mockResolvedValue({
        connections: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
      });

      await request(app)
        .get('/api/racksmith/connections')
        .query({ deviceId: 'device-1' })
        .set('Authorization', validToken);

      expect(mockListConnections).toHaveBeenCalledWith(
        testUser.id,
        expect.objectContaining({ deviceId: 'device-1' })
      );
    });

    it('should filter by cableType', async () => {
      mockListConnections.mockResolvedValue({
        connections: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
      });

      await request(app)
        .get('/api/racksmith/connections')
        .query({ cableType: 'cat6' })
        .set('Authorization', validToken);

      expect(mockListConnections).toHaveBeenCalledWith(
        testUser.id,
        expect.objectContaining({ cableType: 'cat6' })
      );
    });

    it('should filter by vlan', async () => {
      mockListConnections.mockResolvedValue({
        connections: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
      });

      await request(app)
        .get('/api/racksmith/connections')
        .query({ vlan: '100' })
        .set('Authorization', validToken);

      expect(mockListConnections).toHaveBeenCalledWith(
        testUser.id,
        expect.objectContaining({ vlan: '100' })
      );
    });
  });

  describe('GET /api/racksmith/connections/:id', () => {
    it('should return connection by ID', async () => {
      const mockConnection = {
        id: 'conn-1',
        sourceDeviceId: 'device-1',
        sourcePort: 'eth0',
        targetDeviceId: 'device-2',
        targetPort: 'eth1',
        cableType: 'cat6',
      };
      mockGetConnection.mockResolvedValue(mockConnection);

      const response = await request(app)
        .get('/api/racksmith/connections/conn-1')
        .set('Authorization', validToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockConnection);
    });

    it('should return 404 if connection not found', async () => {
      mockGetConnection.mockRejectedValue(new Error('Connection not found'));

      const response = await request(app)
        .get('/api/racksmith/connections/nonexistent')
        .set('Authorization', validToken);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/racksmith/connections', () => {
    const validConnection = {
      sourceDeviceId: 'device-1',
      sourcePort: 'eth0',
      targetDeviceId: 'device-2',
      targetPort: 'eth0',
      cableType: 'cat6',
      cableLengthFt: 10,
    };

    it('should create connection with valid data', async () => {
      mockCreateConnection.mockResolvedValue({
        id: 'new-conn',
        ...validConnection,
        userId: testUser.id,
      });

      const response = await request(app)
        .post('/api/racksmith/connections')
        .set('Authorization', validToken)
        .send(validConnection);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sourceDeviceId).toBe(validConnection.sourceDeviceId);
    });

    it('should return 400 for invalid source device', async () => {
      mockCreateConnection.mockRejectedValue(new Error('Source device not found'));

      const response = await request(app)
        .post('/api/racksmith/connections')
        .set('Authorization', validToken)
        .send(validConnection);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Source device not found');
    });

    it('should return 400 for invalid target device', async () => {
      mockCreateConnection.mockRejectedValue(new Error('Target device not found'));

      const response = await request(app)
        .post('/api/racksmith/connections')
        .set('Authorization', validToken)
        .send(validConnection);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Target device not found');
    });

    it('should create connection without devices (label-only)', async () => {
      const labelOnlyConnection = {
        label: 'Internet Uplink',
        cableType: 'fiber',
        description: 'Main internet connection',
      };

      mockCreateConnection.mockResolvedValue({
        id: 'new-conn',
        ...labelOnlyConnection,
        userId: testUser.id,
      });

      const response = await request(app)
        .post('/api/racksmith/connections')
        .set('Authorization', validToken)
        .send(labelOnlyConnection);

      expect(response.status).toBe(201);
    });
  });

  describe('PUT /api/racksmith/connections/:id', () => {
    it('should update connection', async () => {
      mockUpdateConnection.mockResolvedValue({
        id: 'conn-1',
        cableType: 'cat6a',
        cableLengthFt: 15,
      });

      const response = await request(app)
        .put('/api/racksmith/connections/conn-1')
        .set('Authorization', validToken)
        .send({ cableType: 'cat6a', cableLengthFt: 15 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.cableType).toBe('cat6a');
    });

    it('should return 404 if connection not found', async () => {
      mockUpdateConnection.mockRejectedValue(new Error('Connection not found'));

      const response = await request(app)
        .put('/api/racksmith/connections/nonexistent')
        .set('Authorization', validToken)
        .send({ cableType: 'cat6a' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/racksmith/connections/:id', () => {
    it('should hard delete connection', async () => {
      mockDeleteConnection.mockResolvedValue({ message: 'Connection deleted successfully' });

      const response = await request(app)
        .delete('/api/racksmith/connections/conn-1')
        .set('Authorization', validToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 if connection not found', async () => {
      mockDeleteConnection.mockRejectedValue(new Error('Connection not found'));

      const response = await request(app)
        .delete('/api/racksmith/connections/nonexistent')
        .set('Authorization', validToken);

      expect(response.status).toBe(404);
    });
  });
});
