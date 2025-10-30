/**
 * End-to-End Tests - Full API
 * Tests the complete API with all middleware and services
 */

import request from 'supertest';
import nock from 'nock';

// Mock environment before importing app
process.env.NODE_ENV = 'test';
process.env.PORT = '3999';
process.env.GOVEE_API_KEY = 'test-govee-key';
process.env.COGWORKS_BOT_TOKEN = 'test-bot-token-12345';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.TOTP_SECRET = 'test-totp-secret';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';

describe('Full API - E2E Tests', () => {
  let app: any;
  const BOT_TOKEN = 'test-bot-token-12345';

  beforeAll(async () => {
    // Mock Govee API
    nock('https://openapi.api.govee.com')
      .get('/router/api/v1/user/devices')
      .reply(200, {
        code: 200,
        message: 'Success',
        data: []
      })
      .persist();

    // Mock bot health endpoints
    nock('http://localhost:3000')
      .get('/health/ready')
      .reply(200, { ready: true, uptime: 100, timestamp: new Date().toISOString() })
      .persist();

    nock('http://localhost:3000')
      .get('/health/live')
      .reply(200, { alive: true, uptime: 100, timestamp: new Date().toISOString() })
      .persist();

    // Import app after mocks are set up
    const appModule = await import('../../src/server.js');
    app = appModule.default;
  });

  afterAll(() => {
    nock.cleanAll();
  });

  describe('Root Endpoint', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('endpoints');
    });
  });

  describe('Health Endpoints', () => {
    it('should return overall health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Cogworks Integration Flow', () => {
    it('should handle complete bot lifecycle', async () => {
      // 1. Check initial status (bot offline)
      const initialStatus = await request(app).get('/api/cogworks/status');
      expect(initialStatus.status).toBe(200);
      expect(initialStatus.body.online).toBe(false);

      // 2. Register bot
      const registerResponse = await request(app)
        .post('/api/cogworks/register')
        .set('Authorization', `Bearer ${BOT_TOKEN}`)
        .send({
          botId: '123456789',
          username: 'E2ETestBot',
          guilds: 3,
          users: 50,
          uptime: 5,
          memoryUsage: 40000000,
          version: '2.0.0',
          environment: 'development'
        });

      expect(registerResponse.status).toBe(200);
      expect(registerResponse.body.success).toBe(true);

      // 3. Check status (bot online)
      const onlineStatus = await request(app).get('/api/cogworks/status');
      expect(onlineStatus.status).toBe(200);
      expect(onlineStatus.body.online).toBe(true);
      expect(onlineStatus.body.guilds).toBe(3);
      expect(onlineStatus.body.username).toBe('E2ETestBot');

      // 4. Update stats
      const statsUpdate = await request(app)
        .put('/api/cogworks/stats')
        .set('Authorization', `Bearer ${BOT_TOKEN}`)
        .send({
          botId: '123456789',
          username: 'E2ETestBot',
          guilds: 4,
          users: 75,
          uptime: 305,
          memoryUsage: 45000000,
          version: '2.0.0',
          environment: 'development'
        });

      expect(statsUpdate.status).toBe(200);

      // 5. Verify updated stats
      const updatedStatus = await request(app).get('/api/cogworks/status');
      expect(updatedStatus.body.guilds).toBe(4);
      expect(updatedStatus.body.users).toBe(75);

      // 6. Log command
      const commandLog = await request(app)
        .post('/api/cogworks/command-log')
        .set('Authorization', `Bearer ${BOT_TOKEN}`)
        .send({
          command: 'e2e-test',
          guildId: '123',
          userId: '456',
          timestamp: new Date().toISOString()
        });

      expect(commandLog.status).toBe(200);

      // 7. Disconnect
      const disconnect = await request(app)
        .post('/api/cogworks/disconnect')
        .set('Authorization', `Bearer ${BOT_TOKEN}`)
        .send({});

      expect(disconnect.status).toBe(200);

      // 8. Verify health status updated
      const finalStatus = await request(app).get('/api/cogworks/status');
      expect(finalStatus.body.healthStatus.ready).toBe(false);
    });
  });

  describe('Security & Middleware', () => {
    it('should have security headers', async () => {
      const response = await request(app).get('/');

      // Helmet sets these headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });

    it('should handle CORS correctly', async () => {
      const response = await request(app)
        .get('/')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle 404 for unknown endpoints', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });
  });

  describe('Rate Limiting', () => {
    it('should accept requests within rate limit', async () => {
      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/api/cogworks/status');
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/cogworks/register')
        .set('Authorization', `Bearer ${BOT_TOKEN}`)
        .set('Content-Type', 'application/json')
        .send('invalid json{');

      expect(response.status).toBe(400);
    });

    it('should return proper error for unauthorized requests', async () => {
      const response = await request(app)
        .post('/api/cogworks/register')
        .send({
          botId: '123',
          username: 'Test',
          guilds: 1,
          users: 1,
          uptime: 1,
          memoryUsage: 1000,
          version: '1.0.0',
          environment: 'development'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Unauthorized');
    });
  });
});
