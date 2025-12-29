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

## RackSmith API

### Authentication
- `POST /api/racksmith/auth/register` - Create new user account
  ```json
  {
    "username": "string (3-20 chars)",
    "email": "string (valid email)",
    "password": "string (min 8 chars)",
    "firstName": "string (optional)",
    "lastName": "string (optional)"
  }
  ```

- `POST /api/racksmith/auth/login` - Login with email or username
  ```json
  {
    "emailOrUsername": "string",
    "password": "string"
  }
  ```
  Returns: `{ user, token }`

- `GET /api/racksmith/auth/me` - Get current user profile
  Requires: `Authorization: Bearer <token>` or `X-Dev-Mode: true` (dev only)

### User Preferences
All endpoints require authentication.

- `GET /api/users/me/preferences` - Get user preferences
- `PUT /api/users/me/preferences` - Update all preferences (full replace)
- `PATCH /api/users/me/preferences` - Partial update preferences
- `POST /api/users/me/preferences/reset` - Reset to default preferences

### Racks
All endpoints require authentication. Support pagination and search.

- `GET /api/racksmith/racks?page=1&limit=25&search=server` - List racks
- `GET /api/racksmith/racks/:id` - Get single rack
- `POST /api/racksmith/racks` - Create rack
  ```json
  {
    "name": "string",
    "location": "string",
    "sizeU": number,
    "description": "string (optional)",
    "colorTag": "string (hex color, optional)"
  }
  ```
- `PUT /api/racksmith/racks/:id` - Update rack
- `DELETE /api/racksmith/racks/:id` - Delete rack (soft delete, prevents if has devices)

### Devices
All endpoints require authentication. Support pagination and filtering.

- `GET /api/racksmith/devices?rackId=uuid&type=server&manufacturer=Dell&search=web&page=1&limit=25` - List devices
- `GET /api/racksmith/devices/:id` - Get single device
- `POST /api/racksmith/devices` - Create device
  ```json
  {
    "rackId": "uuid (optional)",
    "name": "string",
    "type": "string",
    "manufacturer": "string (optional)",
    "model": "string (optional)",
    "sizeU": number (optional),
    "positionU": number (optional, 1-42)",
    "portCount": number,
    "powerWatts": number (optional)",
    "notes": "string (optional)"
  }
  ```
- `PUT /api/racksmith/devices/:id` - Update device
- `DELETE /api/racksmith/devices/:id` - Delete device (soft delete)

### Connections
All endpoints require authentication. Support filtering by device, cable type, VLAN.

- `GET /api/racksmith/connections?deviceId=uuid&cableType=Cat6&vlan=100&page=1&limit=50` - List connections
- `GET /api/racksmith/connections/:id` - Get single connection
- `POST /api/racksmith/connections` - Create connection
  ```json
  {
    "sourceDeviceId": "uuid",
    "sourcePort": "string",
    "targetDeviceId": "uuid",
    "targetPort": "string",
    "cableType": "string",
    "cableLengthFt": number (optional),
    "vlan": "string (optional)",
    "metadata": {} (optional)
  }
  ```
- `PUT /api/racksmith/connections/:id` - Update connection
- `DELETE /api/racksmith/connections/:id` - Delete connection

### Coming Soon (Documented, Not Yet Implemented)
- **Ports**: GET/POST /api/racksmith/devices/:deviceId/ports, PUT/DELETE /api/racksmith/ports/:id
- **Network Plans**: Full CRUD at /api/racksmith/network-plans
- **Activity Logs**: GET /api/racksmith/activity-logs with pagination and filtering
- **Favorites**: Full CRUD at /api/racksmith/favorites with access tracking
- **Floor Plans**: Full CRUD at /api/racksmith/floor-plans
- **User Profile**: GET/PUT /api/racksmith/users/:userId, POST /api/racksmith/users/:userId/change-password

## Homepage API

API endpoints for the ninsys-homepage portfolio site. Uses TOTP authentication for admin operations.

### Projects
Portfolio project management.

- `GET /api/projects` - List all projects (public)
  - Query params: `?category=current|completed&featured=true`
  - Returns projects sorted by display order

- `GET /api/projects/:id` - Get single project (public)

- `POST /api/projects` - Create project (requires auth)
  ```json
  {
    "title": "string",
    "description": "string",
    "technologies": ["string"],
    "category": "current | completed",
    "image": "string (optional)",
    "githubUrl": "string (optional)",
    "liveUrl": "string (optional)",
    "date": "YYYY-MM",
    "featured": boolean (optional),
    "order": number (optional)
  }
  ```

- `PUT /api/projects/:id` - Update project (requires auth)

- `DELETE /api/projects/:id` - Delete project (requires auth)

- `PUT /api/projects/reorder` - Reorder projects (requires auth)
  ```json
  {
    "projectIds": ["uuid", "uuid", "uuid"]
  }
  ```

### About Page
About page content management.

- `GET /api/about` - Get about page data (public)
  ```json
  {
    "success": true,
    "data": {
      "profile": {
        "name": "string",
        "tagline": "string",
        "location": "string",
        "bio": ["string"],
        "avatarUrl": "string (optional)",
        "social": {
          "github": "string (optional)",
          "linkedin": "string (optional)",
          "email": "string (optional)"
        }
      },
      "sections": [
        {
          "id": "uuid",
          "type": "skills | interests | experience | education | custom",
          "title": "string",
          "icon": "string (Lucide icon name, optional)",
          "order": number,
          "size": "small | medium | large",
          "content": { ... }
        }
      ]
    }
  }
  ```

- `PUT /api/about` - Update about page data (requires auth)
  ```json
  {
    "profile": { ... },
    "sections": [ ... ]
  }
  ```

- `PUT /api/about/sections` - Reorder sections (requires auth)
  ```json
  {
    "sections": [
      { "id": "uuid", "order": 0 },
      { "id": "uuid", "order": 1 }
    ]
  }
  ```

- `POST /api/about/sections` - Add new section (requires auth)

- `PUT /api/about/sections/:sectionId` - Update section (requires auth)

- `DELETE /api/about/sections/:sectionId` - Delete section (requires auth)

### GitHub Integration
Fetch repos and import as projects. Requires `GITHUB_PAT` environment variable.

- `GET /api/github/repos` - Fetch repos from GitHub (public, uses server PAT)
  - Query params: `?per_page=30&sort=updated|pushed|full_name&direction=asc|desc`
  - Returns: repos with caching info

- `GET /api/github/repos/:owner/:repo` - Get specific repo (public)

- `POST /api/github/import/:repoName` - Import repo as project (requires auth)
  - Creates new project from GitHub repo data
  - Returns: created project

- `POST /api/github/cache/clear` - Clear GitHub cache (requires auth)