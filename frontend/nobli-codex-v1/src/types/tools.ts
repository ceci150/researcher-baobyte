import type { Citation, SourceChip } from './workflow';

export type ToolStatus = 'running' | 'done' | 'waiting' | 'needs-review';

export interface ToolBlock {
  id: string;
  toolId: string;
  label: string;
  summary: string;
  status: ToolStatus;
  timeUsedLabel: string;
}

export interface ToolDetail {
  id: string;
  name: string;
  status: ToolStatus;
  timeUsedLabel: string;
  inputPreview: unknown;
  outputPreview: unknown;
  sources: SourceChip[];
  citations: Citation[];
}
