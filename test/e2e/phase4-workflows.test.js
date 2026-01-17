/**
 * Phase 4 End-to-End Workflow Tests
 * Complete project lifecycle with Phase 4 features (visualizer, analyze)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const StateManager = require('../../lib/utils/state-manager');
const MetricsTracker = require('../../lib/utils/metrics-tracker').MetricsTracker;
const { loadConfig } = require('../../lib/utils/config');
const { createBarChart, createProgressBar } = require('../../lib/utils/visualizer');

describe('Phase 4 E2E Workflow Tests', function() {
  this.timeout(20000);
  
  let testRoot;
  let originalCwd;

  beforeEach(() => {
    testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'reis-phase4-e2e-'));
    originalCwd = process.cwd();
    process.chdir(testRoot);
    
    // Initialize git repo
    execSync('git init', { stdio: 'pipe' });
    execSync('git config user.email "test@reis.dev"', { stdio: 'pipe' });
    execSync('git config user.name "REIS Test"', { stdio: 'pipe' });
    
    // Create .planning structure
    fs.mkdirSync('.planning', { recursive: true });
    fs.mkdirSync('.planning/phases', { recursive: true });
    
    // Initial commit
    fs.writeFileSync('README.md', '# Test Project\n', 'utf8');
    execSync('git add .', { stdio: 'pipe' });
    execSync('git commit -m "Initial commit"', { stdio: 'pipe' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(testRoot)) {
      fs.rmSync(testRoot, { recursive: true, force: true });
    }
  });

  // Helper functions
  function createPlanMD(waves) {
    let plan = `# Test Plan\n\n`;
    waves.forEach((wave, i) => {
      plan += `## Wave ${i + 1}: ${wave.name}\n`;
      plan += `Size: ${wave.size || 'medium'}\n`;
      plan += `Dependencies: ${wave.deps || 'none'}\n\n`;
      plan += `### Tasks\n`;
      for (let t = 0; t < (wave.taskCount || 3); t++) {
        plan += `- Task ${t + 1}: ${wave.name} task ${t + 1}\n`;
      }
      plan += `\n`;
    });
    return plan;
  }

  function createRoadmapMD(phases) {
    let roadmap = `# Project Roadmap\n\n`;
    phases.forEach((phase, i) => {
      roadmap += `## Phase ${i + 1}: ${phase.name}\n`;
      roadmap += `Waves: ${phase.waveCount}\n`;
      roadmap += `Description: ${phase.description || 'Phase description'}\n\n`;
    });
    return roadmap;
  }

  function executeWave(waveNum, waveName, success = true) {
    const stateManager = new StateManager(testRoot);
    const state = stateManager.loadState();
    
    // Mark wave as started
    if (!state.activeWave) {
      state.activeWave = { number: waveNum, name: waveName, startedAt: new Date().toISOString() };
    }
    
    // Create test file for this wave
    fs.writeFileSync(`wave${waveNum}.txt`, `Wave ${waveNum} output\n`, 'utf8');
    execSync('git add .', { stdio: 'pipe' });
    
    if (success) {
      // Complete wave successfully
      state.completedWaves = state.completedWaves || [];
      state.completedWaves.push({
        number: waveNum,
        name: waveName,
        completedAt: new Date().toISOString()
      });
      delete state.activeWave;
      
      // Create commit
      execSync(`git commit -m "feat: complete wave ${waveNum} - ${waveName}"`, { stdio: 'pipe' });
    } else {
      // Mark as failed
      state.failedWaves = state.failedWaves || [];
      state.failedWaves.push({
        number: waveNum,
        name: waveName,
        failedAt: new Date().toISOString(),
        error: 'Simulated failure'
      });
    }
    
    stateManager.state = state;
    stateManager.saveState();
    
    return state;
  }

  // Tests will be added below
});
