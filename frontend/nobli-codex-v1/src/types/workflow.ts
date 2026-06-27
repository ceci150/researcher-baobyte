import type { Conference } from './conferences';
import type { ToolBlock } from './tools';

export type ResearchMode = 'explore' | 'survey' | 'experiment' | 'write' | 'publish';
export type AgentRunStatus = 'running' | 'waiting' | 'needs-review' | 'ready';
export type WorkflowStageStatus = 'upcoming' | 'running' | 'completed' | 'waiting' | 'blocked';
export type StreamEventStatus = 'running' | 'done' | 'waiting for human' | 'needs review';
export type ControlMode = 'automation' | 'discuss';

export interface WorkflowStage {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  status: WorkflowStageStatus;
}

export interface AgentRun {
  id: string;
  taskInput: string;
  topic: string;
  mode: ResearchMode;
  startedAt: string;
  status: AgentRunStatus;
  currentStageId: string;
  usedCredits: number;
}

export interface SourceChip {
  id: string;
  label: string;
  kind: 'database' | 'paper' | 'venue' | 'file' | 'tool';
  meta?: string;
}

export interface Citation {
  id: string;
  title: string;
  authors: string;
  venue: string;
  year: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  status: 'uploaded' | 'parsing' | 'used as context' | 'needs review' | 'failed to read';
  sizeLabel: string;
  contextNote: string;
}

export interface Opportunity {
  id: string;
  title: string;
  whyNow: string;
  noveltyScore: number;
  feasibilityScore: number;
  citationMomentum: string;
  strategicFit: string;
  fitLabel: 'High potential' | 'Promising' | 'Niche' | 'Low fit';
  suggestedQuestion: string;
  possibleMethod: string;
  possibleDataset: string;
  expectedContribution: string;
}

export interface LiteratureSurveyData {
  papers: string[];
  schoolsOfThought: string[];
  researchGap: string;
  conflictingEvidence: string;
  missingCitations: string[];
  readingPath: string[];
}

export interface ExperimentDesignData {
  hypotheses: string[];
  datasets: string[];
  metrics: string[];
  executionNotes: string[];
}

export interface SituationDiagnosisData {
  strengths: string[];
  risks: string[];
  decisions: string[];
}

export interface ApprovalAction {
  id: 'accept' | 'reject' | 'ask-revision';
  label: string;
}

export interface ApprovalGate {
  id: string;
  title: string;
  summary: string;
  recommendation: string;
  actions: ApprovalAction[];
  status: 'waiting' | 'accepted' | 'rejected' | 'revision-requested';
}

export interface AbstractDraftData {
  title: string;
  abstract: string;
  contributions: string[];
  citations: string[];
}

export interface PublishAndInfluenceData {
  targetVenues: Conference[];
  deliverables: string[];
}

export interface MemoryGrowingData {
  reminders: string[];
  heuristics: string[];
}

export type OutputCard =
  | {
      kind: 'opportunities';
      title: string;
      subtitle: string;
      opportunities: Opportunity[];
    }
  | {
      kind: 'literature-survey';
      title: string;
      subtitle: string;
      data: LiteratureSurveyData;
    }
  | {
      kind: 'experiment-design';
      title: string;
      subtitle: string;
      data: ExperimentDesignData;
    }
  | {
      kind: 'situation-diagnosis';
      title: string;
      subtitle: string;
      data: SituationDiagnosisData;
    }
  | {
      kind: 'approval';
      title: string;
      subtitle: string;
      gate: ApprovalGate;
    }
  | {
      kind: 'abstract-draft';
      title: string;
      subtitle: string;
      data: AbstractDraftData;
    }
  | {
      kind: 'publish-and-influence';
      title: string;
      subtitle: string;
      data: PublishAndInfluenceData;
    }
  | {
      kind: 'memory-growing';
      title: string;
      subtitle: string;
      data: MemoryGrowingData;
    };

export interface StageTransition {
  stageId: string;
  status: WorkflowStageStatus;
}

export interface StreamEvent {
  id: string;
  stageId: string;
  elapsedMs: number;
  title: string;
  summary: string;
  status: StreamEventStatus;
  sourceChips?: SourceChip[];
  citations?: Citation[];
  toolBlocks?: ToolBlock[];
  outputCard?: OutputCard;
  stageTransitions?: StageTransition[];
  runStatus?: AgentRunStatus;
  creditDelta?: number;
}

export interface ModeConfig {
  id: ResearchMode;
  label: string;
  promptHint: string;
  exampleTasks: string[];
  voiceTranscript: string;
}
