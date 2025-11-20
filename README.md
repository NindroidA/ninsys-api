# ninsys-api

API for Nindroid Systems projects.

## Features

- **Cogworks Bot Integration**: Health monitoring and statistics tracking for the Discord bot
- **Govee Smart Lights**: Control and automation for smart lighting
- **Authentication**: JWT + TOTP 2FA for secure access
- **Health Monitoring**: Automated health checks for connected services

## 🔒 Security Features

- **Rate Limiting**: 100 requests/15min general, 10 requests/min for device control
- **Helmet Security**: Standard security headers
- **Input Validation**: Request parameter validation
- **Error Handling**: Sanitized error responses in production
- **Bot Authentication**: Bearer token authentication for bot endpoints

## ⚙️ Cogworks Bot Integration

This API integrates with the Cogworks Discord bot for health monitoring and statistics tracking.

### Bot Requirements
- The bot must expose health endpoints on `http://localhost:3000`:
  - `GET /health` - General health check
  - `GET /health/ready` - Ready state check
  - `GET /health/live` - Liveness check

### How It Works
1. **Bot Startup**: Bot calls `POST /api/cogworks/register` with initial stats
2. **Regular Updates**: Bot calls `PUT /api/cogworks/stats` every 5 minutes
3. **Health Monitoring**: API polls bot health endpoints every 30 seconds
4. **Offline Detection**: Bot marked offline if no updates received for 10 minutes
5. **Public Status**: `GET /api/cogworks/status` provides cached status (30s TTL)

### Authentication
Bot endpoints require `Authorization: Bearer <COGWORKS_BOT_TOKEN>` header:
- `POST /api/cogworks/register`
- `PUT /api/cogworks/stats`
- `POST /api/cogworks/command-log`
- `POST /api/cogworks/disconnect`

## 📝 Documentation

See [ENDPOINTS.md](./docs/ENDPOINTS.md) for complete API documentation.