/**
 * @fileoverview Device Service for RackSmith
 * @description Business logic for device management
 */

import { AppDataSource } from '../../typeorm/index.js';
import { Device } from '../../typeorm/entities/Device.js';
import { Rack } from '../../typeorm/entities/Rack.js';
import { IsNull } from 'typeorm';

export interface DeviceFilters {
  rackId?: string;
  type?: string;
  manufacturer?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const devicesService = {
  /**
   * List devices with pagination and filtering
   */
  async listDevices(userId: string, filters: DeviceFilters = {}) {
    const {
      rackId,
      type,
      manufacturer,
      search,
      page = 1,
      limit = 25
    } = filters;

    const repository = AppDataSource.getRepository(Device);
    const query = repository.createQueryBuilder('device')
      .where('device.userId = :userId', { userId })
      .andWhere('device.deletedAt IS NULL');

    // Apply filters
    if (rackId) {
      query.andWhere('device.rackId = :rackId', { rackId });
    }

    if (type) {
      query.andWhere('device.type = :type', { type });
    }

    if (manufacturer) {
      query.andWhere('device.manufacturer = :manufacturer', { manufacturer });
    }

    if (search) {
      query.andWhere(
        '(device.name LIKE :search OR device.model LIKE :search OR device.manufacturer LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Pagination
    const maxLimit = 100;
    const validLimit = Math.min(limit, maxLimit);
    const skip = (page - 1) * validLimit;

    const [devices, total] = await query
      .skip(skip)
      .take(validLimit)
      .orderBy('device.createdAt', 'DESC')
      .getManyAndCount();

    return {
      devices,
      total,
      page,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit)
    };
  },

  /**
   * Get single device by ID
   */
  async getDevice(id: string, userId: string) {
    const repository = AppDataSource.getRepository(Device);
    const device = await repository.findOne({
      where: { id, userId, deletedAt: IsNull() },
      relations: ['rack']
    });

    if (!device) {
      throw new Error('Device not found');
    }

    return device;
  },

  /**
   * Create a new device
   */
  async createDevice(userId: string, deviceData: Partial<Device>) {
    const repository = AppDataSource.getRepository(Device);

    // Validate rack exists if rackId provided
    if (deviceData.rackId) {
      const rackRepository = AppDataSource.getRepository(Rack);
      const rack = await rackRepository.findOne({
        where: { id: deviceData.rackId, userId, deletedAt: IsNull() }
      });

      if (!rack) {
        throw new Error('Rack not found');
      }

      // Validate position if provided
      if (deviceData.positionU !== undefined) {
        if (deviceData.positionU < 1 || deviceData.positionU > rack.sizeU) {
          throw new Error(`Position must be between 1 and ${rack.sizeU}`);
        }

        // Check if position is available
        const existingDevice = await repository.findOne({
          where: {
            rackId: rack.id,
            positionU: deviceData.positionU,
            deletedAt: IsNull()
          }
        });

        if (existingDevice) {
          throw new Error(`Position ${deviceData.positionU}U is already occupied`);
        }
      }
    }

    const device = repository.create({
      ...deviceData,
      userId
    });

    return await repository.save(device);
  },

  /**
   * Update a device
   */
  async updateDevice(id: string, userId: string, updates: Partial<Device>) {
    const repository = AppDataSource.getRepository(Device);
    const device = await repository.findOne({
      where: { id, userId, deletedAt: IsNull() }
    });

    if (!device) {
      throw new Error('Device not found');
    }

    // Validate rack if changing rackId
    if (updates.rackId && updates.rackId !== device.rackId) {
      const rackRepository = AppDataSource.getRepository(Rack);
      const rack = await rackRepository.findOne({
        where: { id: updates.rackId, userId, deletedAt: IsNull() }
      });

      if (!rack) {
        throw new Error('Rack not found');
      }
    }

    // Validate position if changing
    if (updates.positionU !== undefined && updates.positionU !== device.positionU) {
      const rackId = updates.rackId || device.rackId;
      if (rackId) {
        const rackRepository = AppDataSource.getRepository(Rack);
        const rack = await rackRepository.findOne({
          where: { id: rackId, userId, deletedAt: IsNull() }
        });

        if (rack) {
          if (updates.positionU < 1 || updates.positionU > rack.sizeU) {
            throw new Error(`Position must be between 1 and ${rack.sizeU}`);
          }

          const existingDevice = await repository.findOne({
            where: {
              rackId: rack.id,
              positionU: updates.positionU,
              deletedAt: IsNull()
            }
          });

          if (existingDevice && existingDevice.id !== id) {
            throw new Error(`Position ${updates.positionU}U is already occupied`);
          }
        }
      }
    }

    Object.assign(device, updates);
    return await repository.save(device);
  },

  /**
   * Delete a device (soft delete)
   */
  async deleteDevice(id: string, userId: string) {
    const repository = AppDataSource.getRepository(Device);
    const device = await repository.findOne({
      where: { id, userId, deletedAt: IsNull() }
    });

    if (!device) {
      throw new Error('Device not found');
    }

    device.deletedAt = new Date();
    await repository.save(device);

    return { message: 'Device deleted successfully' };
  }
};
