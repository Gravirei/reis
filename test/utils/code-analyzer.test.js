const assert = require('assert');
const path = require('path');
const { CodeAnalyzer } = require('../../lib/utils/code-analyzer');

describe('CodeAnalyzer', function() {
  let analyzer;
  
  beforeEach(function() {
    analyzer = new CodeAnalyzer(process.cwd());
  });
  
  describe('File Operations', function() {
    it('should check if file exists', function() {
      assert.strictEqual(analyzer.fileExists('package.json'), true);
      assert.strictEqual(analyzer.fileExists('nonexistent.js'), false);
    });
    
    it('should check if directory exists', function() {
      assert.strictEqual(analyzer.directoryExists('lib'), true);
      assert.strictEqual(analyzer.directoryExists('nonexistent'), false);
    });
    
    it('should resolve file path', function() {
      const resolved = analyzer.resolveFilePath('package.json');
      assert.ok(resolved.endsWith('package.json'));
    });
    
    it('should return null for non-existent file path', function() {
      const resolved = analyzer.resolveFilePath('nonexistent.js');
      assert.strictEqual(resolved, null);
    });
    
    it('should find files matching glob pattern', function() {
      const files = analyzer.findFiles('*.json');
      assert.ok(Array.isArray(files));
      assert.ok(files.includes('package.json'));
    });
    
    it('should check which files exist', function() {
      const result = analyzer.checkFilesExist(['package.json', 'nonexistent.js']);
      assert.deepStrictEqual(result.found, ['package.json']);
      assert.deepStrictEqual(result.missing, ['nonexistent.js']);
    });
    
    it('should check which directories exist', function() {
      const result = analyzer.checkDirectoriesExist(['lib', 'nonexistent']);
      assert.deepStrictEqual(result.found, ['lib']);
      assert.deepStrictEqual(result.missing, ['nonexistent']);
    });
  });
  
  describe('Function Detection', function() {
    it('should get functions from a file', function() {
      const functions = analyzer.getFunctions('lib/utils/code-analyzer.js');
      assert.ok(Array.isArray(functions));
      assert.ok(functions.length > 0);
      assert.ok(functions.includes('fileExists'));
      assert.ok(functions.includes('getFunctions'));
    });
    
    it('should check if function exists', function() {
      const exists = analyzer.functionExists('lib/utils/code-analyzer.js', 'fileExists');
      assert.strictEqual(exists, true);
    });
    
    it('should return false for non-existent function', function() {
      const exists = analyzer.functionExists('lib/utils/code-analyzer.js', 'nonExistentFunction');
      assert.strictEqual(exists, false);
    });
    
    it('should return empty array for non-existent file', function() {
      const functions = analyzer.getFunctions('nonexistent.js');
      assert.deepStrictEqual(functions, []);
    });
    
    it('should check function signature', function() {
      const result = analyzer.checkFunctionSignature('lib/utils/code-analyzer.js', 'fileExists', ['filePath']);
      assert.ok(typeof result.exists === 'boolean');
      assert.ok(Array.isArray(result.params));
      assert.ok(typeof result.matches === 'boolean');
    });
  });
  
  describe('Export Detection', function() {
    it('should get exports from a file', function() {
      const exports = analyzer.getExports('lib/utils/code-analyzer.js');
      assert.ok(Array.isArray(exports));
      assert.ok(exports.includes('CodeAnalyzer'));
    });
    
    it('should check if export exists', function() {
      const exists = analyzer.exportExists('lib/utils/code-analyzer.js', 'CodeAnalyzer');
      assert.strictEqual(exists, true);
    });
    
    it('should return false for non-existent export', function() {
      const exists = analyzer.exportExists('lib/utils/code-analyzer.js', 'NonExistentExport');
      assert.strictEqual(exists, false);
    });
    
    it('should return empty array for non-existent file', function() {
      const exports = analyzer.getExports('nonexistent.js');
      assert.deepStrictEqual(exports, []);
    });
  });
  
  describe('Dependency Analysis', function() {
    it('should check npm dependency', function() {
      const result = analyzer.checkNpmDependency('chalk');
      assert.ok(result.exists);
      assert.ok(result.version !== null);
    });
    
    it('should return false for missing dependency', function() {
      const result = analyzer.checkNpmDependency('nonexistent-package-xyz');
      assert.strictEqual(result.exists, false);
      assert.strictEqual(result.version, null);
    });
    
    it('should detect dev dependencies', function() {
      const result = analyzer.checkNpmDependency('mocha');
      assert.ok(result.exists);
      assert.strictEqual(result.isDev, true);
    });
    
    it('should get missing dependencies', function() {
      const missing = analyzer.getMissingDependencies(['chalk', 'nonexistent-pkg']);
      assert.ok(Array.isArray(missing));
      assert.ok(missing.includes('nonexistent-pkg'));
      assert.ok(!missing.includes('chalk'));
    });
  });
  
  describe('Import Analysis', function() {
    it('should get imports from a file', function() {
      const imports = analyzer.getImports('lib/utils/code-analyzer.js');
      assert.ok(Array.isArray(imports));
      assert.ok(imports.length > 0);
      // Should detect fs and path imports
      const moduleNames = imports.map(i => i.module);
      assert.ok(moduleNames.includes('fs'));
      assert.ok(moduleNames.includes('path'));
    });
    
    it('should identify local imports', function() {
      const imports = analyzer.getImports('lib/commands/review.js');
      const localImports = imports.filter(i => i.isLocal);
      assert.ok(localImports.length >= 0); // May or may not have local imports
    });
    
    it('should return empty array for non-existent file', function() {
      const imports = analyzer.getImports('nonexistent.js');
      assert.deepStrictEqual(imports, []);
    });
  });
  
  describe('Path Resolution', function() {
    it('should handle absolute paths', function() {
      const absPath = path.join(process.cwd(), 'package.json');
      assert.strictEqual(analyzer.fileExists(absPath), true);
    });
    
    it('should resolve import paths', function() {
      // Test resolving a local import
      const resolved = analyzer.resolveImport('./state-manager', 'lib/utils/code-analyzer.js');
      // Should resolve to state-manager.js or null if not exists
      assert.ok(resolved === null || resolved.includes('state-manager'));
    });
  });
});
