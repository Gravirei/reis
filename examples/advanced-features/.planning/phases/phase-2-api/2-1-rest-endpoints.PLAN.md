# Plan: Phase 2 - REST API Endpoints

## Objective
Build the REST API endpoints with authentication, including user routes, auth routes, and protected route middleware.

## Context
This plan covers all 3 waves of Phase 2. Database layer (Phase 1) is assumed complete. This demonstrates complex wave dependencies and large wave handling in REIS v2.0.

## Dependencies
- **Requires**: Phase 1 complete (database setup and models)
- **Blocks**: Phase 3 (production features)

## Tasks

### Wave 1: User Endpoints [M]

<task type="auto">
<name>Set up Express server with middleware</name>
<files>src/app.js, src/server.js, package.json</files>
<action>
Create Express application with essential middleware.

1. Update package.json with dependencies:
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "helmet": "^7.0.0",
    "cors": "^2.8.5",
    "joi": "^17.9.0",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0",
    "pg": "^8.11.0",
    "winston": "^3.10.0",
    "express-rate-limit": "^6.9.0"
  }
}
```

2. Create src/app.js:
```javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes will be added here
// app.use('/api/users', require('./routes/users'));
// app.use('/api/auth', require('./routes/auth'));

// Error handler will be added
// app.use(require('./middleware/errorHandler'));

module.exports = app;
```

3. Create src/server.js:
```javascript
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```
</action>
<verify>
- src/app.js exports Express app
- src/server.js can start server
- Run: `node -e "require('./src/app')"`
</verify>
<done>Express server configured with security middleware</done>
</task>

<task type="auto">
<name>Create validation middleware</name>
<files>src/middleware/validate.js</files>
<action>
Create reusable validation middleware using Joi.

```javascript
const Joi = require('joi');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi schema object
 * @returns {Function} Express middleware
 */
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    // Replace req.body with validated value
    req.body = value;
    next();
  };
}

// Common validation schemas
const schemas = {
  user: {
    update: Joi.object({
      email: Joi.string().email(),
      name: Joi.string().min(2).max(100)
    }).min(1) // At least one field required
  },
  auth: {
    register: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      name: Joi.string().min(2).max(100).required()
    }),
    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    })
  }
};

module.exports = { validate, schemas };
```
</action>
<verify>
- src/middleware/validate.js exists
- Exports validate function and schemas
- Run: `node -e "require('./src/middleware/validate')"`
</verify>
<done>Validation middleware created with Joi schemas</done>
</task>

<task type="auto">
<name>Create error handling middleware</name>
<files>src/middleware/errorHandler.js</files>
<action>
Create centralized error handling middleware.

```javascript
/**
 * Custom error class with status code
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  let { statusCode = 500, message } = err;

  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Don't leak error details in production
  if (!err.isOperational && process.env.NODE_ENV === 'production') {
    message = 'An unexpected error occurred';
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * 404 handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
}

module.exports = { errorHandler, notFoundHandler, AppError };
```
</action>
<verify>
- src/middleware/errorHandler.js exists
- Exports errorHandler, notFoundHandler, AppError
</verify>
<done>Error handling middleware created</done>
</task>

<task type="auto">
<name>Create user routes</name>
<files>src/routes/users.js</files>
<action>
Create user endpoint routes (authentication will be added in Wave 3).

```javascript
const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validate');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/users/me
 * Get current user profile
 * (Will be protected in Wave 3)
 */
router.get('/me', async (req, res, next) => {
  try {
    // For now, mock the user ID (will use req.user.id from JWT in Wave 3)
    const userId = req.headers['x-user-id'] || '1';

    // TODO: Fetch from database
    // const user = await User.findById(userId);
    
    const user = {
      id: userId,
      email: 'user@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString()
    };

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/me
 * Update current user profile
 * (Will be protected in Wave 3)
 */
router.put('/me', validate(schemas.user.update), async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || '1';
    const { email, name } = req.body;

    // TODO: Update in database
    // const user = await User.update(userId, { email, name });

    const user = {
      id: userId,
      email: email || 'user@example.com',
      name: name || 'Test User',
      updatedAt: new Date().toISOString()
    };

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/users/me
 * Delete current user account
 * (Will be protected in Wave 3)
 */
router.delete('/me', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || '1';

    // TODO: Delete from database
    // await User.delete(userId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

Update src/app.js to use the routes:
```javascript
// Add after body parsing middleware
app.use('/api/users', require('./routes/users'));
```
</action>
<verify>
- src/routes/users.js exists with GET, PUT, DELETE routes
- Routes use validation middleware
- src/app.js imports and uses user routes
</verify>
<done>User routes created with validation</done>
</task>

<!-- CHECKPOINT: Wave 1 complete -->

### Wave 2: Auth Endpoints [L]

<task type="auto">
<name>Create JWT utilities</name>
<files>src/utils/jwt.js</files>
<action>
Create JWT token generation and verification utilities.

```javascript
const jwt = require('jsonwebtoken');

// In production, use environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

/**
 * Generate access token
 * @param {Object} payload - Token payload (user data)
 * @returns {string} JWT token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * Generate refresh token
 * @param {Object} payload - Token payload (user data)
 * @returns {string} JWT refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  });
}

/**
 * Verify token
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 * @throws {Error} If token invalid or expired
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken
};
```
</action>
<verify>
- src/utils/jwt.js exists
- Exports token generation and verification functions
- Run: `node -e "require('./src/utils/jwt')"`
</verify>
<done>JWT utilities created for token management</done>
</task>

<task type="auto">
<name>Create auth service with password hashing</name>
<files>src/services/authService.js</files>
<action>
Create authentication service with bcrypt password hashing.

```javascript
const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { AppError } = require('../middleware/errorHandler');

const SALT_ROUNDS = 12;

/**
 * Hash password with bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if match
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Register new user
 * @param {Object} userData - { email, password, name }
 * @returns {Promise<Object>} { user, tokens }
 */
async function register({ email, password, name }) {
  // TODO: Check if user exists
  // const existing = await User.findByEmail(email);
  // if (existing) throw new AppError('Email already registered', 409);

  // Hash password
  const hashedPassword = await hashPassword(password);

  // TODO: Save to database
  // const user = await User.create({ email, password: hashedPassword, name });

  const user = {
    id: Date.now().toString(),
    email,
    name,
    createdAt: new Date().toISOString()
  };

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id });

  return {
    user,
    tokens: { accessToken, refreshToken }
  };
}

/**
 * Login user
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} { user, tokens }
 */
async function login({ email, password }) {
  // TODO: Fetch from database
  // const user = await User.findByEmail(email);
  // if (!user) throw new AppError('Invalid credentials', 401);

  // Mock user with hashed password
  const user = {
    id: '1',
    email,
    name: 'Test User',
    password: await hashPassword('testpassword123') // Mock hash
  };

  // Verify password
  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new AppError('Invalid credentials', 401);
  }

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id });

  // Remove password from response
  delete user.password;

  return {
    user,
    tokens: { accessToken, refreshToken }
  };
}

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} { accessToken }
 */
async function refresh(refreshToken) {
  const { verifyToken } = require('../utils/jwt');

  try {
    const payload = verifyToken(refreshToken);
    const accessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email
    });

    return { accessToken };
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
}

module.exports = {
  register,
  login,
  refresh,
  hashPassword,
  comparePassword
};
```
</action>
<verify>
- src/services/authService.js exists
- Exports register, login, refresh functions
- Password hashing implemented with bcrypt
</verify>
<done>Auth service created with bcrypt password hashing</done>
</task>

<task type="auto">
<name>Create auth routes</name>
<files>src/routes/auth.js</files>
<action>
Create authentication routes (register, login, refresh).

```javascript
const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validate');
const authService = require('../services/authService');

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', validate(schemas.auth.register), async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const result = await authService.register({ email, password, name });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', validate(schemas.auth.login), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const result = await authService.refresh(refreshToken);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout user (invalidate token)
 * Note: With JWT, logout is typically handled client-side by discarding tokens
 * For server-side logout, implement token blacklist
 */
router.post('/logout', async (req, res, next) => {
  try {
    // TODO: Implement token blacklist in production
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

Update src/app.js to use auth routes:
```javascript
// Add after user routes
app.use('/api/auth', require('./routes/auth'));
```
</action>
<verify>
- src/routes/auth.js exists with register, login, refresh, logout routes
- Routes use validation middleware
- src/app.js imports and uses auth routes
</verify>
<done>Auth routes created with register, login, and refresh endpoints</done>
</task>

<!-- CHECKPOINT: Large wave auto-checkpoint -->

### Wave 3: Protected Routes [M]

<task type="auto">
<name>Create authentication middleware</name>
<files>src/middleware/authenticate.js</files>
<action>
Create middleware to protect routes with JWT authentication.

```javascript
const { verifyToken } = require('../utils/jwt');
const { AppError } = require('./errorHandler');

/**
 * Authentication middleware
 * Verifies JWT and attaches user to request
 */
function authenticate(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error.message === 'Token expired') {
      return next(new AppError('Token expired', 401));
    }
    if (error.message === 'Invalid token') {
      return next(new AppError('Invalid token', 401));
    }
    next(error);
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token present, but doesn't fail if missing
 */
function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      req.user = {
        id: decoded.userId,
        email: decoded.email
      };
    }

    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
}

module.exports = { authenticate, optionalAuthenticate };
```
</action>
<verify>
- src/middleware/authenticate.js exists
- Exports authenticate and optionalAuthenticate functions
- Middleware verifies JWT and attaches user to req.user
</verify>
<done>Authentication middleware created for protecting routes</done>
</task>

<task type="auto">
<name>Protect user routes with authentication</name>
<files>src/routes/users.js</files>
<action>
Update user routes to use authentication middleware.

Add at top of src/routes/users.js:
```javascript
const { authenticate } = require('../middleware/authenticate');

// Apply authentication to all routes in this router
router.use(authenticate);
```

Update routes to use req.user instead of mock headers:
```javascript
router.get('/me', async (req, res, next) => {
  try {
    const userId = req.user.id; // From JWT token

    // TODO: Fetch from database
    const user = {
      id: userId,
      email: req.user.email,
      name: 'Test User',
      createdAt: new Date().toISOString()
    };

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.put('/me', validate(schemas.user.update), async (req, res, next) => {
  try {
    const userId = req.user.id; // From JWT token
    const { email, name } = req.body;

    // TODO: Update in database
    const user = {
      id: userId,
      email: email || req.user.email,
      name: name || 'Test User',
      updatedAt: new Date().toISOString()
    };

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.delete('/me', async (req, res, next) => {
  try {
    const userId = req.user.id; // From JWT token

    // TODO: Delete from database

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
```
</action>
<verify>
- User routes now use authenticate middleware
- Routes use req.user.id instead of headers
- All user endpoints are protected
</verify>
<done>User routes protected with JWT authentication</done>
</task>

<task type="auto">
<name>Update app.js with error handlers</name>
<files>src/app.js</files>
<action>
Complete src/app.js with error handlers and final route setup.

```javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));

// Health check (unprotected)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
```
</action>
<verify>
- src/app.js has all routes configured
- Error handlers are last in middleware chain
- Health check endpoint exists
- Run: `node -e "require('./src/app')"`
</verify>
<done>App.js completed with all routes and error handling</done>
</task>

## Success Criteria
- ✅ Express server with security middleware
- ✅ User endpoints (GET, PUT, DELETE /api/users/me)
- ✅ Auth endpoints (register, login, refresh, logout)
- ✅ JWT token generation and verification
- ✅ Password hashing with bcrypt
- ✅ Authentication middleware protecting user routes
- ✅ Validation on all input
- ✅ Centralized error handling

## Verification
```bash
# Check all files exist
ls -la src/app.js src/server.js src/routes/ src/middleware/ src/services/ src/utils/

# Verify modules load
node -e "require('./src/app')"
node -e "require('./src/routes/users')"
node -e "require('./src/routes/auth')"
node -e "require('./src/middleware/authenticate')"

# Count lines of code
find src -name "*.js" -exec wc -l {} + | tail -1
```

## Notes
This plan demonstrates:
- **Wave dependencies**: Wave 2 depends on Wave 1, Wave 3 depends on Wave 2
- **Large wave**: Wave 2 has 5 tasks (auth complexity justifies large size)
- **Checkpoints**: Auto-checkpoint after Wave 2 (large wave), manual after Wave 3
- **Real-world complexity**: Authentication, validation, error handling all integrated
