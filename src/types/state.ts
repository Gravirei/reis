export interface ActiveWaveInfo {
  name: string;
  status: string;
  started: string;
  items: number;
  progress: {
    completed: number;
    total: number;
  };
}

export interface CompletedWaveEntry {
  name: string;
  completed: string;
  commit: string | null;
  duration?: string;
}

export interface CheckpointEntry {
  name: string;
  timestamp: string;
  commit: string | null;
  wave: string | null;
}

export interface StateMetrics {
  totalWaves: number;
  completedWaves: number;
  successRate: number;
  averageDuration: number;
}

export interface ReisState {
  currentPhase: string | null;
  activeWave: ActiveWaveInfo | null;
  waves: {
    current: string | null;
    completed: CompletedWaveEntry[];
    total: number;
  };
  checkpoints: CheckpointEntry[];
  metrics: StateMetrics;
  recentActivity: string[];
  nextSteps: string[];
  blockers: string[];
  notes: string[];
}
