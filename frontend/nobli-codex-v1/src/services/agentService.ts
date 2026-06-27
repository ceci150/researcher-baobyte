import {
  approvalAcceptedEvents,
  approvalRejectedEvents,
  approvalRevisionEvents,
  createAgentRun,
  defaultResearchTopic,
  demoTaskInput,
  initialStreamEvents,
} from '../data/mockWorkflow';
import { toolDetails } from '../data/mockTools';
import type { ToolDetail } from '../types/tools';
import type {
  AgentRun,
  ApprovalAction,
  ResearchMode,
  StreamEvent,
  UploadedFile,
} from '../types/workflow';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function startAgentRun(input: {
  taskInput?: string;
  mode: ResearchMode;
}): Promise<AgentRun> {
  const taskInput = input.taskInput?.trim() || demoTaskInput;
  return createAgentRun(input.mode, taskInput);
}

export function subscribeToAgentRun(
  _runId: string,
  onEvent: (event: StreamEvent) => void,
): () => void {
  const timers = initialStreamEvents.map((event, index) =>
    window.setTimeout(() => onEvent(clone(event)), 500 + index * 700),
  );

  return () => {
    timers.forEach((timer) => window.clearTimeout(timer));
  };
}

export async function getToolDetail(toolId: string): Promise<ToolDetail> {
  return clone(toolDetails[toolId]);
}

export async function submitApproval(input: {
  runId: string;
  eventId: string;
  action: ApprovalAction['id'];
}): Promise<{
  updatedStatus: 'accepted' | 'rejected' | 'revision-requested';
  events: StreamEvent[];
}> {
  void input.runId;
  void input.eventId;

  if (input.action === 'accept') {
    return {
      updatedStatus: 'accepted',
      events: clone(approvalAcceptedEvents),
    };
  }

  if (input.action === 'ask-revision') {
    return {
      updatedStatus: 'revision-requested',
      events: clone(approvalRevisionEvents),
    };
  }

  return {
    updatedStatus: 'rejected',
    events: clone(approvalRejectedEvents),
  };
}

export async function uploadResearchFile(
  fileLike?: File | { name?: string; type?: string },
): Promise<UploadedFile> {
  const name = fileLike?.name ?? 'vision-xai-notes.pdf';
  const type = fileLike?.type || 'application/pdf';

  return {
    id: `upload-${Date.now()}`,
    name,
    type,
    status: 'used as context',
    sizeLabel: '2.3 MB',
    contextNote: `Attached to ${defaultResearchTopic} as supporting context.`,
  };
}

export async function preparePdfExport(_runId: string): Promise<{ message: string }> {
  return { message: 'PDF prepared' };
}

export async function prepareOverleafHandoff(_runId: string): Promise<{ message: string }> {
  return { message: 'Overleaf handoff prepared' };
}

export async function sendReminderToPhone(_runId: string): Promise<{ message: string }> {
  return { message: 'Reminder sent to mobile' };
}
