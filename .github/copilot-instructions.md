# GitHub Copilot Instructions - NinSys API

> **Last Updated**: December 2025
> **Version**: 1.7.3
> **Purpose**: Complete project context for AI assistance

---

## Project Overview

**NinSys API** is a multi-project REST API serving multiple applications:
- **Cogworks Bot** - Discord bot statistics and monitoring
- **RackSmith** - Network infrastructure management platform (still in development)
- **Govee Smart Lights** - IoT device control
- **Homepage** - Portfolio projects and about page management (v1.7.0+)
- **Shared Authentication** - TOTP-based API authentication

**Tech Stack**:
- Runtime: Bun (dev) / Node.js 20 (prod)
- Framework: Express.js 5.1.0
- Language: TypeScript
- Database: MySQL with TypeORM 0.3.27
- Auth: JWT + bcrypt + TOTP
- Deployment: Docker containers

**Current Version**: 1.7.3
**API Port**: 3001
**License**: MIT

---

## Directory Structure

The codebase is organized by project:

```
src/
├── routes/
│   ├── cogworks/          # Cogworks Bot endpoints
│   │   └── cogworks.ts
│   ├── racksmith/         # RackSmith app endpoints
│   │   ├── auth.ts
│   │   ├── racks.ts
│   │   ├── devices.ts
│   │   ├── connections.ts
│   │   └── preferences.ts
│   ├── homepage/          # Homepage API endpoints (v1.7.0+)
│   │   ├── projects.ts
│   │   ├── about.ts
│   │   └── github.ts
│   └── shared/            # Cross-project routes
│       ├── auth.ts        # TOTP authentication
│       ├── govee.ts       # Govee lights
│       └── health.ts      # Health checks
│
├── services/
│   ├── cogworks/          # Cogworks business logic
│   │   └── discordService.ts
│   ├── racksmith/         # RackSmith business logic
│   │   ├── authService.ts
│   │   ├── devicesService.ts
│   │   ├── connectionsService.ts
│   │   └── preferencesService.ts
│   ├── homepage/          # Homepage business logic (v1.7.0+)
│   │   ├── projectsService.ts
│   │   ├── aboutService.ts
│   │   └── githubService.ts
│   └── shared/            # Shared services
│       ├── authService.ts
│       └── goveeService.ts
│
├── middleware/
│   ├── racksmith/
│   │   └── authHandler.ts # JWT middleware
│   └── shared/
│       ├── authHandler.ts # TOTP middleware
│       ├── errorHandler.ts
│       └── rateLimiter.ts # Disabled in dev mode (v1.7.2+)
│
├── types/
│   ├── cogworks/
│   │   └── cogworks.ts
│   └── shared/
│       ├── api.ts
│       ├── auth.ts
│       └── govee.ts
│
├── typeorm/
│   ├── index.ts           # Database connection
│   └── entities/          # TypeORM entities (12 total)
│       ├── User.ts
│       ├── UserPreferences.ts
│       ├── Rack.ts
│       ├── Device.ts
│       ├── Connection.ts
│       ├── Port.ts
│       ├── NetworkPlan.ts
│       ├── ActivityLog.ts
│       ├── Favorite.ts
│       ├── FloorPlan.ts
│       ├── Project.ts         # Homepage (v1.7.0+)
│       └── AboutContent.ts    # Homepage (v1.7.0+)
│
├── config/                # Configuration files
│   └── govee.ts
│
├── utils/                 # Utilities
│   └── logger.ts
│
└── server.ts              # Express app entry point
```

---

## GitHub Workflows

Three workflows are configured in `.github/workflows/`:

### 1. `dev.yml` - CI Pipeline
**Triggers**: Push to `dev`, PRs to `main` or `dev`
**Jobs**:
- TypeScript type checking
- Run tests with coverage
- Upload coverage to Codecov
- Build Docker image (verification only, not deployed)

### 2. `deploy.yml` - Production Deployment
**Triggers**: Push to `main`, manual dispatch
**Jobs**:
- Build Docker image
- Transfer to server via SCP
- Deploy via SSH with docker-compose
- Health check verification

### 3. `auto-pr.yml` - Auto Draft PR (v1.7.3+)
**Triggers**: Push to `dev`
**Jobs**:
- Check if open PR exists for `dev → main`
- Create draft PR if none exists (title: `v{VERSION}: {Commit Message}`)
- PR body includes commit history
- Mark as "Ready for review" to trigger Copilot review

### Copilot Auto-Review Setup
To enable Copilot auto-review on PRs (manual setup required):
1. Go to repo **Settings → Rules → Rulesets**
2. Create new ruleset targeting `main` branch
3. Enable:
   - "Automatically request Copilot code review"
   - "Review draft pull requests"
   - "Review new pushes"

---

## Database Schema (TypeORM)

### Connection Info
- **Host**: `MYSQL_DB_HOST` (localhost for dev, `172.17.0.1` or host network for Docker)
- **Port**: `MYSQL_DB_PORT` (3306)
- **Database**: `MYSQL_DB_DATABASE`

### Important: String-Based Relations
All entities use **string-based lazy loading** to avoid circular dependencies:

```typescript
// ✅ Correct
@ManyToOne('User', 'devices')
@OneToMany('Device', 'user')

// ❌ Avoid (causes circular dependency errors)
@ManyToOne(() => User, user => user.devices)
```

### Important: JSON Column Defaults
MySQL < 8.0.13 doesn't support JSON column defaults. Handle defaults in the service layer:

```typescript
// ❌ Don't do this in entities
@Column({ type: 'json', default: { key: 'value' } })

// ✅ Do this - no default in entity, handle in service
@Column({ type: 'json' })
```

### Entities (12 total)

**User** (`users` table):
- id, email, username, password_hash, firstName, lastName, role
- lastLogin, isActive

**UserPreferences** (`user_preferences` table):
- userId, theme (JSON), defaults (JSON), view (JSON), notifications (JSON)

**Rack** (`racks` table):
- id, userId, name, location, sizeU, description, colorTag
- Soft delete support

**Device** (`devices` table):
- id, userId, rackId, name, type, manufacturer, model, sizeU, positionU
- ports (JSON), metadata (JSON)
- Soft delete support

**Connection** (`connections` table):
- id, userId, sourceDeviceId, sourcePort, targetDeviceId, targetPort
- cableType, cableLengthFt, vlan, metadata (JSON)

**Project** (`projects` table) - v1.7.0+:
- id, title, description, technologies (JSON), category, image
- githubUrl, liveUrl, date, featured, order

**AboutContent** (`about_content` table) - v1.7.0+:
- id, key (unique), profile (JSON), sections (JSON)

---

## Authentication Systems

### 1. TOTP Authentication (Shared/Global)
**Used by**: Govee, Homepage, Cogworks (legacy)
**Middleware**: `requireAuth` from `middleware/shared/authHandler.ts`

**Flow**:
1. POST `/api/auth/login` with TOTP code
2. Receive JWT token (24h expiry)
3. Include: `Authorization: Bearer <token>`

### 2. RackSmith Authentication (JWT)
**Used by**: RackSmith routes
**Middleware**: `requireRackSmithAuth` from `middleware/racksmith/authHandler.ts`

**Dev Mode Bypass**:
- Set `NODE_ENV=dev`
- Include header: `X-Dev-Mode: true`
- Mock user automatically injected

---

## API Endpoints

### Health & System
- `GET /health` - Overall health status
- `GET /` - API info

### Shared Auth (TOTP)
- `POST /api/auth/login` - TOTP login
- `GET /api/auth/status` - Check auth status
- `POST /api/auth/logout` - Logout

### Homepage API (v1.7.0+)

**Projects** (public read, TOTP auth for write):
- `GET /api/projects` - List projects (filter: ?category=, ?featured=)
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project (auth required)
- `PUT /api/projects/:id` - Update project (auth required)
- `DELETE /api/projects/:id` - Delete project (auth required)
- `PUT /api/projects/reorder` - Bulk reorder (auth required)

**About** (public read, TOTP auth for write):
- `GET /api/about` - Get about content
- `PUT /api/about` - Update about content (auth required)
- `POST /api/about/sections` - Add section (auth required)
- `PUT /api/about/sections/:id` - Update section (auth required)
- `DELETE /api/about/sections/:id` - Delete section (auth required)

**GitHub Integration**:
- `GET /api/github/repos` - List GitHub repos (requires `GITHUB_PAT` env var)
- `POST /api/github/import/:owner/:repo` - Import repo as project (auth required)

### RackSmith
- `POST /api/racksmith/auth/register` - Create account
- `POST /api/racksmith/auth/login` - Login
- `GET /api/racksmith/racks` - List racks
- `POST /api/racksmith/racks` - Create rack
- `GET /api/users/me/preferences` - Get preferences

### Cogworks Bot
- `POST /api/cogworks/register` - Bot registration
- `PUT /api/cogworks/stats` - Update stats
- `GET /api/cogworks/status` - Public status (cached 30s)

### Govee Lights
- `GET /api/govee/devices` - List devices
- `PUT /api/govee/control` - Control device

---

## Environment Variables

### Required
```bash
NODE_ENV=dev              # dev | prod
PORT=3001
JWT_SECRET=               # JWT signing key
TOTP_SECRET=              # TOTP secret

# Database
MYSQL_DB_HOST=localhost
MYSQL_DB_PORT=3306
MYSQL_DB_USERNAME=
MYSQL_DB_PASSWORD=
MYSQL_DB_DATABASE=ninsys_api

# External APIs
GOVEE_API_KEY=
COGWORKS_BOT_TOKEN=
ALLOWED_ORIGINS=http://localhost:5173
```

### Optional
```bash
GITHUB_PAT=                           # GitHub Personal Access Token (for /api/github endpoints)
DISABLE_COGWORKS_HEALTH_CHECK=true    # Disable bot health monitoring
```

---

## Development

### Commands
```bash
npm run dev        # Bun dev server (--watch)
npm run build      # TypeScript compile
npm run typecheck  # Type check only
npm test           # Run tests
```

### Rate Limiting (v1.7.2+)
Rate limiting is **disabled in dev mode** (`NODE_ENV=dev`).
Production limits:
- General: 100 requests/15min
- Govee control: 10 requests/min
- Auth: 5 requests/15min

### Adding a New Route
1. Create file in `routes/<project>/`
2. Create route factory:
```typescript
export const createMyRoutes = (): Router => {
  const router = Router();
  return router;
};
```
3. Mount in `server.ts`

---

## Docker Deployment

### Production Setup
- **Image**: `ninsys-api:latest` (Node 20 Alpine, ~180MB)
- **Server compose**: `/opt/docker/docker-compose.yml`
- **Network**: `network_mode: host` (for MySQL access)
- **Health check**: Uses `wget` (not curl - not in Alpine)

```yaml
ninsys-api:
  image: ninsys-api:latest
  network_mode: host
  env_file:
    - .env
  healthcheck:
    test: ["CMD", "wget", "--spider", "-q", "http://localhost:3001/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

---

## Common Issues

### "Cannot access 'User' before initialization"
Use string-based TypeORM relationships instead of arrow functions.

### JSON column default error
MySQL doesn't support JSON defaults. Handle in service layer.

### CORS errors
Add origin to `ALLOWED_ORIGINS` env var.

### Rate limit in dev
Ensure `NODE_ENV=dev` is set (v1.7.2+ disables rate limiting in dev).

### Docker can't connect to MySQL
Use `network_mode: host` or `MYSQL_DB_HOST=172.17.0.1` (Docker bridge).

---

## Version History

- **v1.7.3** (Dec 2025) - Auto-draft PR workflow, MIT license, copilot instructions tracked
- **v1.7.2** (Dec 2025) - Dev mode rate limiting bypass, about route validation
- **v1.7.1** (Dec 2025) - Fix JSON column defaults for MySQL
- **v1.7.0** (Dec 2025) - Homepage API (Projects, About, GitHub)
- **v1.6.0** (Dec 2025) - Docker migration, CI/CD, test expansion
- **v1.5.0** (Nov 2025) - RackSmith API expansion
- **v1.4.x** (Nov 2025) - RackSmith Phase 1, dev mode bypass

---

## Documentation

- `docs/CHANGELOG.md` - Version history
- `docs/ENDPOINTS.md` - API documentation

---

_This document is tracked in version control and should be updated with significant changes._
