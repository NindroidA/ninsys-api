# NinSys-API TODO

> Project tracking for upcoming features and technical debt

---

## In Progress

- [ ] Test suite expansion (RackSmith services, middleware, integration tests)
- [ ] Docker deployment validation on server

---

## Planned (v1.7.0)

### RackSmith Phase 2
- [ ] Ports CRUD routes and service
- [ ] Network Plans CRUD routes and service
- [ ] Activity Logs with auto-tracking middleware
- [ ] Favorites/bookmarks system
- [ ] Floor Plans storage and retrieval

### API Enhancements
- [ ] Per-user rate limiting (based on JWT)
- [ ] API tokens for service accounts
- [ ] Request validation library (zod or joi)

---

## Planned (v1.8.0+)

### Features
- [ ] Search functionality across entities
- [ ] Export functionality (JSON, CSV)
- [ ] Template system for devices/racks
- [ ] Bulk operations (import/create multiple)

### Infrastructure
- [ ] WebSocket support for real-time updates
- [ ] Redis caching layer
- [ ] Backup/restore functionality
- [ ] OpenAPI/Swagger documentation

---

## Technical Debt

### High Priority
- [ ] Add database migrations (TypeORM CLI)
- [ ] Input validation on all routes
- [ ] Improve error messages consistency

### Medium Priority
- [ ] Add request logging middleware
- [ ] Structured logging (winston or pino)
- [ ] Add response compression

### Low Priority
- [ ] Performance benchmarking
- [ ] Load testing setup
- [ ] API versioning strategy

---

## Completed (v1.6.0)

- [x] Docker containerization
- [x] Multi-stage Dockerfile
- [x] Docker Compose setup
- [x] GitHub Actions Docker deployment
- [x] Dev branch CI workflow
- [x] PM2 removal
- [x] Documentation updates (.claude/CLAUDE.md)

---

## Ideas (Backlog)

- [ ] GraphQL endpoint alongside REST
- [ ] Health dashboard UI
- [ ] Notification system (email, webhook)
- [ ] Multi-tenancy improvements
- [ ] Audit log export
- [ ] Two-factor auth for RackSmith users

---

## Notes

- Server env file location: `/opt/ninsys-api/.env`
- Docker compose on server: `/opt/docker/docker-compose.yml`
- Coverage threshold: 70% (configured in jest.config.js)
