import { WaveSize } from './config';

export type WaveStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

export interface Task {
  id: string;
  description: string;
  completed: boolean;
  waveId?: string;
}

export interface Wave {
  id: number;
  name: string;
  size: WaveSize;
  tasks: Task[];
  status: WaveStatus;
  startedAt?: number;
  completedAt?: number;
  commit?: string;
  error?: string;
}

export interface PlanWaveSummary {
  id: number;
  name: string;
  size: WaveSize;
  taskCount: number;
  status: WaveStatus;
  estimatedMinutes: number;
}

export interface PlanSummary {
  totalWaves: number;
  waves: PlanWaveSummary[];
  totalEstimatedMinutes: number;
}

export type DeviationType = 'duration_exceeded' | 'task_count_exceeded';

export interface PlanDeviation {
  wave: string;
  type: DeviationType;
  expected: number;
  actual: number;
}

export interface WaveReportEntry {
  name: string;
  size: WaveSize;
  status: WaveStatus;
  tasks: number;
  duration: number | null;
  commit?: string;
}

export interface ExecutionReport {
  summary: PlanSummary;
  waves: WaveReportEntry[];
  deviations: PlanDeviation[];
  totalDuration: number;
}
