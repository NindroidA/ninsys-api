/**
 * @fileoverview Unit tests for RackSmith Connections Service
 */

import { testUser } from '../../setup.js';

// Mock query builder
const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
};

// Mock repositories
const mockConnectionRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

const mockDeviceRepository = {
  findOne: jest.fn(),
};

jest.mock('../../../src/typeorm/index.js', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      if (entity.name === 'Connection') return mockConnectionRepository;
      if (entity.name === 'Device') return mockDeviceRepository;
      return mockConnectionRepository;
    }),
  },
}));

import { connectionsService } from '../../../src/services/racksmith/connectionsService.js';

describe('connectionsService', () => {
  const userId = testUser.id;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset query builder mocks
    Object.values(mockQueryBuilder).forEach((mock) => {
      if (typeof mock === 'function' && mock.mockReturnThis) {
        mock.mockReturnThis();
      }
    });
  });

  describe('listConnections', () => {
    const mockConnections = [
      { id: 'conn-1', sourceDeviceId: 'device-1', targetDeviceId: 'device-2', userId },
      { id: 'conn-2', sourceDeviceId: 'device-2', targetDeviceId: 'device-3', userId },
    ];

    it('should list connections with default pagination', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockConnections, 2]);

      const result = await connectionsService.listConnections(userId);

      expect(result.connections).toEqual(mockConnections);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50); // Default limit for connections
    });

    it('should filter by deviceId (source OR target)', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockConnections, 2]);

      await connectionsService.listConnections(userId, { deviceId: 'device-1' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(connection.sourceDeviceId = :deviceId OR connection.targetDeviceId = :deviceId)',
        { deviceId: 'device-1' }
      );
    });

    it('should filter by cableType', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockConnections, 2]);

      await connectionsService.listConnections(userId, { cableType: 'cat6' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'connection.cableType = :cableType',
        { cableType: 'cat6' }
      );
    });

    it('should filter by vlan', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockConnections, 2]);

      await connectionsService.listConnections(userId, { vlan: '100' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'connection.vlan = :vlan',
        { vlan: '100' }
      );
    });

    it('should apply pagination correctly', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockConnections, 100]);

      const result = await connectionsService.listConnections(userId, { page: 3, limit: 20 });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(40); // (3-1) * 20
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(result.totalPages).toBe(5);
    });

    it('should enforce max limit of 100', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockConnections, 2]);

      await connectionsService.listConnections(userId, { limit: 500 });

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(100);
    });

    it('should order by createdAt DESC', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockConnections, 2]);

      await connectionsService.listConnections(userId);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('connection.createdAt', 'DESC');
    });
  });

  describe('getConnection', () => {
    const mockConnection = {
      id: 'conn-1',
      sourceDeviceId: 'device-1',
      targetDeviceId: 'device-2',
      userId,
    };

    it('should return connection by ID', async () => {
      mockConnectionRepository.findOne.mockResolvedValue(mockConnection);

      const result = await connectionsService.getConnection('conn-1', userId);

      expect(result).toEqual(mockConnection);
      expect(mockConnectionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'conn-1', userId },
      });
    });

    it('should throw if connection not found', async () => {
      mockConnectionRepository.findOne.mockResolvedValue(null);

      await expect(connectionsService.getConnection('nonexistent', userId))
        .rejects.toThrow('Connection not found');
    });
  });

  describe('createConnection', () => {
    const connectionData = {
      sourceDeviceId: 'device-1',
      sourcePort: 'eth0',
      targetDeviceId: 'device-2',
      targetPort: 'eth0',
      cableType: 'cat6',
    };

    const mockSourceDevice = { id: 'device-1', userId };
    const mockTargetDevice = { id: 'device-2', userId };

    it('should create connection with valid data', async () => {
      mockDeviceRepository.findOne
        .mockResolvedValueOnce(mockSourceDevice)
        .mockResolvedValueOnce(mockTargetDevice);
      mockConnectionRepository.create.mockReturnValue({ id: 'new-conn', ...connectionData, userId });
      mockConnectionRepository.save.mockResolvedValue({ id: 'new-conn', ...connectionData, userId });

      const result = await connectionsService.createConnection(userId, connectionData);

      expect(result.id).toBe('new-conn');
      expect(mockConnectionRepository.create).toHaveBeenCalledWith({
        ...connectionData,
        userId,
      });
    });

    it('should validate source device exists', async () => {
      mockDeviceRepository.findOne.mockResolvedValue(null);

      await expect(connectionsService.createConnection(userId, connectionData))
        .rejects.toThrow('Source device not found');
    });

    it('should validate target device exists', async () => {
      mockDeviceRepository.findOne
        .mockResolvedValueOnce(mockSourceDevice)
        .mockResolvedValueOnce(null);

      await expect(connectionsService.createConnection(userId, connectionData))
        .rejects.toThrow('Target device not found');
    });

    it('should create connection without devices (label-only)', async () => {
      const labelOnlyConnection = { label: 'Test Connection', cableType: 'fiber' };
      mockConnectionRepository.create.mockReturnValue({ id: 'new-conn', ...labelOnlyConnection, userId });
      mockConnectionRepository.save.mockResolvedValue({ id: 'new-conn', ...labelOnlyConnection, userId });

      const result = await connectionsService.createConnection(userId, labelOnlyConnection);

      expect(result.id).toBe('new-conn');
      expect(mockDeviceRepository.findOne).not.toHaveBeenCalled();
    });

    it('should assign userId to connection', async () => {
      mockDeviceRepository.findOne
        .mockResolvedValueOnce(mockSourceDevice)
        .mockResolvedValueOnce(mockTargetDevice);
      mockConnectionRepository.create.mockReturnValue({ id: 'new-conn', ...connectionData, userId });
      mockConnectionRepository.save.mockResolvedValue({ id: 'new-conn', ...connectionData, userId });

      await connectionsService.createConnection(userId, connectionData);

      expect(mockConnectionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId })
      );
    });
  });

  describe('updateConnection', () => {
    const existingConnection = {
      id: 'conn-1',
      sourceDeviceId: 'device-1',
      targetDeviceId: 'device-2',
      cableType: 'cat5e',
      userId,
    };

    it('should update connection fields', async () => {
      mockConnectionRepository.findOne.mockResolvedValue({ ...existingConnection });
      mockConnectionRepository.save.mockImplementation((conn) => Promise.resolve(conn));

      const result = await connectionsService.updateConnection('conn-1', userId, { cableType: 'cat6' });

      expect(result.cableType).toBe('cat6');
      expect(mockConnectionRepository.save).toHaveBeenCalled();
    });

    it('should throw if connection not found', async () => {
      mockConnectionRepository.findOne.mockResolvedValue(null);

      await expect(connectionsService.updateConnection('nonexistent', userId, { cableType: 'cat6' }))
        .rejects.toThrow('Connection not found');
    });

    it('should preserve existing fields when updating', async () => {
      mockConnectionRepository.findOne.mockResolvedValue({ ...existingConnection });
      mockConnectionRepository.save.mockImplementation((conn) => Promise.resolve(conn));

      const result = await connectionsService.updateConnection('conn-1', userId, { vlan: '200' });

      expect(result.sourceDeviceId).toBe('device-1');
      expect(result.targetDeviceId).toBe('device-2');
      expect(result.cableType).toBe('cat5e');
    });
  });

  describe('deleteConnection', () => {
    const existingConnection = {
      id: 'conn-1',
      sourceDeviceId: 'device-1',
      targetDeviceId: 'device-2',
      userId,
    };

    it('should hard delete connection', async () => {
      mockConnectionRepository.findOne.mockResolvedValue(existingConnection);
      mockConnectionRepository.remove.mockResolvedValue(existingConnection);

      const result = await connectionsService.deleteConnection('conn-1', userId);

      expect(result.message).toBe('Connection deleted successfully');
      expect(mockConnectionRepository.remove).toHaveBeenCalledWith(existingConnection);
    });

    it('should throw if connection not found', async () => {
      mockConnectionRepository.findOne.mockResolvedValue(null);

      await expect(connectionsService.deleteConnection('nonexistent', userId))
        .rejects.toThrow('Connection not found');
    });

    it('should use remove (not save with deletedAt)', async () => {
      mockConnectionRepository.findOne.mockResolvedValue(existingConnection);
      mockConnectionRepository.remove.mockResolvedValue(existingConnection);

      await connectionsService.deleteConnection('conn-1', userId);

      // Should use remove, not save
      expect(mockConnectionRepository.remove).toHaveBeenCalled();
      expect(mockConnectionRepository.save).not.toHaveBeenCalled();
    });
  });
});
