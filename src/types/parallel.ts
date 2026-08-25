import { WaveStatus } from './plan';

export interface TrackedWaveState {
  id: string;
  name: string;
  status: WaveStatus;
  batchId?: string;
  startTime?: number;
  endTime?: number;
  error?: string;
}

export interface WaveBatch {
  id: string;
  waveIds: string[];
  startTime?: number;
  endTime?: number;
}

export interface ParallelHistoryEntry {
  timestamp: string;
  event: string;
  waveId?: string;
  details?: Record<string, unknown>;
}

export interface ParallelStateJSON {
  waves: [string, TrackedWaveState][];
  batches: [string, WaveBatch][];
  currentBatchId: string | null;
  history: ParallelHistoryEntry[];
  executionStartTime: number | null;
  executionEndTime: number | null;
  isExecuting: boolean;
  savedAt: string;
}

export interface ParallelWavesSummary {
  total: number;
  running: number;
  completed: number;
  failed: number;
  pending: number;
}

export interface ParallelBatchesSummary {
  total: number;
  current: string | null;
}

export interface ParallelTimingSummary {
  startTime: number | null;
  endTime: number | null;
  totalDuration: number | null;
  averageWaveDuration: number | null;
}

export interface ParallelStatusSummary {
  waves: ParallelWavesSummary;
  batches: ParallelBatchesSummary;
  timing: ParallelTimingSummary;
  efficiency: number;
  failedWaves: { id: string; error?: string }[];
  historyEntries: number;
}

export type SchedulerStatus = {
  total: number;
  completed: number;
  failed: number;
  running: number;
  pending: number;
  progress: number;
};
