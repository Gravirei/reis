export type DebugIssueType =
  | 'syntax-error'
  | 'logic-error'
  | 'integration-issue'
  | 'environment-issue'
  | 'performance-issue'
  | 'data-issue'
  | 'dependency-issue'
  | 'incomplete-implementation'
  | 'test-failure';

export interface IssueClassification {
  type: DebugIssueType;
  confidence: number;
  primaryCause: string;
  severity?: string;
  scope?: string;
  evidence?: string[];
}

export interface DebugPattern {
  id: string;
  name: string;
  type: DebugIssueType;
  pattern: RegExp | string;
  description: string;
  [key: string]: unknown;
}

export interface DebugSolutionStep {
  order: number;
  action: string;
  files: string[];
  details: string;
}

export interface DebugSolution {
  approach: string;
  steps: DebugSolutionStep[];
  estimatedEffort: string;
  risks?: string[];
  alternatives?: string[];
}

export interface RootCauseAnalysis {
  summary: string;
  category: string;
  contributingFactors?: string[];
  [key: string]: unknown;
}

export interface Recommendation {
  priority: string;
  action: string;
  rationale?: string;
}

export interface DebugAnalysis {
  issue: { description: string; error: string | null };
  classification: IssueClassification;
  rootCause: RootCauseAnalysis;
  solutions: DebugSolution[];
  recommendation: Recommendation;
  [key: string]: unknown;
}
