/**
 * @fileoverview Connection Service for RackSmith
 * @description Business logic for network connection management
 */

import { AppDataSource } from '../../typeorm/index.js';
import { Connection } from '../../typeorm/entities/Connection.js';
import { Device } from '../../typeorm/entities/Device.js';
import { IsNull } from 'typeorm';

export interface ConnectionFilters {
  deviceId?: string;
  cableType?: string;
  vlan?: string;
  page?: number;
  limit?: number;
}

export const connectionsService = {
  /**
   * List connections with pagination and filtering
   */
  async listConnections(userId: string, filters: ConnectionFilters = {}) {
    const {
      deviceId,
      cableType,
      vlan,
      page = 1,
      limit = 50
    } = filters;

    const repository = AppDataSource.getRepository(Connection);
    const query = repository.createQueryBuilder('connection')
      .where('connection.userId = :userId', { userId });

    // Apply filters
    if (deviceId) {
      query.andWhere(
        '(connection.sourceDeviceId = :deviceId OR connection.targetDeviceId = :deviceId)',
        { deviceId }
      );
    }

    if (cableType) {
      query.andWhere('connection.cableType = :cableType', { cableType });
    }

    if (vlan) {
      query.andWhere('connection.vlan = :vlan', { vlan });
    }

    // Pagination
    const maxLimit = 100;
    const validLimit = Math.min(limit, maxLimit);
    const skip = (page - 1) * validLimit;

    const [connections, total] = await query
      .skip(skip)
      .take(validLimit)
      .orderBy('connection.createdAt', 'DESC')
      .getManyAndCount();

    return {
      connections,
      total,
      page,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit)
    };
  },

  /**
   * Get single connection by ID
   */
  async getConnection(id: string, userId: string) {
    const repository = AppDataSource.getRepository(Connection);
    const connection = await repository.findOne({
      where: { id, userId }
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    return connection;
  },

  /**
   * Create a new connection
   */
  async createConnection(userId: string, connectionData: Partial<Connection>) {
    const repository = AppDataSource.getRepository(Connection);
    const deviceRepository = AppDataSource.getRepository(Device);

    // Validate source device exists
    if (connectionData.sourceDeviceId) {
      const sourceDevice = await deviceRepository.findOne({
        where: { id: connectionData.sourceDeviceId, userId, deletedAt: IsNull() }
      });

      if (!sourceDevice) {
        throw new Error('Source device not found');
      }
    }

    // Validate target device exists
    if (connectionData.targetDeviceId) {
      const targetDevice = await deviceRepository.findOne({
        where: { id: connectionData.targetDeviceId, userId, deletedAt: IsNull() }
      });

      if (!targetDevice) {
        throw new Error('Target device not found');
      }
    }

    const connection = repository.create({
      ...connectionData,
      userId
    });

    return await repository.save(connection);
  },

  /**
   * Update a connection
   */
  async updateConnection(id: string, userId: string, updates: Partial<Connection>) {
    const repository = AppDataSource.getRepository(Connection);
    const connection = await repository.findOne({
      where: { id, userId }
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    Object.assign(connection, updates);
    return await repository.save(connection);
  },

  /**
   * Delete a connection
   */
  async deleteConnection(id: string, userId: string) {
    const repository = AppDataSource.getRepository(Connection);
    const connection = await repository.findOne({
      where: { id, userId }
    });

    if (!connection) {
      throw new Error('Connection not found');
    }

    await repository.remove(connection);
    return { message: 'Connection deleted successfully' };
  }
};
