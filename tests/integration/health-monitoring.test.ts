/**
 * Integration Tests - Health Monitoring
 * Tests the health check integration between API and bot
 */

import request from 'supertest';
import express from 'express';
import nock from 'nock';
import { createCogworksRoutes, stopHealthCheck } from '../../src/routes/cogworks/cogworks.js';
import { DiscordService } from '../../src/services/cogworks/discordService.js';

describe('Cogworks Health Monitoring - Integration Tests', () => {
  let app: express.Application;
  let discordService: DiscordService;
  const BOT_TOKEN = 'test-bot-token-12345';

  beforeAll(() => {
    process.env.COGWORKS_BOT_TOKEN = BOT_TOKEN;
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    discordService = new DiscordService(BOT_TOKEN);
    app.use('/api/cogworks', createCogworksRoutes(discordService));
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    stopHealthCheck();
  });

  describe('Health Check Cycle', () => {
    it('should poll health endpoints periodically', async () => {
      let healthCheckCount = 0;

      // Mock health endpoints with counter
      nock('http://localhost:3000')
        .get('/health/ready')
        .times(3)
        .reply(() => {
          healthCheckCount++;
          return [200, {
            ready: true,
            uptime: 100,
            timestamp: new Date().toISOString()
          }];
        });

      nock('http://localhost:3000')
        .get('/health/live')
        .times(3)
        .reply(200, {
          alive: true,
          uptime: 100,
          timestamp: new Date().toISOString()
        });

      // Wait for health checks to run
      await new Promise(resolve => setTimeout(resolve, 3500));

      // Should have run at least once
      expect(healthCheckCount).toBeGreaterThan(0);
    });

    it('should update health status based on bot response', async () => {
      // Mock healthy bot
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

      // Wait for health check
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app)
        .get('/api/cogworks/status');

      expect(response.body.healthStatus.ready).toBe(true);
      expect(response.body.healthStatus.alive).toBe(true);
    });

    it('should mark unhealthy when bot not ready', async () => {
      // Mock unhealthy bot
      nock('http://localhost:3000')
        .get('/health/ready')
        .reply(503, {
          ready: false,
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

      // Wait for health check
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app)
        .get('/api/cogworks/status');

      expect(response.body.healthStatus.ready).toBe(false);
      expect(response.body.healthStatus.alive).toBe(true);
    });
  });

  describe('Offline Detection', () => {
    it('should mark bot online after recent stats update', async () => {
      // Mock health endpoints
      nock('http://localhost:3000')
        .get('/health/ready')
        .reply(200, { ready: true, uptime: 100, timestamp: new Date().toISOString() })
        .persist();

      nock('http://localhost:3000')
        .get('/health/live')
        .reply(200, { alive: true, uptime: 100, timestamp: new Date().toISOString() })
        .persist();

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

      expect(response.body.online).toBe(true);
    });

    it('should show correct last update time', async () => {
      const beforeTime = new Date();

      nock('http://localhost:3000')
        .get('/health/ready')
        .reply(200, { ready: true, uptime: 100, timestamp: new Date().toISOString() })
        .persist();

      nock('http://localhost:3000')
        .get('/health/live')
        .reply(200, { alive: true, uptime: 100, timestamp: new Date().toISOString() })
        .persist();

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

      const afterTime = new Date();

      const response = await request(app)
        .get('/api/cogworks/status');

      const lastUpdate = new Date(response.body.lastUpdate);
      expect(lastUpdate.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(lastUpdate.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('Complete Registration Flow', () => {
    it('should handle full registration and update cycle', async () => {
      // Mock health endpoints
      nock('http://localhost:3000')
        .get('/health/ready')
        .reply(200, { ready: true, uptime: 100, timestamp: new Date().toISOString() })
        .persist();

      nock('http://localhost:3000')
        .get('/health/live')
        .reply(200, { alive: true, uptime: 100, timestamp: new Date().toISOString() })
        .persist();

      // 1. Register
      const registerResponse = await request(app)
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

      expect(registerResponse.status).toBe(200);

      // 2. Check status
      const status1 = await request(app).get('/api/cogworks/status');
      expect(status1.body.guilds).toBe(5);

      // 3. Update stats
      const updateResponse = await request(app)
        .put('/api/cogworks/stats')
        .set('Authorization', `Bearer ${BOT_TOKEN}`)
        .send({
          botId: '123456789',
          username: 'TestBot',
          guilds: 7,
          users: 200,
          uptime: 300,
          memoryUsage: 55000000,
          version: '2.0.0',
          environment: 'development'
        });

      expect(updateResponse.status).toBe(200);

      // 4. Verify updated stats
      const status2 = await request(app).get('/api/cogworks/status');
      expect(status2.body.guilds).toBe(7);
      expect(status2.body.users).toBe(200);
    });
  });
});
