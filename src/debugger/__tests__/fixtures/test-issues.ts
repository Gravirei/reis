/**
 * Test fixtures for all 7 issue types
 * Used across unit and integration tests
 */

export const testIssues = {
  // Type 1: Syntax Error
  syntaxError: {
    description: "TypeError: Cannot read property 'map' of undefined",
    error: "TypeError: Cannot read property 'map' of undefined\n    at formatResults (/app/src/utils.ts:45:20)",
    context: {
      recentChanges: ["Modified src/utils.ts to add new formatResults function"],
      affectedFiles: ["src/utils.ts"],
      lastWorkingCommit: "abc123",
    },
    expected: {
      type: "syntax-error" as const,
      confidence: 0.9,
      primaryCause: "undefined-access",
    },
  },

  // Type 2: Logic Error
  logicError: {
    description: "User authentication succeeds with wrong password",
    error: null,
    context: {
      recentChanges: ["Updated password validation logic in auth.ts"],
      affectedFiles: ["src/auth/auth.ts"],
      symptoms: ["Users can log in with incorrect passwords"],
    },
    expected: {
      type: "logic-error" as const,
      confidence: 0.75,
      primaryCause: "inverted-condition",
    },
  },

  // Type 3: Integration Issue
  integrationIssue: {
    description: "API returns 404 for valid endpoints after frontend update",
    error: "Error: Request failed with status code 404",
    context: {
      recentChanges: ["Updated API client to use new endpoint paths"],
      affectedFiles: ["src/api/client.ts", "src/components/UserList.tsx"],
      symptoms: ["Frontend shows 404 errors", "API logs show path mismatches"],
    },
    expected: {
      type: "integration-issue" as const,
      confidence: 0.85,
      primaryCause: "api-contract-mismatch",
    },
  },

  // Type 4: Environment Issue
  environmentIssue: {
    description: "Database connection fails in production but works locally",
    error: "Error: connect ECONNREFUSED 127.0.0.1:5432",
    context: {
      recentChanges: ["Deployed new database migration"],
      environment: "production",
      symptoms: ["Connection timeout", "Works in development"],
    },
    expected: {
      type: "environment-issue" as const,
      confidence: 0.8,
      primaryCause: "missing-env-var",
    },
  },

  // Type 5: Performance Issue
  performanceIssue: {
    description: "Page load time increased from 200ms to 5s after adding user list",
    error: null,
    context: {
      recentChanges: ["Added user list component with avatar fetching"],
      affectedFiles: ["src/components/UserList.tsx"],
      metrics: { before: "200ms", after: "5s" },
    },
    expected: {
      type: "performance-issue" as const,
      confidence: 0.7,
      primaryCause: "n-plus-one-queries",
    },
  },

  // Type 6: Dependency Conflict
  dependencyConflict: {
    description: "Build fails after updating React to v18",
    error: "npm ERR! peer dep missing: react@^17.0.0, required by some-package@2.0.0",
    context: {
      recentChanges: ["Updated react to 18.2.0 in package.json"],
      affectedFiles: ["package.json"],
    },
    expected: {
      type: "dependency-conflict" as const,
      confidence: 0.95,
      primaryCause: "peer-dependency-mismatch",
    },
  },

  // Type 7: Incomplete Implementation (FR2.1)
  incompleteImplementation: {
    description: "Authentication endpoint returns 501 Not Implemented",
    error: null,
    context: {
      recentChanges: ["Completed plan 3-2-auth-endpoints"],
      affectedFiles: ["src/api/auth/login.ts"],
      planReference: "3-2-auth-endpoints",
      symptoms: ["Endpoint registered but returns 501", "Tests marked as TODO"],
    },
    expected: {
      type: "incomplete-implementation" as const,
      confidence: 0.85,
      primaryCause: "executor-skip",
      incompleteDetails: {
        cause: "executor-skip",
        indicators: ["TODO comments", "stub implementations", "missing error handling"],
      },
    },
  },

  // Additional incomplete implementation scenarios
  incompleteImplementationPlanAmbiguity: {
    description: "User profile page missing validation as described in requirements",
    error: null,
    context: {
      recentChanges: ["Completed plan 2-3-user-profile"],
      affectedFiles: ["src/pages/Profile.tsx"],
      planReference: "2-3-user-profile",
      symptoms: ["Plan mentioned 'add validation' but unclear which fields", "Basic form works but no validation"],
    },
    expected: {
      type: "incomplete-implementation" as const,
      confidence: 0.75,
      primaryCause: "plan-ambiguity",
      incompleteDetails: {
        cause: "plan-ambiguity",
        indicators: ["vague requirements", "missing specifications"],
      },
    },
  },

  incompleteImplementationDependencyBlocker: {
    description: "Payment processing not implemented due to missing Stripe keys",
    error: null,
    context: {
      recentChanges: ["Completed plan 4-1-payment-flow"],
      affectedFiles: ["src/api/payment/process.ts"],
      planReference: "4-1-payment-flow",
      symptoms: ["Code has comments about missing API keys", "Checkpoint marked as blocked"],
    },
    expected: {
      type: "incomplete-implementation" as const,
      confidence: 0.8,
      primaryCause: "dependency-blocker",
      incompleteDetails: {
        cause: "dependency-blocker",
        indicators: ["external dependency required", "checkpoint blocked"],
      },
    },
  },
};

export const testPatterns = {
  // Pattern for incomplete implementation (executor-skip)
  executorSkipPattern: {
    type: "incomplete-implementation" as const,
    cause: "executor-skip",
    signature: ["TODO", "stub", "not implemented"],
    frequency: 7,
    solutions: [
      "Review plan task requirements carefully",
      "Implement all specified functionality",
      "Remove TODO markers after implementation",
    ],
    preventionStrategy: "Verify each task completion criteria before committing",
  },

  // Pattern for logic errors
  invertedConditionPattern: {
    type: "logic-error" as const,
    cause: "inverted-condition",
    signature: ["if (!success)", "password validation", "authentication"],
    frequency: 3,
    solutions: [
      "Check boolean logic in conditional statements",
      "Review comparison operators (== vs !=, < vs >)",
      "Add unit tests for edge cases",
    ],
    preventionStrategy: "Write unit tests before implementing conditional logic",
  },
};

export const testContexts = {
  // Minimal context
  minimal: {
    recentChanges: ["Modified file.ts"],
    affectedFiles: ["file.ts"],
  },

  // Rich context with all fields
  rich: {
    recentChanges: [
      "Implemented user authentication system",
      "Added password hashing with bcrypt",
      "Created login and signup endpoints",
    ],
    affectedFiles: ["src/auth/auth.ts", "src/api/auth.ts", "src/middleware/validate.ts"],
    lastWorkingCommit: "a1b2c3d4",
    environment: "production",
    symptoms: ["Users cannot log in", "Password validation fails", "500 errors in logs"],
    metrics: { errorRate: "25%", affectedUsers: "1200" },
    planReference: "3-2-auth-implementation",
  },
};
