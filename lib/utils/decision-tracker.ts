/**
 * Decision Tracker
 * 
 * Tracks and manages decision history:
 * - Record decisions with full context
 * - Query decision history
 * - Revert decisions
 * - Export decision data
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface DecisionRecord {
  id: string;
  treeId: string;
  selectedPath: string[];
  metadata: Record<string, unknown>;
  context: Record<string, unknown>;
  timestamp: string;
  reverted?: boolean;
  revertReason?: string;
  [key: string]: unknown;
}

interface DecisionsFile {
  decisions: DecisionRecord[];
}

function isDecisionsFile(value: unknown): value is DecisionsFile {
  return typeof value === 'object' && value !== null && Array.isArray((value as DecisionsFile).decisions);
}

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
export function trackDecision(decision: Partial<DecisionRecord>): DecisionRecord {
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
export function getDecisions(filters: Record<string, unknown> = {}): DecisionRecord[] {
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
      
      if (filters.after && decisionDate < new Date(filters.after as string | number | Date)) {
        return false;
      }
      
      if (filters.before && decisionDate > new Date(filters.before as string | number | Date)) {
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
export function getDecisionById(id: string): DecisionRecord | null {
  const decisions = loadDecisions();
  return decisions.find(d => d.id === id) || null;
}

/**
 * Mark a decision as reverted
 * @param {string} decisionId - Decision ID
 * @param {string} [reason] - Reason for reversion
 * @returns {boolean} True if successful
 */
export function revertDecision(decisionId: string, reason: string = ''): boolean {
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
export function getDecisionHistory(treeId: string): DecisionRecord[] {
  return getDecisions({ treeId }).sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

/**
 * Get recent decisions (last N)
 * @param {number} limit - Maximum number of decisions to return
 * @returns {Array<Object>} Recent decisions
 */
export function getRecentDecisions(limit: number = 10): DecisionRecord[] {
  const decisions = loadDecisions();
  return decisions
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

/**
 * Delete a decision
 * @param {string} decisionId - Decision ID
 * @returns {boolean} True if deleted
 */
export function deleteDecision(decisionId: string): boolean {
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
export function exportToJSON(filters: Record<string, unknown> = {}): string {
  const decisions = getDecisions(filters);
  return JSON.stringify(decisions, null, 2);
}

/**
 * Export decisions to CSV
 * @param {Object} filters - Optional filters
 * @returns {string} CSV string
 */
export function exportToCSV(filters: Record<string, unknown> = {}): string {
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
export function getStatistics(): Record<string, unknown> {
  const decisions = loadDecisions();
  
  const stats = {
    total: decisions.length,
    reverted: decisions.filter(d => d.reverted).length,
    active: decisions.filter(d => !d.reverted).length,
    byTree: {} as Record<string, number>,
    byPhase: {} as Record<string, number>,
    recentCount: 0
  };
  
  // Count by tree
  decisions.forEach(d => {
    stats.byTree[d.treeId] = (stats.byTree[d.treeId] || 0) + 1;
    
    const phase = d.context.phase;
    if (phase && typeof phase === 'string') {
      stats.byPhase[phase] = (stats.byPhase[phase] || 0) + 1;
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
export function clearAllDecisions(): boolean {
  saveDecisions([]);
  return true;
}

/**
 * Load decisions from file
 * @returns {Array<Object>} Decisions array
 */
function loadDecisions(): DecisionRecord[] {
  if (!fs.existsSync(DECISIONS_FILE)) {
    return [];
  }
  
  try {
    const content = fs.readFileSync(DECISIONS_FILE, 'utf-8');
    const parsed: unknown = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed as DecisionRecord[];
    }
    if (isDecisionsFile(parsed)) {
      return parsed.decisions;
    }
    return [];
  } catch (error) {
    console.error('Error loading decisions:', error.message);
    return [];
  }
}

/**
 * Save decisions to file
 * @param {Array<Object>} decisions - Decisions to save
 */
export function saveDecisions(decisions: DecisionRecord[]): void {
  ensureDecisionsFile();
  fs.writeFileSync(DECISIONS_FILE, JSON.stringify(decisions, null, 2), 'utf-8');
}

/**
 * Ensure decisions file and directory exist
 */
export function ensureDecisionsFile(): void {
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
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
