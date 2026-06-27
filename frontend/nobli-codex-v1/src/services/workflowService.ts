import { baseWorkflowStages } from '../data/mockWorkflow';
import type { WorkflowStage } from '../types/workflow';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function getWorkflowStages(_runId: string): Promise<WorkflowStage[]> {
  return clone(baseWorkflowStages);
}
