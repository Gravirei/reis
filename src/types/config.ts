export type WaveSize = 'small' | 'medium' | 'large';

export interface WaveSizeDefinition {
  maxTasks: number;
  estimatedMinutes: number;
  description: string;
}

export type ParallelStrategy = 'dependency' | 'group' | 'auto';
export type ConflictResolution = 'fail' | 'queue' | 'merge' | 'branch';

export interface ParallelConfig {
  enabled: boolean;
  maxConcurrent: number;
  strategy: ParallelStrategy;
  conflictResolution: ConflictResolution;
  isolatedBranches: boolean;
}

export interface WavesConfig {
  defaultSize: WaveSize;
  sizes: Record<WaveSize, WaveSizeDefinition>;
  autoCheckpoint: boolean;
  continueOnError: boolean;
  parallel: ParallelConfig;
}

export interface GitConfig {
  autoCommit: boolean;
  commitMessagePrefix: string;
  requireCleanTree: boolean;
  createBranch: boolean;
  branchPrefix: string;
}

export interface StateConfig {
  trackMetrics: boolean;
  saveCheckpoints: boolean;
  maxCheckpoints: number;
}

export type LlmProvider = 'auto' | 'openai' | 'anthropic' | 'custom';

export interface LlmConfig {
  provider: LlmProvider;
  temperature: number;
  maxTokens: number;
}

export interface PlanningConfig {
  requirePlan: boolean;
  validateWaves: boolean;
  autoOptimize: boolean;
}

export interface OutputConfig {
  verbose: boolean;
  showProgress: boolean;
  colorize: boolean;
}

export type KanbanStyle = 'full' | 'compact' | 'minimal';

export interface KanbanConfig {
  enabled: boolean;
  style: KanbanStyle;
}

export type GateRunOn = 'cycle' | 'verify';

export interface GatesConfig {
  enabled: boolean;
  runOn: GateRunOn[];
  blockOnFail: boolean;
  blockOnWarning: boolean;
  timeout: number;
}

export type ReviewCheckName =
  | 'fileExists'
  | 'functionExists'
  | 'exportExists'
  | 'dependencyExists'
  | 'patternMatch';

export type ReviewChecks = Record<ReviewCheckName, boolean>;

export interface ReviewConfig {
  enabled: boolean;
  autoFix: boolean;
  strict: boolean;
  checks: ReviewChecks;
}

export interface ReisConfig {
  waves: WavesConfig;
  git: GitConfig;
  state: StateConfig;
  llm: LlmConfig;
  planning: PlanningConfig;
  output: OutputConfig;
  kanban: KanbanConfig;
  gates: GatesConfig;
  review: ReviewConfig;
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}
