export type CycleStateName =
  | 'IDLE'
  | 'RESEARCHING'
  | 'PLANNING'
  | 'REVIEWING'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'GATING'
  | 'DEBUGGING'
  | 'FIXING'
  | 'COMPLETE'
  | 'FAILED';

export const RESUMABLE_STATES: CycleStateName[] = [
  'RESEARCHING',
  'PLANNING',
  'REVIEWING',
  'EXECUTING',
  'VERIFYING',
  'GATING',
  'DEBUGGING',
  'FIXING'
];

export type TransitionResult = 'success' | 'failure' | 'pending';

export interface StateTransition {
  from: CycleStateName | null;
  to: CycleStateName;
  result: TransitionResult;
  timestamp: string;
}

export interface CycleState {
  phase: string | number | null;
  planPath: string | null;
  currentState: CycleStateName;
  startTime: string;
  attempts: number;
  maxAttempts: number;
  options: Record<string, unknown>;
  history: StateTransition[];
  lastError: { message: string; state?: CycleStateName; timestamp?: string } | null;
  completeness: number;
  lastUpdated: string;
  gateResult: unknown;
  executionResult: unknown;
  verificationResult: unknown;
}

export function isResumable(state: CycleState): boolean {
  return RESUMABLE_STATES.includes(state.currentState);
}
