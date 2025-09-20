# 📡 API Endpoints

## System Health
- `GET /health` - Overall system health check
- `GET /health/cogworks-bot` - Cogworks Bot health status

## Cogworks Bot
- `GET /api/cogworks/stats` - Comprehensive bot statistics
- `GET /api/cogworks/info` - Bot profile information
- `GET /api/cogworks/status` - Current bot status
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