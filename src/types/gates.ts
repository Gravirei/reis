export type GateCategory = 'security' | 'quality' | 'performance' | 'accessibility';

export type GateStatus =
  | 'pending'
  | 'running'
  | 'passed'
  | 'warning'
  | 'failed'
  | 'skipped'
  | 'error';

export interface GateCheckDetail {
  name: string;
  status: GateStatus;
  message: string;
  [key: string]: unknown;
}

export interface SerializedGateResult {
  gateName: string;
  category: GateCategory;
  status: GateStatus;
  message: string;
  details: GateCheckDetail[];
  duration: number;
  timestamp: string | null;
  error: string | null;
}
