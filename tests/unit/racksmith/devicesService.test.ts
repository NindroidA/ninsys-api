/**
 * @fileoverview Unit tests for RackSmith Devices Service
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

// Mock repository
const mockDeviceRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

const mockRackRepository = {
  findOne: jest.fn(),
};

jest.mock('../../../src/typeorm/index.js', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      if (entity.name === 'Device') return mockDeviceRepository;
      if (entity.name === 'Rack') return mockRackRepository;
      return mockDeviceRepository;
    }),
  },
}));

import { devicesService } from '../../../src/services/racksmith/devicesService.js';

describe('devicesService', () => {
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

  describe('listDevices', () => {
    const mockDevices = [
      { id: 'device-1', name: 'Server 1', userId },
      { id: 'device-2', name: 'Switch 1', userId },
    ];

    it('should list devices with default pagination', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockDevices, 2]);

      const result = await devicesService.listDevices(userId);

      expect(result.devices).toEqual(mockDevices);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(25);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'device.userId = :userId',
        { userId }
      );
    });

    it('should filter by rackId', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockDevices, 2]);

      await devicesService.listDevices(userId, { rackId: 'rack-1' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'device.rackId = :rackId',
        { rackId: 'rack-1' }
      );
    });

    it('should filter by type', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockDevices, 2]);

      await devicesService.listDevices(userId, { type: 'server' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'device.type = :type',
        { type: 'server' }
      );
    });

    it('should filter by manufacturer', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockDevices, 2]);

      await devicesService.listDevices(userId, { manufacturer: 'Dell' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'device.manufacturer = :manufacturer',
        { manufacturer: 'Dell' }
      );
    });

    it('should search by name, model, or manufacturer', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockDevices, 2]);

      await devicesService.listDevices(userId, { search: 'Dell' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(device.name LIKE :search OR device.model LIKE :search OR device.manufacturer LIKE :search)',
        { search: '%Dell%' }
      );
    });

    it('should apply pagination correctly', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockDevices, 50]);

      const result = await devicesService.listDevices(userId, { page: 2, limit: 10 });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10); // (2-1) * 10
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(5);
    });

    it('should enforce max limit of 100', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockDevices, 2]);

      await devicesService.listDevices(userId, { limit: 200 });

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(100);
    });

    it('should exclude soft-deleted devices', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockDevices, 2]);

      await devicesService.listDevices(userId);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'device.deletedAt IS NULL'
      );
    });

    it('should order by createdAt DESC', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockDevices, 2]);

      await devicesService.listDevices(userId);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('device.createdAt', 'DESC');
    });
  });

  describe('getDevice', () => {
    const mockDevice = {
      id: 'device-1',
      name: 'Server 1',
      userId,
      rack: { id: 'rack-1', name: 'Rack A' },
    };

    it('should return device with rack relation', async () => {
      mockDeviceRepository.findOne.mockResolvedValue(mockDevice);

      const result = await devicesService.getDevice('device-1', userId);

      expect(result).toEqual(mockDevice);
      expect(mockDeviceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'device-1', userId, deletedAt: expect.anything() },
        relations: ['rack'],
      });
    });

    it('should throw error if device not found', async () => {
      mockDeviceRepository.findOne.mockResolvedValue(null);

      await expect(devicesService.getDevice('nonexistent', userId))
        .rejects.toThrow('Device not found');
    });
  });

  describe('createDevice', () => {
    const mockRack = {
      id: 'rack-1',
      name: 'Rack A',
      sizeU: 42,
      userId,
    };

    const deviceData = {
      name: 'New Server',
      type: 'server',
      manufacturer: 'Dell',
      rackId: 'rack-1',
      positionU: 5,
    };

    it('should create device with valid data', async () => {
      mockRackRepository.findOne.mockResolvedValue(mockRack);
      mockDeviceRepository.findOne.mockResolvedValue(null); // No existing device at position
      mockDeviceRepository.create.mockReturnValue({ id: 'new-device', ...deviceData, userId });
      mockDeviceRepository.save.mockResolvedValue({ id: 'new-device', ...deviceData, userId });

      const result = await devicesService.createDevice(userId, deviceData);

      expect(result.id).toBe('new-device');
      expect(mockDeviceRepository.create).toHaveBeenCalledWith({
        ...deviceData,
        userId,
      });
    });

    it('should validate rack exists if rackId provided', async () => {
      mockRackRepository.findOne.mockResolvedValue(null);

      await expect(devicesService.createDevice(userId, deviceData))
        .rejects.toThrow('Rack not found');
    });

    it('should validate position within rack size', async () => {
      mockRackRepository.findOne.mockResolvedValue(mockRack);

      await expect(devicesService.createDevice(userId, { ...deviceData, positionU: 50 }))
        .rejects.toThrow('Position must be between 1 and 42');
    });

    it('should reject position less than 1', async () => {
      mockRackRepository.findOne.mockResolvedValue(mockRack);

      await expect(devicesService.createDevice(userId, { ...deviceData, positionU: 0 }))
        .rejects.toThrow('Position must be between 1 and 42');
    });

    it('should reject occupied positions', async () => {
      mockRackRepository.findOne.mockResolvedValue(mockRack);
      mockDeviceRepository.findOne.mockResolvedValue({ id: 'existing-device', positionU: 5 });

      await expect(devicesService.createDevice(userId, deviceData))
        .rejects.toThrow('Position 5U is already occupied');
    });

    it('should create device without rack', async () => {
      const deviceWithoutRack = { name: 'Standalone Device', type: 'other' };
      mockDeviceRepository.create.mockReturnValue({ id: 'new-device', ...deviceWithoutRack, userId });
      mockDeviceRepository.save.mockResolvedValue({ id: 'new-device', ...deviceWithoutRack, userId });

      const result = await devicesService.createDevice(userId, deviceWithoutRack);

      expect(result.id).toBe('new-device');
      expect(mockRackRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('updateDevice', () => {
    const existingDevice = {
      id: 'device-1',
      name: 'Old Name',
      userId,
      rackId: 'rack-1',
      positionU: 5,
    };

    const mockRack = {
      id: 'rack-1',
      sizeU: 42,
      userId,
    };

    it('should update device fields', async () => {
      mockDeviceRepository.findOne.mockResolvedValue({ ...existingDevice });
      mockDeviceRepository.save.mockImplementation((device) => Promise.resolve(device));

      const result = await devicesService.updateDevice('device-1', userId, { name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(mockDeviceRepository.save).toHaveBeenCalled();
    });

    it('should throw if device not found', async () => {
      mockDeviceRepository.findOne.mockResolvedValue(null);

      await expect(devicesService.updateDevice('nonexistent', userId, { name: 'New Name' }))
        .rejects.toThrow('Device not found');
    });

    it('should validate new rack if changing rackId', async () => {
      mockDeviceRepository.findOne.mockResolvedValue({ ...existingDevice });
      mockRackRepository.findOne.mockResolvedValue(null);

      await expect(devicesService.updateDevice('device-1', userId, { rackId: 'new-rack' }))
        .rejects.toThrow('Rack not found');
    });

    it('should validate new position within rack size', async () => {
      mockDeviceRepository.findOne.mockResolvedValue({ ...existingDevice });
      mockRackRepository.findOne.mockResolvedValue(mockRack);

      await expect(devicesService.updateDevice('device-1', userId, { positionU: 50 }))
        .rejects.toThrow('Position must be between 1 and 42');
    });

    it('should allow updating to same position', async () => {
      mockDeviceRepository.findOne
        .mockResolvedValueOnce({ ...existingDevice })
        .mockResolvedValueOnce({ ...existingDevice }); // Same device at position
      mockRackRepository.findOne.mockResolvedValue(mockRack);
      mockDeviceRepository.save.mockImplementation((device) => Promise.resolve(device));

      // Should not throw - device is updating its own position
      const result = await devicesService.updateDevice('device-1', userId, { positionU: 5 });
      expect(result).toBeDefined();
    });
  });

  describe('deleteDevice', () => {
    const existingDevice = {
      id: 'device-1',
      name: 'Server 1',
      userId,
      deletedAt: null,
    };

    it('should soft delete device (set deletedAt)', async () => {
      mockDeviceRepository.findOne.mockResolvedValue({ ...existingDevice });
      mockDeviceRepository.save.mockImplementation((device) => Promise.resolve(device));

      const result = await devicesService.deleteDevice('device-1', userId);

      expect(result.message).toBe('Device deleted successfully');
      const savedDevice = mockDeviceRepository.save.mock.calls[0][0];
      expect(savedDevice.deletedAt).toBeInstanceOf(Date);
    });

    it('should throw if device not found', async () => {
      mockDeviceRepository.findOne.mockResolvedValue(null);

      await expect(devicesService.deleteDevice('nonexistent', userId))
        .rejects.toThrow('Device not found');
    });

    it('should not hard delete device', async () => {
      mockDeviceRepository.findOne.mockResolvedValue({ ...existingDevice });
      mockDeviceRepository.save.mockImplementation((device) => Promise.resolve(device));

      await devicesService.deleteDevice('device-1', userId);

      // Should call save, not remove/delete
      expect(mockDeviceRepository.save).toHaveBeenCalled();
    });
  });
});
