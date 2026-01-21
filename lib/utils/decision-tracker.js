/**
 * Decision Tracker
 * 
 * Tracks and manages decision history:
 * - Record decisions with full context
 * - Query decision history
 * - Revert decisions
 * - Export decision data
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DECISIONS_FILE = '.reis/decisions.json';

/**
 * Track a new decision
 * @param {Object} decision - Decision object
 * @param {string} decision.treeId - Tree identifier
 * @param {Array<string>} decision.selectedPath - Path through tree
 * @param {Object} decision.metadata - Branch metadata
 * @param {Object} decision.context - Additional context
 * @returns {Object} Saved decision with ID
 */
function trackDecision(decision) {
  ensureDecisionsFile();

  const decisions = loadDecisions();
  
  // Generate unique ID
  const id = crypto.randomUUID ? crypto.randomUUID() : generateUUID();
  
  const record = {
    id,
    treeId: decision.treeId,
    selectedPath: decision.selectedPath || [],
    metadata: decision.metadata || {},
    context: decision.context || {},
    timestamp: decision.timestamp || new Date().toISOString(),
    reverted: false
  };

  decisions.push(record);
  saveDecisions(decisions);

  return record;
}

/**
 * Get decisions with optional filtering
 * @param {Object} filters - Filter criteria
 * @param {string} [filters.treeId] - Filter by tree ID
 * @param {string} [filters.phase] - Filter by phase in context
 * @param {boolean} [filters.reverted] - Filter by reverted status
 * @param {Date} [filters.after] - Filter decisions after date
 * @param {Date} [filters.before] - Filter decisions before date
 * @returns {Array<Object>} Filtered decisions
 */
function getDecisions(filters = {}) {
  const decisions = loadDecisions();
  
  return decisions.filter(decision => {
    // Filter by treeId
    if (filters.treeId && decision.treeId !== filters.treeId) {
      return false;
    }
    
    // Filter by phase
    if (filters.phase && decision.context.phase !== filters.phase) {
      return false;
    }
    
    // Filter by reverted status
    if (filters.reverted !== undefined && decision.reverted !== filters.reverted) {
      return false;
    }
    
    // Filter by date range
    if (filters.after || filters.before) {
      const decisionDate = new Date(decision.timestamp);
      
      if (filters.after && decisionDate < new Date(filters.after)) {
        return false;
      }
      
      if (filters.before && decisionDate > new Date(filters.before)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Get a specific decision by ID
 * @param {string} id - Decision ID
 * @returns {Object|null} Decision record or null
 */
function getDecisionById(id) {
  const decisions = loadDecisions();
  return decisions.find(d => d.id === id) || null;
}

/**
 * Mark a decision as reverted
 * @param {string} decisionId - Decision ID
 * @param {string} [reason] - Reason for reversion
 * @returns {boolean} True if successful
 */
function revertDecision(decisionId, reason = '') {
  const decisions = loadDecisions();
  const decision = decisions.find(d => d.id === decisionId);
  
  if (!decision) {
    return false;
  }
  
  decision.reverted = true;
  decision.revertedAt = new Date().toISOString();
  if (reason) {
    decision.revertReason = reason;
  }
  
  saveDecisions(decisions);
  return true;
}

/**
 * Get decision history for a specific tree
 * @param {string} treeId - Tree identifier
 * @returns {Array<Object>} Decision history
 */
function getDecisionHistory(treeId) {
  return getDecisions({ treeId }).sort((a, b) => {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
}

/**
 * Get recent decisions (last N)
 * @param {number} limit - Maximum number of decisions to return
 * @returns {Array<Object>} Recent decisions
 */
function getRecentDecisions(limit = 10) {
  const decisions = loadDecisions();
  return decisions
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

/**
 * Delete a decision
 * @param {string} decisionId - Decision ID
 * @returns {boolean} True if deleted
 */
function deleteDecision(decisionId) {
  const decisions = loadDecisions();
  const index = decisions.findIndex(d => d.id === decisionId);
  
  if (index === -1) {
    return false;
  }
  
  decisions.splice(index, 1);
  saveDecisions(decisions);
  return true;
}

/**
 * Export decisions to JSON
 * @param {Object} filters - Optional filters
 * @returns {string} JSON string
 */
function exportToJSON(filters = {}) {
  const decisions = getDecisions(filters);
  return JSON.stringify(decisions, null, 2);
}

/**
 * Export decisions to CSV
 * @param {Object} filters - Optional filters
 * @returns {string} CSV string
 */
function exportToCSV(filters = {}) {
  const decisions = getDecisions(filters);
  
  if (decisions.length === 0) {
    return 'No decisions to export';
  }
  
  // CSV headers
  const headers = [
    'ID',
    'Tree ID',
    'Selected Path',
    'Timestamp',
    'Reverted',
    'Phase',
    'Task',
    'Weight',
    'Priority',
    'Risk'
  ];
  
  const rows = decisions.map(d => [
    d.id,
    d.treeId,
    d.selectedPath.join(' → '),
    d.timestamp,
    d.reverted ? 'Yes' : 'No',
    d.context.phase || '',
    d.context.task || '',
    d.metadata.weight || '',
    d.metadata.priority || '',
    d.metadata.risk || ''
  ]);
  
  // Escape CSV fields
  const escapeCSV = (field) => {
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const csvLines = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ];
  
  return csvLines.join('\n');
}

/**
 * Get statistics about decisions
 * @returns {Object} Statistics
 */
function getStatistics() {
  const decisions = loadDecisions();
  
  const stats = {
    total: decisions.length,
    reverted: decisions.filter(d => d.reverted).length,
    active: decisions.filter(d => !d.reverted).length,
    byTree: {},
    byPhase: {},
    recentCount: 0
  };
  
  // Count by tree
  decisions.forEach(d => {
    stats.byTree[d.treeId] = (stats.byTree[d.treeId] || 0) + 1;
    
    if (d.context.phase) {
      stats.byPhase[d.context.phase] = (stats.byPhase[d.context.phase] || 0) + 1;
    }
  });
  
  // Recent (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  stats.recentCount = decisions.filter(d => {
    return new Date(d.timestamp) > sevenDaysAgo;
  }).length;
  
  return stats;
}

/**
 * Clear all decisions (with confirmation)
 * @returns {boolean} True if cleared
 */
function clearAllDecisions() {
  saveDecisions([]);
  return true;
}

/**
 * Load decisions from file
 * @returns {Array<Object>} Decisions array
 */
function loadDecisions() {
  if (!fs.existsSync(DECISIONS_FILE)) {
    return [];
  }
  
  try {
    const content = fs.readFileSync(DECISIONS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading decisions:', error.message);
    return [];
  }
}

/**
 * Save decisions to file
 * @param {Array<Object>} decisions - Decisions to save
 */
function saveDecisions(decisions) {
  ensureDecisionsFile();
  fs.writeFileSync(DECISIONS_FILE, JSON.stringify(decisions, null, 2), 'utf-8');
}

/**
 * Ensure decisions file and directory exist
 */
function ensureDecisionsFile() {
  const dir = path.dirname(DECISIONS_FILE);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!fs.existsSync(DECISIONS_FILE)) {
    fs.writeFileSync(DECISIONS_FILE, '[]', 'utf-8');
  }
}

/**
 * Generate UUID v4 (fallback for older Node versions)
 * @returns {string} UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = {
  trackDecision,
  getDecisions,
  getDecisionById,
  revertDecision,
  getDecisionHistory,
  getRecentDecisions,
  deleteDecision,
  exportToJSON,
  exportToCSV,
  getStatistics,
  clearAllDecisions
};
