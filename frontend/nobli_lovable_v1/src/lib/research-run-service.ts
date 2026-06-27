import type { Step } from "./mock-data";

export type RunStatus = "idle" | "running" | "waiting" | "complete" | "failed";

export type ResearchRun = {
  id: string;
  task: string;
  mode: string;
  controlMode: string;
  status: RunStatus;
};

export type ResearchRunEvent =
  | {
      type: "step";
      step: Step & { gate?: boolean; gateLabel?: string; gateHint?: string };
    }
  | {
      type: "status";
      status: RunStatus;
      pausedOnStepId?: string | null;
    }
  | {
      type: "error";
      message: string;
    };

const API_BASE = (import.meta.env.VITE_RESEARCH_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:18790";

function websocketBase() {
  if (API_BASE.startsWith("https://")) return API_BASE.replace("https://", "wss://");
  if (API_BASE.startsWith("http://")) return API_BASE.replace("http://", "ws://");
  return API_BASE;
}

export async function createResearchRun(input: {
  task: string;
  mode: string;
  controlMode: string;
}): Promise<ResearchRun> {
  const response = await fetch(`${API_BASE}/api/research-runs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to create research run: ${response.status}`);
  }

  return (await response.json()) as ResearchRun;
}

export function subscribeToResearchRun(
  runId: string,
  onEvent: (event: ResearchRunEvent) => void,
  onError?: (error: Event) => void,
): () => void {
  const socket = new WebSocket(`${websocketBase()}/ws/research-runs/${runId}`);

  socket.onmessage = (message) => {
    try {
      onEvent(JSON.parse(message.data) as ResearchRunEvent);
    } catch (error) {
      onEvent({ type: "error", message: error instanceof Error ? error.message : "Invalid event" });
    }
  };
  socket.onerror = (error) => onError?.(error);

  return () => {
    socket.close();
  };
}

export async function submitResearchApproval(input: {
  runId: string;
  stepId: string;
  action: "accept" | "reject" | "ask-revision";
  selectedOpportunityId?: string;
  comment?: string;
}) {
  const response = await fetch(`${API_BASE}/api/research-runs/${input.runId}/approval`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      step_id: input.stepId,
      action: input.action,
      selected_opportunity_id: input.selectedOpportunityId,
      comment: input.comment ?? "",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit approval: ${response.status}`);
  }

  return response.json();
}

export async function sendResearchFollowUp(input: { runId: string; message: string }) {
  const response = await fetch(`${API_BASE}/api/research-runs/${input.runId}/follow-up`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: input.message }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send follow-up: ${response.status}`);
  }

  return response.json();
}
