# 📡 API Endpoints

## System Health
- `GET /health` - Overall system health check
- `GET /health/cogworks-bot` - Cogworks Bot health status

## Authentication
- `POST /api/auth/login` - Login with credentials and TOTP
- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/logout` - Logout and invalidate session
- `GET /api/auth/setup` - Setup 2FA (development only)

## Cogworks Bot

### Bot-to-API Endpoints (Require Authentication)
These endpoints are called by the Discord bot and require `Authorization: Bearer <COGWORKS_BOT_TOKEN>` header.

- `POST /api/cogworks/register` - Register bot on startup
  ```json
  {
    "botId": "string",
    "username": "string",
    "guilds": number,
    "users": number,
    "uptime": number,
    "memoryUsage": number,
    "version": "string",
    "environment": "production" | "development"
  }
  ```

- `PUT /api/cogworks/stats` - Update bot statistics (every 5 minutes)
  ```json
  {
    "botId": "string",
    "username": "string",
    "guilds": number,
    "users": number,
    "uptime": number,
    "memoryUsage": number,
    "version": "string",
    "environment": "production" | "development"
  }
  ```

- `POST /api/cogworks/command-log` - Log command execution
  ```json
  {
    "command": "string",
    "guildId": "string",
    "userId": "string",
    "timestamp": "string"
  }
  ```

- `POST /api/cogworks/disconnect` - Notify API of bot shutdown

### Public Status Endpoint
- `GET /api/cogworks/status` - Get current bot status (cached 30s)
  ```json
  {
    "online": boolean,
    "ready": boolean,
    "guilds": number,
    "users": number,
    "uptime": number,
    "memoryUsageMB": number,
    "version": "string",
    "lastUpdate": "ISO timestamp",
    "healthStatus": {
      "ready": boolean,
      "alive": boolean,
      "lastCheck": "ISO timestamp"
    }
  }
  ```

### Legacy Endpoints (Backward Compatibility)
- `GET /api/cogworks/stats` - Comprehensive bot statistics
- `GET /api/cogworks/info` - Bot profile information
- `GET /api/cogworks/commands` - List of registered commands
- `GET /api/cogworks/ping` - Simple connectivity test
- `GET /api/cogworks/uptime` - Formatted uptime information

## Govee Smart Lights
- `GET /api/govee/devices` - List all devices and groups
- `GET /api/govee/presets` - Available lighting presets
- `PUT /api/govee/control` - Control individual device
- `PUT /api/govee/control/group` - Control device group
- `PUT /api/govee/control/all` - Control all devices
- `PUT /api/govee/preset/:presetId` - Apply lighting preset

## Health Monitoring

The API performs the following health checks:
- **Bot Registration**: Tracks when bot registers on startup
- **Stats Updates**: Monitors stats updates every 5 minutes from bot
- **Health Checks**: Polls `http://localhost:3000/health/ready` and `/health/live` every 30 seconds
- **Offline Detection**: Marks bot offline if no stats received for 10 minutes
- **Status Caching**: Caches public status response for 30 seconds