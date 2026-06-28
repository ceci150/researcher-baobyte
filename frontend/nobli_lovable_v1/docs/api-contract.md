# API Contract Draft

## Scope

This document defines a first-pass backend contract for `nobli_lovable_v1` based on the current frontend implementation.

Current status:
- No business API is implemented yet.
- The app is a frontend demo driven by local state, scripted steps, and mock data.
- The TanStack Start server entry is only an SSR wrapper, not a business API layer.

Relevant frontend sources:
- `src/routes/index.tsx`
- `src/lib/script.ts`
- `src/lib/mock-data.ts`
- `src/components/AgentStream.tsx`
- `src/components/cards.tsx`
- `src/components/FinalPaperViewer.tsx`

## Current Frontend Behavior

The UI currently behaves like this:
- A user submits a research task.
- The app creates a local "run".
- Timeline steps are appended from a hardcoded `SCRIPT`.
- Each step optionally renders a typed output card such as literature, opportunities, experiment, abstract, conferences, or memory.
- The right-side paper panel is also generated locally from mock data.

Because of that, the backend should be modeled around a single `run` object with:
- run metadata
- timeline steps
- typed payloads per step
- approval actions
- final paper state

## Design Goals

The contract should:
- preserve the current UI with minimal refactor
- support polling first, streaming later
- keep step rendering type-safe
- let each step carry both a generic timeline summary and a typed output payload
- support human approval gates

## Core Domain Model

### Run

```ts
type RunStatus = "idle" | "running" | "paused" | "completed" | "failed";

type AgentMode = "Full Automation" | "Discuss";

type Run = {
  id: string;
  task: string;
  mode: AgentMode;
  status: RunStatus;
  currentStage: number;
  elapsedSec: number;
  approvedOpportunityId?: string;
  createdAt: string;
  updatedAt: string;
};
```

### Step

```ts
type StepStatus = "running" | "done" | "waiting" | "review";

type ToolBlock = {
  name: string;
  input: Record<string, unknown>;
  output: string;
  sources: string[];
  citations: string[];
  timeMs: number;
  status: StepStatus;
};

type OutputKind =
  | "literature"
  | "opportunities"
  | "approval-opportunities"
  | "experiment"
  | "iteration"
  | "abstract"
  | "publish"
  | "conferences"
  | "memory";

type Step = {
  id: string;
  stageIndex: number;
  title: string;
  summary: string;
  duration: string;
  status: StepStatus;
  gate?: boolean;
  gateLabel?: string;
  gateHint?: string;
  tool?: ToolBlock;
  sources?: string[];
  output?: {
    kind: OutputKind;
    payload?: OutputPayload;
  };
};
```

## Typed Output Payloads

### Literature

```ts
type LiteraturePaper = {
  id: string;
  title: string;
  year: number;
  venue: string;
  contribution: string;
  why: string;
  citations: number;
  relevance: number;
};

type LiteraturePayload = {
  totalRetrieved: number;
  totalDeduped: number;
  clusters: number;
  papers: LiteraturePaper[];
};
```

### Opportunities

```ts
type Opportunity = {
  id: string;
  title: string;
  rationale: string;
  whyNow: string;
  novelty: number;
  feasibility: number;
  momentum: number;
  fit: number;
  band: string;
  question: string;
  method: string;
  dataset: string;
  contribution: string;
};

type OpportunitiesPayload = {
  opportunities: Opportunity[];
};
```

### Approval Opportunities

```ts
type ApprovalOpportunitiesPayload = {
  options: Opportunity[];
  approvedId?: string;
};
```

### Experiment

```ts
type ExperimentDiagnosis = {
  label: string;
  status: "OK" | "Watch" | "Risk";
  note: string;
};

type DesignVariant = {
  id: string;
  name: string;
  desc: string;
  cost: number;
  risk: number;
  impact: number;
  time: string;
  recommended: boolean;
};

type ExperimentRisk = {
  label: string;
  severity: "low" | "med" | "high";
  mitigation: string;
};

type ExperimentPayload = {
  hypothesis: string;
  variables: string[];
  dataset: string;
  baseline: string;
  method: string;
  metric: string;
  contribution: string;
  resources: string;
  diagnosis: ExperimentDiagnosis[];
  designVariants: DesignVariant[];
  risks: ExperimentRisk[];
};
```

### Iteration

```ts
type IterationPoint = {
  x: number;
  label: string;
  y: number;
  note: string;
};

type IterationFeedback = {
  summary: string;
  suggestion: string;
  expectedGain?: number;
  confidence?: number;
};

type IterationPayload = {
  target: number;
  progressDeltaLabel: string;
  iterations: IterationPoint[];
  aiFeedback?: IterationFeedback;
};
```

### ML Blueprint / Code Artifacts

The backend already emits an `ml-agent` step before `judge-feedback`. It is not
rendered as a dedicated card yet; today it is visible through `DetailPanel` as
raw `step.tool.output` JSON. A future Code Artifacts panel should consume this
same payload instead of inventing a new endpoint.

```ts
type MlBlueprintPayload = {
  implementation_scope: string;
  files: string[];
  commands: string[];
  artifacts: string[];
  assumptions: string[];
  risks: string[];
  handoff: string;
};
```

Current source:

```ts
const mlStep = steps.find((step) => step.id === "ml-agent");
const blueprint = JSON.parse(mlStep?.tool?.output ?? "{}") as MlBlueprintPayload;
```

Expected future UI grouping:
- `files`: file tree / planned source files
- `commands`: runnable command list
- `artifacts`: expected generated outputs such as metrics, reports, figures
- `assumptions`: unresolved prerequisites before execution
- `risks`: execution or reproducibility risks
- `handoff`: concise implementation notes for a coding agent

Important current limitation: the backend does not execute code, allocate GPU,
build Docker images, or create files. This payload is a blueprint for future
code execution and artifact download surfaces.

### Abstract

```ts
type AbstractPayload = {
  styles: string[];
  currentStyle: string;
  draft: string;
  wordCount: number;
};
```

Current backend `writing-studio` output is richer than the early draft payload:

```ts
type WritingDraftPayload = {
  title: string;
  abstract: string;
  outline: string[];
  claims: string[];
  limitations: string[];
  next_writing_actions: string[];
  rationale: string;
};
```

`FinalPaperViewer` should prefer `writing-studio.tool.output` when available and
fall back to browser-synthesized mock paper content otherwise.

### Publish

```ts
type PublishPlatform = {
  name: string;
  action: string;
  status?: "idle" | "prepared" | "failed";
  url?: string;
};

type PublishPayload = {
  platforms: PublishPlatform[];
};
```

### Conferences

```ts
type ConferenceMatch = {
  name: string;
  deadline: string;
  abstract: string;
  full: string;
  notify: string;
  cameraReady: string;
  fit: number;
  format: string;
  next: string;
  url: string;
};

type ConferencesPayload = {
  conferences: ConferenceMatch[];
};
```

### Memory

```ts
type MemoryNotification = {
  id: string;
  text: string;
  kind: "people" | "deadline" | "paper" | "audit" | "citation";
};

type MemoryPayload = {
  notifications: MemoryNotification[];
};
```

### OutputPayload Union

```ts
type OutputPayload =
  | LiteraturePayload
  | OpportunitiesPayload
  | ApprovalOpportunitiesPayload
  | ExperimentPayload
  | IterationPayload
  | AbstractPayload
  | PublishPayload
  | ConferencesPayload
  | MemoryPayload;
```

## Final Paper Model

The right-side panel should ultimately stop synthesizing paper content in the browser and instead read a backend-owned paper object.

```ts
type PaperAuthor = {
  name: string;
  aff: number;
};

type PaperSection = {
  heading: string;
  body: string;
};

type PaperReference = {
  id: number;
  text: string;
};

type Paper = {
  title: string;
  authors: PaperAuthor[];
  affiliations: string[];
  abstract: string;
  keywords: string[];
  sections: PaperSection[];
  references: PaperReference[];
  latex?: string;
};
```

## Recommended Endpoints

### 1. Create run

`POST /api/runs`

Request:

```json
{
  "task": "I want to write a paper about explainable AI in computer vision and publish it in a strong venue.",
  "mode": "Full Automation"
}
```

Response:

```json
{
  "run": {
    "id": "run_001",
    "task": "I want to write a paper about explainable AI in computer vision and publish it in a strong venue.",
    "mode": "Full Automation",
    "status": "running",
    "currentStage": 0,
    "elapsedSec": 0,
    "createdAt": "2026-06-28T00:00:00Z",
    "updatedAt": "2026-06-28T00:00:00Z"
  }
}
```

### 2. Get run snapshot

`GET /api/runs/:runId`

Response:

```json
{
  "run": {
    "id": "run_001",
    "task": "I want to write a paper about explainable AI in computer vision and publish it in a strong venue.",
    "mode": "Full Automation",
    "status": "paused",
    "currentStage": 1,
    "elapsedSec": 28,
    "approvedOpportunityId": null,
    "createdAt": "2026-06-28T00:00:00Z",
    "updatedAt": "2026-06-28T00:00:28Z"
  },
  "steps": [],
  "paper": null
}
```

### 3. Approve a gate

`POST /api/runs/:runId/approve`

Request:

```json
{
  "stepId": "s5",
  "choiceId": "o1"
}
```

Notes:
- `choiceId` is optional for generic approval gates.
- `choiceId` is required when the user is selecting one opportunity or one design variant.

Response:

```json
{
  "ok": true,
  "run": {
    "id": "run_001",
    "status": "running",
    "approvedOpportunityId": "o1"
  }
}
```

### 4. Run action

`POST /api/runs/:runId/actions`

Request:

```json
{
  "stepId": "s7",
  "action": "request_revision",
  "payload": {
    "comment": "Need a stronger baseline comparison."
  }
}
```

Allowed `action` values for the current UI:
- `approve`
- `reject`
- `request_revision`
- `discuss`
- `select_option`
- `prepare_platform`
- `send_memory_digest`

### 5. Run stream

`GET /api/runs/:runId/stream`

Recommended transport:
- SSE first
- websocket only if bidirectional live edits become necessary

Suggested event types:
- `run.updated`
- `step.created`
- `step.updated`
- `paper.updated`
- `approval.required`
- `run.completed`
- `run.failed`

Example SSE event:

```text
event: step.created
data: {"runId":"run_001","step":{"id":"s2","stageIndex":1,"title":"Searching arXiv, Semantic Scholar, Papers with Code","status":"review"}}
```

## Aggregate Response Shape

If the frontend wants one polling endpoint only, use this shape:

```ts
type RunSnapshotResponse = {
  run: Run;
  steps: Step[];
  paper: Paper | null;
};
```

## Suggested Frontend Mapping

Minimal integration path:
- Replace local `SCRIPT` scheduling with `POST /api/runs` plus `GET /api/runs/:id` or SSE.
- Replace hardcoded cards data with `step.output.payload`.
- Replace local approval handlers with `POST /api/runs/:id/approve`.
- Replace local paper generation with backend `paper`.

## What Can Stay Frontend-Only

These do not need backend ownership on day one:
- purely visual open/close state
- selected tab in the paper viewer
- local scroll position
- temporary toast state

These should move to backend:
- timeline steps
- tool execution details
- literature/opportunity/experiment results
- approval decisions
- final paper content
- publication package state

## Versioning

Recommended:
- keep URL stable as `/api/...`
- version in header first, for example `X-API-Version: 1`
- only move to `/api/v2/...` when the payload model changes materially

## Open Questions

Before backend implementation, confirm:
- Is one `run` always tied to one user?
- Do steps need stable ordering fields beyond array order?
- Should approvals be auditable with actor and timestamp?
- Is the paper a projection of steps, or an independently editable document?
- Do we need optimistic UI for approval buttons?

## Recommended Next Step

Implement the smallest usable contract first:
1. `POST /api/runs`
2. `GET /api/runs/:runId`
3. `POST /api/runs/:runId/approve`
4. optional `GET /api/runs/:runId/stream`

That is enough to replace the current scripted demo flow without redesigning the UI.

## Runtime Experiment Artifacts

The current Research Claw gateway exposes real workspace artifacts separately from the ML blueprint.

Endpoints:

- `GET /api/research-artifacts?project_id=SamplingStudy`
- `GET /api/research-artifacts/file?project_id=SamplingStudy&path=code/results.json`
- `GET /api/research-artifacts/archive?project_id=SamplingStudy`

The ML Agent step also includes the same payload as `step.artifacts` when the workflow reaches `ml-agent`.

```ts
type ExperimentArtifacts = {
  found: boolean;
  projectId?: string;
  root?: string;
  lastModified?: number;
  resultsPath?: string;
  results?: unknown;
  archiveUrl?: string;
  codeFiles: Array<{
    path: string;
    size?: number;
    url?: string;
    snippet?: string;
  }>;
  figures: Array<{
    path: string;
    size?: number;
    url?: string;
  }>;
  pdfs: Array<{
    path: string;
    size?: number;
    url?: string;
  }>;
  message?: string;
};
```

Frontend behavior:

- If `found === true`, render the Code Artifacts panel from `codeFiles`, `results`, `figures`, and `pdfs`.
- If `archiveUrl` is present, expose one package download containing code, results, figures, and paper PDFs.
- If `found === false`, show blueprint-only status and do not render synthetic experiment metrics.
- Judge feedback currently reviews the ML blueprint. It should only be treated as a review of completed experiments when `step.artifacts.found === true` and a metric mapper has converted `results.json` into a specific plotted series.
