const fs = require('fs');
const path = require('path');

/**
 * Cycle State Manager
 * Manages persistent state for REIS cycle command
 * State saved to .reis/cycle-state.json
 */

const STATE_DIR = '.reis';
const STATE_FILE = path.join(STATE_DIR, 'cycle-state.json');

/**
 * Ensure .reis directory exists
 */
function ensureStateDir() {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

/**
 * Save cycle state to disk
 * @param {Object} cycleData - Current cycle state
 * @param {number|string} cycleData.phase - Phase number or plan identifier
 * @param {string} cycleData.planPath - Path to PLAN.md file
 * @param {string} cycleData.currentState - Current state (PLANNING, EXECUTING, etc.)
 * @param {string} cycleData.startTime - ISO timestamp when cycle started
 * @param {number} cycleData.attempts - Number of debug/fix attempts
 * @param {number} cycleData.maxAttempts - Maximum allowed attempts
 * @param {Object} cycleData.options - Command-line options
 * @param {Array} cycleData.history - State transition history
 * @param {Object|null} cycleData.lastError - Last error encountered
 * @param {number} cycleData.completeness - Verification completeness percentage
 */
function saveState(cycleData) {
  try {
    ensureStateDir();
    
    // Validate required fields
    if (!cycleData.currentState) {
      throw new Error('currentState is required');
    }
    
    // Add timestamp if not present
    if (!cycleData.startTime) {
      cycleData.startTime = new Date().toISOString();
    }
    
    // Initialize defaults
    const state = {
      phase: cycleData.phase || null,
      planPath: cycleData.planPath || null,
      currentState: cycleData.currentState,
      startTime: cycleData.startTime,
      attempts: cycleData.attempts || 0,
      maxAttempts: cycleData.maxAttempts || 3,
      options: cycleData.options || {},
      history: cycleData.history || [],
      lastError: cycleData.lastError || null,
      completeness: cycleData.completeness || 0,
      lastUpdated: new Date().toISOString()
    };
    
    // Atomic write: write to temp file, then rename
    const tempFile = STATE_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), 'utf8');
    fs.renameSync(tempFile, STATE_FILE);
    
    return true;
  } catch (error) {
    console.error('Failed to save cycle state:', error.message);
    return false;
  }
}

/**
 * Load cycle state from disk
 * @returns {Object|null} Cycle state or null if not found/invalid
 */
function loadState() {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      return null;
    }
    
    const content = fs.readFileSync(STATE_FILE, 'utf8');
    const state = JSON.parse(content);
    
    // Validate state structure
    if (!state.currentState) {
      console.warn('Invalid state file: missing currentState');
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Failed to load cycle state:', error.message);
    return null;
  }
}

/**
 * Update state with new transition
 * @param {string} newState - New state name
 * @param {string} result - Result of transition ('success', 'failure', 'pending')
 * @param {string} details - Additional details about the transition
 * @param {Object} updates - Additional fields to update
 */
function updateState(newState, result = 'pending', details = '', updates = {}) {
  const state = loadState();
  
  if (!state) {
    console.error('Cannot update state: no active cycle');
    return false;
  }
  
  // Calculate duration if previous state exists
  let duration = 0;
  if (state.history.length > 0) {
    const lastTransition = state.history[state.history.length - 1];
    const lastTime = new Date(lastTransition.timestamp);
    const now = new Date();
    duration = now - lastTime;
  }
  
  // Add history entry
  state.history.push({
    state: state.currentState,
    timestamp: new Date().toISOString(),
    duration,
    result,
    details
  });
  
  // Update current state
  state.currentState = newState;
  
  // Apply additional updates
  Object.assign(state, updates);
  
  return saveState(state);
}

/**
 * Clear cycle state (on completion or user request)
 * @returns {boolean} Success status
 */
function clearState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      fs.unlinkSync(STATE_FILE);
    }
    return true;
  } catch (error) {
    console.error('Failed to clear cycle state:', error.message);
    return false;
  }
}

/**
 * Check if cycle is resumable
 * @returns {boolean} True if there's a resumable cycle
 */
function isResumable() {
  const state = loadState();
  
  if (!state) {
    return false;
  }
  
  // Can resume if state is not COMPLETE, FAILED, or IDLE
  const resumableStates = ['PLANNING', 'EXECUTING', 'VERIFYING', 'DEBUGGING', 'FIXING'];
  return resumableStates.includes(state.currentState);
}

/**
 * Get state file path (for testing or manual inspection)
 * @returns {string} Path to state file
 */
function getStateFilePath() {
  return STATE_FILE;
}

/**
 * Get current state summary (for display)
 * @returns {Object|null} Summary of current state
 */
function getStateSummary() {
  const state = loadState();
  
  if (!state) {
    return null;
  }
  
  const now = new Date();
  const start = new Date(state.startTime);
  const elapsed = Math.floor((now - start) / 1000); // seconds
  
  return {
    phase: state.phase,
    currentState: state.currentState,
    attempts: state.attempts,
    maxAttempts: state.maxAttempts,
    completeness: state.completeness,
    elapsed,
    canResume: isResumable()
  };
}

/**
 * Increment attempt counter
 * @returns {boolean} Success status
 */
function incrementAttempts() {
  const state = loadState();
  
  if (!state) {
    return false;
  }
  
  state.attempts += 1;
  return saveState(state);
}

/**
 * Check if max attempts reached
 * @returns {boolean} True if max attempts reached
 */
function isMaxAttemptsReached() {
  const state = loadState();
  
  if (!state) {
    return false;
  }
  
  return state.attempts >= state.maxAttempts;
}

/**
 * Set last error
 * @param {Error|Object} error - Error object or error details
 */
function setLastError(error) {
  const state = loadState();
  
  if (!state) {
    return false;
  }
  
  state.lastError = {
    message: error.message || String(error),
    code: error.code || 'UNKNOWN',
    stack: error.stack || null,
    timestamp: new Date().toISOString()
  };
  
  return saveState(state);
}

/**
 * Update completeness percentage
 * @param {number} completeness - Percentage (0-100)
 */
function updateCompleteness(completeness) {
  const state = loadState();
  
  if (!state) {
    return false;
  }
  
  state.completeness = Math.min(100, Math.max(0, completeness));
  return saveState(state);
}

/**
 * Set execution result
 * @param {Object} result - Execution result from subagent
 */
function setExecutionResult(result) {
  const state = loadState();
  
  if (!state) {
    return false;
  }
  
  state.executionResult = {
    success: result.success,
    output: result.output?.substring(0, 1000) || '', // Truncate to avoid huge state files
    artifacts: result.artifacts || [],
    duration: result.duration || 0,
    metadata: result.metadata || {},
    timestamp: new Date().toISOString()
  };
  
  return saveState(state);
}

/**
 * Get execution result
 * @returns {Object|null} Execution result or null
 */
function getExecutionResult() {
  const state = loadState();
  return state?.executionResult || null;
}

/**
 * Set verification result
 * @param {Object} result - Verification result
 */
function setVerificationResult(result) {
  const state = loadState();
  
  if (!state) {
    return false;
  }
  
  state.verificationResult = {
    success: result.success,
    completeness: result.completeness || 0,
    issues: result.issues || [],
    missing: result.missing || [],
    timestamp: new Date().toISOString()
  };
  
  return saveState(state);
}

/**
 * Get verification result
 * @returns {Object|null} Verification result or null
 */
function getVerificationResult() {
  const state = loadState();
  return state?.verificationResult || null;
}

module.exports = {
  saveState,
  loadState,
  updateState,
  clearState,
  isResumable,
  getStateFilePath,
  getStateSummary,
  incrementAttempts,
  isMaxAttemptsReached,
  setLastError,
  updateCompleteness,
  setExecutionResult,
  getExecutionResult,
  setVerificationResult,
  getVerificationResult
};
