/**
 * @fileoverview TypeORM Database Configuration
 * @description Database connection setup for RackSmith entities
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User.js';
import { Rack } from './entities/Rack.js';
import { Device } from './entities/Device.js';
import { Connection } from './entities/Connection.js';
import { NetworkPlan } from './entities/NetworkPlan.js';
import { UserPreferences } from './entities/UserPreferences.js';
import { Port } from './entities/Port.js';
import { ActivityLog } from './entities/ActivityLog.js';
import { Favorite } from './entities/Favorite.js';
import { FloorPlan } from './entities/FloorPlan.js';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_DB_HOST,
  port: parseInt(process.env.MYSQL_DB_PORT!),
  username: process.env.MYSQL_DB_USERNAME,
  password: process.env.MYSQL_DB_PASSWORD,
  database: process.env.MYSQL_DB_DATABASE,
  synchronize: false, // Don't auto-create schema in production
  logging: process.env.NODE_ENV === 'dev',
  entities: [User, Rack, Device, Connection, NetworkPlan, UserPreferences, Port, ActivityLog, Favorite, FloorPlan],
  migrations: ['src/typeorm/migrations/**/*.ts'],
  subscribers: [],
});

/**
 * Initialize database connection
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection initialized');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

/**
 * Close database connection
 */
export const closeDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed');
    }
  } catch (error) {
    console.error('Error closing database:', error);
    throw error;
  }
};
