/**
 * Unit Tests - Cogworks Routes
 * Tests individual route handlers and helper functions
 */

import request from 'supertest';
import express from 'express';
import nock from 'nock';
import { createCogworksRoutes, stopHealthCheck } from '../../src/routes/cogworks/cogworks.js';
import { DiscordService } from '../../src/services/cogworks/discordService.js';

describe('Cogworks Routes - Unit Tests', () => {
  let app: express.Application;
  let discordService: DiscordService;
  const BOT_TOKEN = 'test-bot-token-12345';

  beforeAll(() => {
    process.env.COGWORKS_BOT_TOKEN = BOT_TOKEN;
  });

  beforeEach(() => {
    // Create fresh Express app for each test
    app = express();
    app.use(express.json());
    
    // Create Discord service
    discordService = new DiscordService(BOT_TOKEN);
    
    // Mount routes
    app.use('/api/cogworks', createCogworksRoutes(discordService));

    // Mock bot health endpoints
    nock('http://localhost:3000')
      .get('/health/ready')
      .reply(200, {
        ready: true,
        uptime: 100,
        timestamp: new Date().toISOString()
      })
      .persist();

    nock('http://localhost:3000')
      .get('/health/live')
      .reply(200, {
        alive: true,
        uptime: 100,
        timestamp: new Date().toISOString()
      })
      .persist();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    stopHealthCheck();
  });

  describe('POST /api/cogworks/register', () => {
    const validPayload = {
      botId: '123456789',
      username: 'TestBot',
      guilds: 5,
      users: 100,
      uptime: 10,
      memoryUsage: 50000000,
      version: '2.0.0',
      environment: 'development' as const
    };

    it('should register bot successfully with valid token and payload', async () => {
      const response = await request(app)
        .post('/api/cogworks/register')
        .set('Authorization', `Bearer ${BOT_TOKEN}`)
        .send(validPayload);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Bot registered successfully'
      });
      expect(response.body.timestamp).toBeDefined();
    });

    it('should reject registration without authorization header', async () => {
      const response = await request(app)
        .post('/api/cogworks/register')
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Unauthorized: Invalid bot token'
      });
    });

    it('should reject registration with invalid token', async () => {
      const response = await request(app)
        .post('/api/cogworks/register')
        .set('Authorization', 'Bearer wrong-token')
        .send(validPayload);

      expect(response.status).toBe(401);
    });

    it('should reject registration with missing required fields', async () => {
      const invalidPayload = {
        username: 'TestBot',
        guilds: 5
        // missing botId and other fields
      };

      const response = await request(app)
        .post('/api/cogworks/register')
        .set('Authorization', `Bearer ${BOT_TOKEN}`)
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid registration payload');
    });

    it('should accept production environment', async () => {
      const prodPayload = {
        ...validPayload,
        environment: 'production' as const
      };

      const response = await request(app)
        .post('/api/cogworks/register')
        .set('Authorization', `Bearer ${BOT_TOKEN}`)
        .send(prodPayload);

      expect(response.status).toBe(200);
    });
  });

  describe('PUT /api/cogworks/stats', () => {
    const validStatsPayload = {
      botId: '123456789',
      username: 'TestBot',
      guilds: 6,
      users: 150,
      uptime: 300,
      memoryUsage: 55000000,
      version: '2.0.0',
      environment: 'development' as const
    };

    beforeEach(async () => {
      // Register bot first
      await request(app)
        .post('/api/cogworks/register')
        .set('Authorization', `Bearer ${BOT_TOKEN}`)
        .send({
          botId: '123456789',
          username: 'TestBot',
          guilds: 5,
          users: 100,
          uptime: 10,
          memoryUsage: 50000000,
          version: '2.0.0',
          environment: 'development'
        });
    });

    it('should update stats successfully with valid token', async () => {
      const response = await request(app)
        .put('/api/cogworks/stats')
        .set('Authorization', `Bearer ${BOT_TOKEN}`)
        .send(validStatsPayload);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Stats updated successfully'
      });
    });

    it('should reject stats update without authorization', async () => {
      const response = await request(app)
        .put('/api/cogworks/stats')
        .send(validStatsPayload);

      expect(response.status).toBe(401);
    });

    it('should reject stats update with invalid payload', async () => {
      const response = await request(app)
        .put('/api/cogworks/stats')
        .set('Authorization', `Bearer ${BOT_TOKEN}`)
        .send({ username: 'TestBot' }); // missing required fields

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/cogworks/status', () => {
    it('should return status without authentication', async () => {
      const response = await request(app)
        .get('/api/cogworks/status');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('online');
      expect(response.body).toHaveProperty('ready');
      expect(response.body).toHaveProperty('guilds');
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memoryUsageMB');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('lastUpdate');
      expect(response.body).toHaveProperty('healthStatus');
    });

    it('should show offline when no bot data', async () => {
      const response = await request(app)
        .get('/api/cogworks/status');

      expect(response.status).toBe(200);
      expect(response.body.online).toBe(false);
    });

    it('should show online after registration', async () => {
      // Register bot
      await request(app)
        .post('/api/cogworks/register')
        .set('Authorization', `Bearer ${BOT_TOKEN}`)
        .send({
          botId: '123456789',
          username: 'TestBot',
          guilds: 5,
          users: 100,
          uptime: 10,
          memoryUsage: 50000000,
          version: '2.0.0',
          environment: 'development'
        });

      const response = await request(app)
        .get('/api/cogworks/status');

      expect(response.status).toBe(200);
      expect(response.body.online).toBe(true);
      expect(response.body.guilds).toBe(5);
      expect(response.body.users).toBe(100);
    });

    it('should cache status response', async () => {
      // First request
      const response1 = await request(app)
        .get('/api/cogworks/status');

      // Second request immediately after
      const response2 = await request(app)
        .get('/api/cogworks/status');

      expect(response1.body).toEqual(response2.body);
    });

    it('should convert memory usage to MB', async () => {
      await request(app)
        .post('/api/cogworks/register')
        .set('Authorization', `Bearer ${BOT_TOKEN}`)
        .send({
          botId: '123456789',
          username: 'TestBot',
          guilds: 5,
          users: 100,
          uptime: 10,
          memoryUsage: 52428800, // 50 MB in bytes
          version: '2.0.0',
          environment: 'development'
        });

      const response = await request(app)
        .get('/api/cogworks/status');

      expect(response.body.memoryUsageMB).toBeCloseTo(50, 1);
    });
  });

  describe('POST /api/cogworks/command-log', () => {
    it('should log command with valid token', async () => {
      const response = await request(app)
        .post('/api/cogworks/command-log')
        .set('Authorization', `Bearer ${BOT_TOKEN}`)
        .send({
          command: 'test',
          guildId: '123',
          userId: '456',
          timestamp: new Date().toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject command log without authorization', async () => {
      const response = await request(app)
        .post('/api/cogworks/command-log')
        .send({
          command: 'test',
          guildId: '123',
          userId: '456',
          timestamp: new Date().toISOString()
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/cogworks/disconnect', () => {
    beforeEach(async () => {
      // Register bot first
      await request(app)
        .post('/api/cogworks/register')
        .set('Authorization', `Bearer ${BOT_TOKEN}`)
        .send({
          botId: '123456789',
          username: 'TestBot',
          guilds: 5,
          users: 100,
          uptime: 10,
          memoryUsage: 50000000,
          version: '2.0.0',
          environment: 'development'
        });
    });

    it('should handle disconnect with valid token', async () => {
      const response = await request(app)
        .post('/api/cogworks/disconnect')
        .set('Authorization', `Bearer ${BOT_TOKEN}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject disconnect without authorization', async () => {
      const response = await request(app)
        .post('/api/cogworks/disconnect')
        .send({});

      expect(response.status).toBe(401);
    });

    it('should update health status on disconnect', async () => {
      await request(app)
        .post('/api/cogworks/disconnect')
        .set('Authorization', `Bearer ${BOT_TOKEN}`)
        .send({});

      const statusResponse = await request(app)
        .get('/api/cogworks/status');

      expect(statusResponse.body.healthStatus.ready).toBe(false);
      expect(statusResponse.body.healthStatus.alive).toBe(false);
    });
  });

  describe('Health Check Integration', () => {
    it('should handle successful health checks', async () => {
      // Wait for health check to run
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .get('/api/cogworks/status');

      expect(response.body.healthStatus.lastCheck).toBeDefined();
    });

    it('should handle failed health checks gracefully', async () => {
      // Clear existing mocks
      nock.cleanAll();

      // Mock failed health check
      nock('http://localhost:3000')
        .get('/health/ready')
        .replyWithError('Connection refused')
        .persist();

      nock('http://localhost:3000')
        .get('/health/live')
        .replyWithError('Connection refused')
        .persist();

      // Wait for health check to run
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .get('/api/cogworks/status');

      expect(response.body.healthStatus.ready).toBe(false);
      expect(response.body.healthStatus.alive).toBe(false);
    });
  });

  describe('Legacy Endpoints', () => {
    it('should support GET /api/cogworks/stats (legacy)', async () => {
      const response = await request(app)
        .get('/api/cogworks/stats');

      expect(response.status).toBe(200);
    });

    it('should support GET /api/cogworks/info (legacy)', async () => {
      const response = await request(app)
        .get('/api/cogworks/info');

      expect(response.status).toBe(200);
    });

    it('should support GET /api/cogworks/ping (legacy)', async () => {
      const response = await request(app)
        .get('/api/cogworks/ping');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('pong');
    });

    it('should support GET /api/cogworks/uptime (legacy)', async () => {
      const response = await request(app)
        .get('/api/cogworks/uptime');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('formatted');
    });
  });
});
