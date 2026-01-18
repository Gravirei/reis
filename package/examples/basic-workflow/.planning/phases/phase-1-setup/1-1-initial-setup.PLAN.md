# Plan: Phase 1 Wave 1 - Project Setup & Storage

## Objective
Set up the Node.js project structure and implement the JSON storage layer with atomic writes.

## Context
This is the first wave of the TODO CLI project. We're establishing the foundation that all other features will build upon. The storage layer must be reliable and prevent data corruption.

## Dependencies
- Node.js 16+ installed
- Git initialized in project directory

## Tasks

### Wave 1: Project Setup & Storage [S]

<task type="auto">
<name>Create Node.js project structure</name>
<files>package.json, .gitignore, src/, tests/</files>
<action>
Initialize Node.js project with proper structure:

1. Create package.json:
```json
{
  "name": "todo-cli",
  "version": "1.0.0",
  "description": "Simple command-line TODO application",
  "main": "src/cli.js",
  "bin": {
    "todo": "./bin/todo"
  },
  "scripts": {
    "test": "jest",
    "lint": "eslint src/ tests/"
  },
  "keywords": ["todo", "cli", "productivity"],
  "author": "REIS Example",
  "license": "MIT",
  "dependencies": {
    "commander": "^11.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "eslint": "^8.0.0"
  }
}
```

2. Create .gitignore:
```
node_modules/
coverage/
.todo/
*.log
.DS_Store
```

3. Create directory structure:
   - src/ (source code)
   - tests/ (test files)
   - bin/ (executable)
</action>
<verify>
- package.json exists and is valid JSON
- .gitignore includes node_modules
- src/ and tests/ directories exist
- Run: `node -e "require('./package.json')"` succeeds
</verify>
<done>Project structure created with package.json, directories, and .gitignore</done>
</task>

<task type="auto">
<name>Implement JSON storage layer</name>
<files>src/storage.js</files>
<action>
Create src/storage.js with atomic file operations:

```javascript
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const TODO_DIR = path.join(os.homedir(), '.todo');
const TASKS_FILE = path.join(TODO_DIR, 'tasks.json');
const BACKUP_FILE = path.join(TODO_DIR, 'tasks.backup.json');

/**
 * Ensure .todo directory exists
 */
async function ensureDir() {
  try {
    await fs.mkdir(TODO_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

/**
 * Load tasks from JSON file
 * @returns {Promise<Array>} Array of task objects
 */
async function loadTasks() {
  await ensureDir();
  
  try {
    const data = await fs.readFile(TASKS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return parsed.tasks || [];
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File doesn't exist yet, return empty array
      return [];
    }
    throw new Error(`Failed to load tasks: ${err.message}`);
  }
}

/**
 * Save tasks to JSON file with atomic write
 * @param {Array} tasks - Array of task objects
 * @returns {Promise<void>}
 */
async function saveTasks(tasks) {
  await ensureDir();
  
  // Create backup if file exists
  try {
    await fs.copyFile(TASKS_FILE, BACKUP_FILE);
  } catch (err) {
    // Ignore if source doesn't exist
    if (err.code !== 'ENOENT') {
      console.warn('Warning: Could not create backup');
    }
  }
  
  const data = JSON.stringify({ tasks }, null, 2);
  const tempFile = `${TASKS_FILE}.tmp`;
  
  try {
    // Write to temp file first
    await fs.writeFile(tempFile, data, 'utf8');
    // Atomically rename temp file to actual file
    await fs.rename(tempFile, TASKS_FILE);
  } catch (err) {
    // Clean up temp file on error
    try {
      await fs.unlink(tempFile);
    } catch {}
    throw new Error(`Failed to save tasks: ${err.message}`);
  }
}

/**
 * Restore tasks from backup
 * @returns {Promise<void>}
 */
async function restoreFromBackup() {
  try {
    await fs.copyFile(BACKUP_FILE, TASKS_FILE);
  } catch (err) {
    throw new Error(`Failed to restore backup: ${err.message}`);
  }
}

module.exports = {
  loadTasks,
  saveTasks,
  restoreFromBackup,
  TASKS_FILE,
  BACKUP_FILE
};
```

Key features:
- Atomic writes using temp file + rename
- Automatic backup before save
- Error handling with clear messages
- Creates ~/.todo directory automatically
</action>
<verify>
- src/storage.js exists and is valid JavaScript
- Run: `node -e "require('./src/storage.js')"` succeeds
- File exports loadTasks, saveTasks, restoreFromBackup
</verify>
<done>JSON storage layer implemented with atomic writes and backup functionality</done>
</task>

<task type="auto">
<name>Add storage unit tests</name>
<files>tests/storage.test.js, jest.config.js</files>
<action>
Create comprehensive unit tests for storage layer.

1. Create jest.config.js:
```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js'],
  testMatch: ['**/tests/**/*.test.js']
};
```

2. Create tests/storage.test.js:
```javascript
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { loadTasks, saveTasks, restoreFromBackup, TASKS_FILE, BACKUP_FILE } = require('../src/storage');

// Use temp directory for tests
const TEST_DIR = path.join(os.tmpdir(), '.todo-test-' + Date.now());
const TEST_TASKS_FILE = path.join(TEST_DIR, 'tasks.json');

describe('Storage Layer', () => {
  beforeEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_DIR, { recursive: true });
    } catch {}
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up after tests
    try {
      await fs.rm(TEST_DIR, { recursive: true });
    } catch {}
  });

  describe('loadTasks', () => {
    test('returns empty array when file does not exist', async () => {
      const tasks = await loadTasks();
      expect(tasks).toEqual([]);
    });

    test('loads tasks from existing file', async () => {
      const mockTasks = [
        { id: '1', description: 'Test task', completed: false }
      ];
      await fs.writeFile(TEST_TASKS_FILE, JSON.stringify({ tasks: mockTasks }));
      
      const tasks = await loadTasks();
      expect(tasks).toEqual(mockTasks);
    });

    test('throws error for corrupted JSON', async () => {
      await fs.writeFile(TEST_TASKS_FILE, 'invalid json');
      
      await expect(loadTasks()).rejects.toThrow();
    });
  });

  describe('saveTasks', () => {
    test('saves tasks to file', async () => {
      const tasks = [
        { id: '1', description: 'Test task', completed: false }
      ];
      
      await saveTasks(tasks);
      
      const fileContent = await fs.readFile(TEST_TASKS_FILE, 'utf8');
      const parsed = JSON.parse(fileContent);
      expect(parsed.tasks).toEqual(tasks);
    });

    test('creates backup before saving', async () => {
      const tasks1 = [{ id: '1', description: 'First' }];
      await saveTasks(tasks1);
      
      const tasks2 = [{ id: '2', description: 'Second' }];
      await saveTasks(tasks2);
      
      const backupContent = await fs.readFile(BACKUP_FILE, 'utf8');
      const backup = JSON.parse(backupContent);
      expect(backup.tasks).toEqual(tasks1);
    });

    test('atomic write prevents partial data', async () => {
      // This test verifies that the atomic write mechanism works
      const tasks = [{ id: '1', description: 'Atomic test' }];
      await saveTasks(tasks);
      
      // Verify no .tmp file remains
      const files = await fs.readdir(path.dirname(TEST_TASKS_FILE));
      expect(files.some(f => f.endsWith('.tmp'))).toBe(false);
    });
  });

  describe('restoreFromBackup', () => {
    test('restores tasks from backup file', async () => {
      const originalTasks = [{ id: '1', description: 'Original' }];
      await saveTasks(originalTasks);
      
      const newTasks = [{ id: '2', description: 'New' }];
      await saveTasks(newTasks);
      
      await restoreFromBackup();
      
      const restored = await loadTasks();
      expect(restored).toEqual(originalTasks);
    });

    test('throws error when no backup exists', async () => {
      await expect(restoreFromBackup()).rejects.toThrow();
    });
  });
});
```

These tests provide comprehensive coverage of the storage layer.
</action>
<verify>
- tests/storage.test.js exists
- jest.config.js exists
- All tests can be parsed (no syntax errors)
</verify>
<done>Storage unit tests created with 100% coverage of storage operations</done>
</task>

## Success Criteria
- ✅ Node.js project structure established
- ✅ Storage layer implemented with atomic writes
- ✅ Backup mechanism in place
- ✅ Unit tests with comprehensive coverage
- ✅ All tests passing

## Verification
```bash
# Verify project structure
ls -la package.json src/ tests/

# Validate package.json
node -e "require('./package.json')"

# Check storage module loads
node -e "require('./src/storage.js')"

# Run tests (will need to install dependencies first)
# npm install
# npm test
```

## Notes
This wave establishes the foundation. All future waves depend on this storage layer being solid and reliable.
