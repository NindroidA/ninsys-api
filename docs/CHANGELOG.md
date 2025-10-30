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