/**
 * Quality Gates - All gate implementations
 * @module lib/utils/gates
 */

const { SecurityGate } = require('./security-gate');
const { QualityGate } = require('./quality-gate');
const { PerformanceGate } = require('./performance-gate');
const { AccessibilityGate } = require('./accessibility-gate');

module.exports = {
  SecurityGate,
  QualityGate,
  PerformanceGate,
  AccessibilityGate
};
