# NinSys-API v1.5.0
- **RackSmith API Expansion**:
  - **New Entities**:
    - Port entity - Separate table for device network ports (deviceId, portNumber, portType, status, vlan, speed)
    - ActivityLog entity - User action tracking with filtering and pagination
    - Favorite entity - Bookmarking system with pinning, categories, tags, access tracking
    - FloorPlan entity - Data center floor plan storage with device positions
  - **New API Endpoints**:
    - Devices CRUD: GET/POST /api/racksmith/devices, GET/PUT/DELETE /api/racksmith/devices/:id
    - Connections CRUD: GET/POST /api/racksmith/connections, GET/PUT/DELETE /api/racksmith/connections/:id
    - Full pagination and filtering support for all endpoints
    - Soft delete support for devices
    - Position validation for rack-mounted devices
  - **Database Enhancements**:
    - Updated Device entity with portsList relationship to Port entity
    - Updated User entity with new relationships: activityLogs, favorites, floorPlans
    - Added database indexes for performance (userId+createdAt, entityType+entityId, action)
    - Registered all 10 entities in TypeORM
  - **Frontend Integration Ready**:
    - Created comprehensive frontend integration guide (FRONTEND_INTEGRATION_v0.5.0.md)
    - Documented all API contracts with request/response examples
    - Provided React Query examples and best practices
    - Migration strategy from localStorage to backend
    - Complete error handling documentation
  - **Documentation**:
    - Created GitHub Copilot instructions file (.github/copilot-instructions.md)
    - Comprehensive project overview with all endpoints, entities, and conventions
    - Common issues and solutions, testing setup, deployment checklist
  - **Placeholders for Future Phases**:
    - Ports CRUD routes (documented, not yet implemented)
    - Network Plans CRUD (documented, not yet implemented)
    - Activity Logs system with auto-tracking (documented, not yet implemented)
    - Favorites system (documented, not yet implemented)
    - Floor Plans storage (documented, not yet implemented)
    - User Profile endpoints (documented, not yet implemented)

# NinSys-API v1.4.3
- **Bug Fixes & Developer Experience**:
  - Fixed TypeORM circular dependency error between User and related entities
  - Changed entity relationships from arrow functions to string-based lazy loading
  - Improved Cogworks bot health check behavior in dev mode:
    - Only shows warnings for first 3 connection failures, then goes silent
    - Added `DISABLE_COGWORKS_HEALTH_CHECK` environment variable to completely disable monitoring
    - Reduces console noise when developing without Cogworks bot running
  - Updated test imports to match new directory structure

# NinSys-API v1.4.2
- **Codebase Organization Overhaul**:
  - Reorganized directory structure for better scalability and multi-project support
  - Created project-specific subdirectories: `cogworks/`, `racksmith/`, and `shared/`
  - Applied to all major directories:
    - `routes/` - Separated route handlers by project
    - `services/` - Separated business logic by project
    - `middleware/` - Separated middleware by project
    - `types/` - Separated type definitions by project
  - Updated all import paths to reflect new structure
  - Maintained backward compatibility - no breaking API changes
  - Improved code discoverability and maintainability
  - Prepared for future project integrations

# NinSys-API v1.4.1
- **Development Experience Enhancement**:
  - Added dev mode authentication bypass for RackSmith routes
  - Frontend can bypass JWT authentication in development by sending `X-Dev-Mode: true` header
  - Mock dev user automatically injected when `NODE_ENV=dev` and dev mode header present
  - Updated TypeScript interfaces to match new User entity schema (username, firstName, lastName, role)
  - Created comprehensive frontend handoff document (`private/FRONTEND_HANDOFF.md`)
  - Documented all API endpoints, authentication flows, and development tips
  - Includes ready-to-use Axios client setup example

# NinSys-API v1.4.0
- **RackSmith API Foundation - Phase 1 Complete**:
  - Reorganized TypeORM structure into dedicated `src/typeorm/` directory
  - Created comprehensive entity models for RackSmith infrastructure management:
    - Enhanced User entity with username, firstName, lastName, role, lastLogin, isActive
    - Created UserPreferences entity with theme, defaults, view, and notification settings
    - Updated Rack entity with description, colorTag, and soft delete support
    - Updated Device entity with deviceType, portCount, powerWatts, notes, metadata, soft delete
    - Updated Connection entity with cableType, cableLengthFt, vlan, metadata
    - Updated NetworkPlan entity with planType and notes
  - Implemented comprehensive authentication system:
    - User registration with username, email, firstName, lastName
    - Login support with email OR username
    - Password hashing with bcrypt (12 rounds)
    - JWT token generation and verification
    - Account active status checking
    - Last login timestamp tracking
  - Created user preferences management:
    - GET /api/users/me/preferences - Get user preferences
    - PUT /api/users/me/preferences - Update all preferences
    - PATCH /api/users/me/preferences - Partial update
    - POST /api/users/me/preferences/reset - Reset to defaults
  - Environment updates:
    - Updated database env vars to match Cogworks (MYSQL_DB_*)
    - Added database connection validation
    - Support for dev/prod NODE_ENV values
  - Created comprehensive implementation plan for future phases
  - All changes compile successfully with TypeScript

# NinSys-API v1.3.1
- Updated deploy script for migration.

# NinSys-API v1.3.0
- **Major Cogworks Bot Integration Update**:
  - Updated bot registration and stats endpoints to match new bot payload structure
  - Added automatic health monitoring (polls bot health endpoints every 30 seconds)
  - Implemented bearer token authentication for bot endpoints
  - Added offline detection (marks bot offline after 10 minutes without updates)
  - Implemented status caching (30-second TTL for public status endpoint)
  - Added new public status endpoint with comprehensive health information
  - Maintained backward compatibility with legacy endpoints
- Updated TypeScript types for new bot integration
- Added comprehensive documentation for bot integration in README and ENDPOINTS.md

# NinSys-API v1.2.0
- Added authentication middleware and routes.
- Removed API key validator logic (replaced with auth middleware).
- Fixed a few small GitHub workflow bug.

# NinSys-API v1.1.5
- Added support for more Govee devices.
- Fixed small spelling error for Cogworks Health endpoint.

# NinSys-API v1.1.4
- Added API key validation for Nindroid Systems Terminal.

# NinSys-API v1.1.3
- Added GitHub workflow to deploy to homelab.
- And fixed small deploy bugs.

# NinSys-API v1.1.2
- Updated package json scripts -- using npm for production.
- Update pm2 config to use npm.
- Converted pm2 config to ES module.

# NinSys-API v1.1.1
- Fixed inconsistent group namings for devices (I just forgor to change them lol).
- Fixed actual Govee API handling.

# v1.1.0
First production-ready api.
- Added all the JSDoc comments ;-; (I did get some AI help with formatting so it wasn't that bad lol).

# v1.0.0
Initial setup.