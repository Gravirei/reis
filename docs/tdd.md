# TDD Workflow in REIS

## Overview

This guide covers Test-Driven Development (TDD) practices within the REIS methodology. TDD ensures code correctness from the start and integrates seamlessly with REIS's verification system.

**Key Benefits:**
- Catch bugs before implementation
- Clear specifications for features
- Confidence in refactoring
- Built-in regression testing

## TDD + REIS Integration

### When to Use TDD

**Recommended for:**
- Complex business logic
- API endpoint development
- Data transformations and parsers
- Algorithm implementation
- State management
- Utility functions

### When TDD is Optional

**Consider alternatives for:**
- UI/visual components (use snapshot testing)
- Configuration files
- Simple CRUD operations
- Prototyping/spike work
- One-off scripts

## TDD in PLAN.md Tasks

### Task Structure for TDD

When planning tasks that use TDD, structure them explicitly:

```xml
<task type="auto">
<name>Implement user authentication</name>
<files>src/auth/login.ts, src/auth/__tests__/login.test.ts</files>
<action>
TDD Approach:
1. Write failing test for valid login
2. Implement minimal code to pass
3. Write failing test for invalid credentials
4. Implement validation
5. Refactor for clarity

Test cases to cover:
- Valid email/password returns token
- Invalid email returns 401
- Invalid password returns 401
- Missing fields return 400
- Token expires after configured time
</action>
<verify>npm test -- --grep "login"</verify>
<done>All login tests pass, code coverage > 80%</done>
</task>
```

### Verification Integration

The `reis_verifier` checks TDD compliance:

```bash
# Verify tests exist for all source files
reis verify --check-tests

# Verify coverage thresholds
reis verify --coverage 80
```

## Red-Green-Refactor Cycle

### 1. Red Phase (Write Failing Test)

Write a test that describes the desired behavior:

```typescript
// src/auth/__tests__/login.test.ts
describe('authenticateUser', () => {
  it('should return JWT token for valid credentials', async () => {
    // Arrange
    const credentials = {
      email: 'user@example.com',
      password: 'validPassword123'
    };
    
    // Act
    const result = await authenticateUser(credentials);
    
    // Assert
    expect(result.token).toBeDefined();
    expect(result.token).toMatch(/^eyJ/); // JWT format
  });
});
```

**Run test - it should FAIL:**
```bash
npm test -- --grep "authenticateUser"
# ❌ FAIL: authenticateUser is not defined
```

### 2. Green Phase (Make It Pass)

Write minimal code to pass the test:

```typescript
// src/auth/login.ts
import jwt from 'jsonwebtoken';

interface Credentials {
  email: string;
  password: string;
}

interface AuthResult {
  token: string;
}

export async function authenticateUser(
  credentials: Credentials
): Promise<AuthResult> {
  // Minimal implementation to pass
  const token = jwt.sign(
    { email: credentials.email },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
  
  return { token };
}
```

**Run test - it should PASS:**
```bash
npm test -- --grep "authenticateUser"
# ✅ PASS: should return JWT token for valid credentials
```

### 3. Refactor Phase (Improve Code)

Now improve the code while keeping tests green:

```typescript
// src/auth/login.ts - Refactored
import jwt from 'jsonwebtoken';
import { validateCredentials } from './validation';
import { findUserByEmail } from '../db/users';
import { comparePassword } from '../utils/crypto';

export async function authenticateUser(
  credentials: Credentials
): Promise<AuthResult> {
  // Validate input
  validateCredentials(credentials);
  
  // Find user
  const user = await findUserByEmail(credentials.email);
  if (!user) {
    throw new AuthError('Invalid credentials', 401);
  }
  
  // Verify password
  const isValid = await comparePassword(
    credentials.password,
    user.passwordHash
  );
  if (!isValid) {
    throw new AuthError('Invalid credentials', 401);
  }
  
  // Generate token
  return { token: generateToken(user) };
}
```

**Run tests after refactoring:**
```bash
npm test -- --grep "authenticateUser"
# ✅ All tests still pass
```

## Testing Patterns for REIS

### Unit Tests

Test individual functions in isolation:

```typescript
// src/utils/__tests__/validation.test.ts
describe('validateEmail', () => {
  it('should accept valid email formats', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.uk')).toBe(true);
  });
  
  it('should reject invalid email formats', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
  });
  
  it('should handle edge cases', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail(null as any)).toBe(false);
    expect(validateEmail(undefined as any)).toBe(false);
  });
});
```

### Integration Tests

Test module interactions:

```typescript
// src/api/__tests__/auth.integration.test.ts
import request from 'supertest';
import { app } from '../../app';
import { setupTestDb, teardownTestDb } from '../helpers/db';

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await setupTestDb();
  });
  
  afterAll(async () => {
    await teardownTestDb();
  });
  
  it('should return 200 with JWT for valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.expiresIn).toBe(3600);
  });
  
  it('should return 401 for invalid password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'wrongpassword'
      });
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });
  
  it('should return 400 for missing fields', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testuser@example.com' });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('password');
  });
});
```

### End-to-End Tests

Test complete user flows:

```typescript
// e2e/auth-flow.test.ts
describe('Authentication Flow', () => {
  it('should complete full login/logout cycle', async () => {
    // Register
    const registerRes = await api.post('/auth/register', {
      email: 'newuser@test.com',
      password: 'securePass123'
    });
    expect(registerRes.status).toBe(201);
    
    // Login
    const loginRes = await api.post('/auth/login', {
      email: 'newuser@test.com',
      password: 'securePass123'
    });
    expect(loginRes.status).toBe(200);
    const { token } = loginRes.body;
    
    // Access protected route
    const protectedRes = await api.get('/api/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(protectedRes.status).toBe(200);
    
    // Logout
    const logoutRes = await api.post('/auth/logout', null, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(logoutRes.status).toBe(200);
    
    // Verify token invalidated
    const afterLogout = await api.get('/api/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(afterLogout.status).toBe(401);
  });
});
```

## Coverage Requirements

### Recommended Thresholds

| Code Type | Minimum Coverage | Target Coverage |
|-----------|-----------------|-----------------|
| Business Logic | 90% | 95% |
| API Endpoints | 85% | 90% |
| Utilities | 80% | 90% |
| UI Components | 70% | 80% |
| Overall | 80% | 85% |

### Configuration

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Stricter for critical paths
    'src/auth/**/*.ts': {
      branches: 90,
      functions: 90,
      lines: 90
    }
  }
};
```

## Common TDD Pitfalls

### Over-Testing

❌ **Testing implementation details:**
```typescript
// Bad: Tests internal state
it('should set _isAuthenticated to true', () => {
  auth.login(credentials);
  expect(auth._isAuthenticated).toBe(true);
});
```

✅ **Test behavior instead:**
```typescript
// Good: Tests observable behavior
it('should allow access to protected resources after login', () => {
  await auth.login(credentials);
  const result = await auth.accessProtectedResource();
  expect(result.status).toBe(200);
});
```

### Under-Testing

❌ **Happy path only:**
```typescript
// Bad: Only tests success case
it('should login successfully', async () => {
  const result = await login(validCredentials);
  expect(result.token).toBeDefined();
});
```

✅ **Include error cases:**
```typescript
// Good: Tests multiple scenarios
describe('login', () => {
  it('should return token for valid credentials', async () => {...});
  it('should throw for invalid email', async () => {...});
  it('should throw for invalid password', async () => {...});
  it('should throw for missing fields', async () => {...});
  it('should rate limit after 5 failures', async () => {...});
});
```

### Brittle Tests

❌ **Tight coupling to implementation:**
```typescript
// Bad: Breaks when implementation changes
it('should call bcrypt.compare exactly once', () => {
  await login(credentials);
  expect(bcrypt.compare).toHaveBeenCalledTimes(1);
});
```

✅ **Test outcomes, not mechanics:**
```typescript
// Good: Stable test
it('should reject incorrect passwords', async () => {
  await expect(login({ ...credentials, password: 'wrong' }))
    .rejects.toThrow('Invalid credentials');
});
```

## Tools & Configuration

### Recommended Setup

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --reporters=default --reporters=jest-junit"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "jest-junit": "^15.0.0"
  }
}
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true
};
```

### Test Setup File

```typescript
// test/setup.ts
import { config } from 'dotenv';

// Load test environment
config({ path: '.env.test' });

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    createdAt: new Date()
  })
};
```

## TDD Workflow Checklist

### Before Starting a Task

- [ ] Understand requirements clearly
- [ ] Identify test cases needed
- [ ] Set up test file structure
- [ ] Configure test environment

### During Development

- [ ] Write failing test first
- [ ] Implement minimal code to pass
- [ ] Refactor while keeping tests green
- [ ] Add edge case tests
- [ ] Check coverage meets threshold

### Before Committing

- [ ] All tests pass locally
- [ ] Coverage threshold met
- [ ] No skipped tests (`.skip`)
- [ ] No focused tests (`.only`)
- [ ] Tests run in CI environment

---

*TDD workflow guidance for REIS methodology. See also: [VERIFICATION.md](VERIFICATION.md), [verification-patterns.md](verification-patterns.md)*
