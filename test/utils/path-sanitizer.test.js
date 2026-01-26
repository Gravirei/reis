const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const {
  sanitizePath,
  sanitizeExistingPath,
  sanitizeFilePath,
  sanitizeDirPath,
  sanitizeNewFilePath,
  isPathSafe,
  safeJoin
} = require('../../lib/utils/path-sanitizer');

describe('Path Sanitizer', () => {
  const testDir = path.join(os.tmpdir(), 'reis-path-sanitizer-test');
  const testFile = path.join(testDir, 'test.txt');
  const testSubDir = path.join(testDir, 'subdir');
  
  before(() => {
    // Create test directory structure
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    if (!fs.existsSync(testSubDir)) {
      fs.mkdirSync(testSubDir, { recursive: true });
    }
    fs.writeFileSync(testFile, 'test content');
  });
  
  after(() => {
    // Cleanup
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    if (fs.existsSync(testSubDir)) {
      fs.rmdirSync(testSubDir);
    }
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir);
    }
  });

  describe('sanitizePath', () => {
    it('should resolve relative paths within boundary', () => {
      const result = sanitizePath('subdir', testDir);
      assert.strictEqual(result, path.join(testDir, 'subdir'));
    });

    it('should accept absolute paths within boundary', () => {
      const absPath = path.join(testDir, 'subdir');
      const result = sanitizePath(absPath, testDir);
      assert.strictEqual(result, absPath);
    });

    it('should reject path traversal with ../', () => {
      assert.throws(() => {
        sanitizePath('../../../etc/passwd', testDir);
      }, /Path traversal detected/);
    });

    it('should reject path traversal with double dots in middle', () => {
      assert.throws(() => {
        sanitizePath('valid/../../../etc/passwd', testDir);
      }, /Path traversal detected/);
    });

    it('should reject absolute paths outside boundary', () => {
      assert.throws(() => {
        sanitizePath('/etc/passwd', testDir);
      }, /Path traversal detected/);
    });

    it('should handle nested ../ traversal attempts', () => {
      assert.throws(() => {
        sanitizePath('subdir/../../..', testDir);
      }, /Path traversal detected/);
    });

    it('should allow accessing the base directory itself', () => {
      const result = sanitizePath('.', testDir);
      assert.strictEqual(result, testDir);
    });

    it('should throw on empty path', () => {
      assert.throws(() => {
        sanitizePath('', testDir);
      }, /Invalid path/);
    });

    it('should throw on null path', () => {
      assert.throws(() => {
        sanitizePath(null, testDir);
      }, /Invalid path/);
    });
  });

  describe('sanitizeExistingPath', () => {
    it('should return path for existing files', () => {
      const result = sanitizeExistingPath('test.txt', testDir);
      assert.strictEqual(result, testFile);
    });

    it('should return path for existing directories', () => {
      const result = sanitizeExistingPath('subdir', testDir);
      assert.strictEqual(result, testSubDir);
    });

    it('should throw for non-existent paths', () => {
      assert.throws(() => {
        sanitizeExistingPath('nonexistent.txt', testDir);
      }, /Path not found/);
    });

    it('should still reject traversal attempts', () => {
      assert.throws(() => {
        sanitizeExistingPath('../../../etc/passwd', testDir);
      }, /Path traversal detected/);
    });
  });

  describe('sanitizeFilePath', () => {
    it('should return path for files', () => {
      const result = sanitizeFilePath('test.txt', testDir);
      assert.strictEqual(result, testFile);
    });

    it('should throw for directories', () => {
      assert.throws(() => {
        sanitizeFilePath('subdir', testDir);
      }, /Expected file but got directory/);
    });

    it('should throw for non-existent files', () => {
      assert.throws(() => {
        sanitizeFilePath('nonexistent.txt', testDir);
      }, /Path not found/);
    });
  });

  describe('sanitizeDirPath', () => {
    it('should return path for directories', () => {
      const result = sanitizeDirPath('subdir', testDir);
      assert.strictEqual(result, testSubDir);
    });

    it('should throw for files', () => {
      assert.throws(() => {
        sanitizeDirPath('test.txt', testDir);
      }, /Expected directory but got file/);
    });

    it('should throw for non-existent directories', () => {
      assert.throws(() => {
        sanitizeDirPath('nonexistent', testDir);
      }, /Path not found/);
    });
  });

  describe('sanitizeNewFilePath', () => {
    it('should return path when parent directory exists', () => {
      const result = sanitizeNewFilePath('subdir/newfile.txt', testDir);
      assert.strictEqual(result, path.join(testSubDir, 'newfile.txt'));
    });

    it('should throw when parent directory does not exist', () => {
      assert.throws(() => {
        sanitizeNewFilePath('nonexistent/newfile.txt', testDir);
      }, /Parent directory not found/);
    });

    it('should still reject traversal attempts', () => {
      assert.throws(() => {
        sanitizeNewFilePath('../../../tmp/evil.txt', testDir);
      }, /Path traversal detected/);
    });
  });

  describe('isPathSafe', () => {
    it('should return true for safe paths', () => {
      assert.strictEqual(isPathSafe('subdir', testDir), true);
      assert.strictEqual(isPathSafe('test.txt', testDir), true);
    });

    it('should return false for traversal attempts', () => {
      assert.strictEqual(isPathSafe('../../../etc/passwd', testDir), false);
      assert.strictEqual(isPathSafe('/etc/passwd', testDir), false);
    });

    it('should return false for invalid paths', () => {
      assert.strictEqual(isPathSafe('', testDir), false);
      assert.strictEqual(isPathSafe(null, testDir), false);
    });
  });

  describe('safeJoin', () => {
    it('should join paths within boundary', () => {
      const result = safeJoin(testDir, 'subdir', 'file.txt');
      assert.strictEqual(result, path.join(testDir, 'subdir', 'file.txt'));
    });

    it('should reject joins that escape boundary', () => {
      assert.throws(() => {
        safeJoin(testDir, '..', '..', 'etc', 'passwd');
      }, /Path traversal detected/);
    });
  });
});
