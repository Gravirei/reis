export type DebugIssueType =
  | 'syntax-error'
  | 'logic-error'
  | 'integration-issue'
  | 'environment-issue'
  | 'performance-issue'
  | 'data-issue'
  | 'dependency-issue';

export interface DebugIssueContext {
  recentChanges?: string[];
  affectedFiles?: string[];
  symptoms?: string[];
  lastWorkingCommit?: string;
  environment?: string;
  metrics?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DebugIssue {
  description: string;
  error: string | null;
  context: DebugIssueContext;
}

export interface IssueClassification {
  type: DebugIssueType;
  confidence: number;
  primaryCause: string;
}

export interface FixStep {
  order: number;
  description: string;
  files: string[];
}

export interface FixPlan {
  issueType: DebugIssueType;
  summary: string;
  steps: FixStep[];
  estimatedMinutes: number;
}
