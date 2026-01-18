# Roadmap: REST API with Authentication

## Overview

**Total Duration**: ~6-8 hours  
**Phases**: 3  
**Waves**: 7  
**Complexity**: High (wave dependencies, large waves)

---

## Phase 1: Database Setup [2 waves]

**Objective**: Establish PostgreSQL database with schema and migrations

**Duration**: ~1.5 hours

### Wave 1: Database Schema & Connection [M]
**Size**: Medium (3 tasks, 45-60 min)  
**Dependencies**: None  
**Tasks**:
- Set up PostgreSQL connection with pooling
- Create database migration system
- Design users table schema
- Add connection health check

**Deliverables**:
- `src/db/connection.js` - Database connection pool
- `src/db/migrations/001_create_users.sql` - Users table migration
- `src/db/migrate.js` - Migration runner

**Success Criteria**:
- ✅ Can connect to PostgreSQL
- ✅ Migration creates users table
- ✅ Health check returns connection status
- ✅ Connection pooling configured

---

### Wave 2: Database Models & Queries [M]
**Size**: Medium (3 tasks, 45-60 min)  
**Dependencies**: Phase 1 Wave 1 complete  
**Tasks**:
- Create User model with CRUD operations
- Implement parameterized queries (prevent SQL injection)
- Add database transaction support
- Write integration tests for database operations

**Deliverables**:
- `src/models/User.js` - User model with queries
- `tests/models/User.test.js` - Database tests

**Success Criteria**:
- ✅ Can create, read, update, delete users
- ✅ All queries use parameterization
- ✅ Transactions work correctly
- ✅ Tests use test database

**Checkpoint**: "Database layer complete"

---

## Phase 2: API Endpoints [3 waves]

**Objective**: Build REST API endpoints with validation

**Duration**: ~2.5 hours

### Wave 1: User Endpoints [M]
**Size**: Medium (3 tasks, 45-60 min)  
**Dependencies**: Phase 1 complete  
**Tasks**:
- Set up Express server with middleware
- Create GET /api/users/me endpoint
- Create PUT /api/users/me endpoint
- Add request validation with Joi
- Implement error handling middleware

**Deliverables**:
- `src/app.js` - Express app setup
- `src/routes/users.js` - User routes
- `src/middleware/validate.js` - Validation middleware
- `src/middleware/errorHandler.js` - Error handling

**Success Criteria**:
- ✅ Server starts on port 3000
- ✅ User endpoints respond correctly
- ✅ Validation rejects invalid input
- ✅ Errors return proper HTTP codes

---

### Wave 2: Auth Endpoints [L]
**Size**: Large (5 tasks, 75-90 min)  
**Dependencies**: Phase 2 Wave 1 complete  
**Tasks**:
- Implement password hashing with bcrypt
- Create POST /api/auth/register endpoint
- Create POST /api/auth/login endpoint
- Add JWT token generation
- Implement refresh token logic
- Create POST /api/auth/refresh endpoint

**Deliverables**:
- `src/routes/auth.js` - Auth routes
- `src/services/authService.js` - Auth business logic
- `src/utils/jwt.js` - JWT utilities
- `tests/routes/auth.test.js` - Auth endpoint tests

**Success Criteria**:
- ✅ Can register new users
- ✅ Passwords are hashed (not stored plain)
- ✅ Login returns valid JWT
- ✅ Refresh token extends session
- ✅ Invalid credentials rejected

**Checkpoint**: "Authentication endpoints complete" (auto-checkpoint for large wave)

---

### Wave 3: Protected Routes [M]
**Size**: Medium (3 tasks, 45-60 min)  
**Dependencies**: Phase 2 Wave 2 complete  
**Tasks**:
- Create authentication middleware
- Protect user endpoints with auth middleware
- Add authorization checks (user can only modify own data)
- Create POST /api/auth/logout endpoint

**Deliverables**:
- `src/middleware/authenticate.js` - Auth middleware
- `src/middleware/authorize.js` - Authorization checks

**Success Criteria**:
- ✅ Protected routes require valid JWT
- ✅ Invalid/expired tokens rejected
- ✅ Users can only access own data
- ✅ Logout invalidates token

**Checkpoint**: "Protected routes complete"

---

## Phase 3: Production Readiness [2 waves]

**Objective**: Add production features (logging, health checks, security)

**Duration**: ~2 hours

### Wave 1: Logging & Health Checks [M]
**Size**: Medium (3 tasks, 45-60 min)  
**Dependencies**: Phase 2 complete  
**Tasks**:
- Set up structured logging (Winston)
- Add request logging middleware
- Create GET /health endpoint
- Create GET /health/db endpoint
- Add environment-specific configuration

**Deliverables**:
- `src/utils/logger.js` - Logger configuration
- `src/middleware/requestLogger.js` - Request logging
- `src/routes/health.js` - Health check routes
- `config/` - Environment configs

**Success Criteria**:
- ✅ All requests logged with correlation IDs
- ✅ Health checks return server & DB status
- ✅ Logs structured (JSON) for production
- ✅ Different log levels per environment

---

### Wave 2: Security & Documentation [M]
**Size**: Medium (4 tasks, 60 min)  
**Dependencies**: Phase 3 Wave 1 complete  
**Tasks**:
- Add Helmet.js security headers
- Configure CORS properly
- Add rate limiting on auth endpoints
- Create API documentation (OpenAPI/Swagger)
- Run security audit (npm audit)

**Deliverables**:
- `src/middleware/security.js` - Security middleware
- `docs/API.md` - API documentation
- `swagger.yaml` - OpenAPI specification

**Success Criteria**:
- ✅ Security headers present (Helmet)
- ✅ CORS configured for allowed origins
- ✅ Rate limiting prevents brute force
- ✅ API documentation complete
- ✅ No high/critical security vulnerabilities

**Checkpoint**: "Production ready - API complete"

---

## Milestones

### M1: Database Layer Complete ✓
- **Target**: After Phase 1 Wave 2
- **Criteria**: Database connection, models, queries all working
- **Checkpoint**: "Database layer complete"

### M2: Authentication Working ✓
- **Target**: After Phase 2 Wave 2
- **Criteria**: Register, login, JWT generation functional
- **Checkpoint**: "Authentication endpoints complete"

### M3: API Fully Protected ✓
- **Target**: After Phase 2 Wave 3
- **Criteria**: All routes protected, authorization working
- **Checkpoint**: "Protected routes complete"

### M4: Production Ready ✓
- **Target**: After Phase 3 Wave 2
- **Criteria**: Logging, health checks, security, documentation complete
- **Checkpoint**: "Production ready - API complete"

---

## Wave Dependencies Graph

```
Phase 1:
  Wave 1 (DB Schema) → Wave 2 (DB Models)
                              ↓
Phase 2:                      ↓
  Wave 1 (User Endpoints) ←───┘
     ↓
  Wave 2 (Auth Endpoints)
     ↓
  Wave 3 (Protected Routes)
                              ↓
Phase 3:                      ↓
  Wave 1 (Logging) ←──────────┘
     ↓
  Wave 2 (Security)
```

---

## Checkpoint Strategy

**Automatic checkpoints** (from reis.config.js):
- After each Medium wave
- After each Large wave

**Manual checkpoints** (recommended):
- Before risky refactors
- End of day
- Before deploying changes

**Total expected checkpoints**: 6-8

---

## Risk Management

### High Risk Areas
- **Auth logic**: Security bugs can be catastrophic
  - *Mitigation*: Extensive testing, security audit
- **SQL injection**: User input in queries
  - *Mitigation*: Parameterized queries only
- **Password storage**: Plain text passwords = disaster
  - *Mitigation*: bcrypt with cost 12, never log passwords

### Medium Risk Areas
- **JWT secret management**: Leaked secret compromises all tokens
  - *Mitigation*: Environment variables, never commit secrets
- **Rate limiting**: Brute force on login
  - *Mitigation*: Express rate limit middleware

### Low Risk Areas
- Database schema changes (handled by migrations)
- API documentation (doesn't affect functionality)

---

## Metrics to Track

After completing this roadmap, analyze:

- **Wave completion times**: Compare estimated vs actual
- **Deviation rate**: How often did plans change?
- **Checkpoint frequency**: Were checkpoints at good intervals?
- **Phase dependencies**: Did dependencies cause blocking?

View with: `reis visualize --type metrics`
