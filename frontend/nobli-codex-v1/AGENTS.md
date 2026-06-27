# AGENTS.md

## Purpose

This file provides frontend-only implementation instructions for AI coding agents working on Nobli.

Nobli is a frontend prototype for an agentic research scientist workspace. The goal is to create a stable, believable hackathon demo that feels like an AI research agent is actively working through a research workflow.

This file governs frontend behavior, UI structure, typed data contracts, mock interactions, service-layer boundaries, and implementation priorities.

It does not define backend architecture. It does not require real backend agents. It does require the frontend to be backend-ready.

For all visual and interaction styling, follow `design_system.md` as the visual source of truth.

---

## Product Summary

Nobli is a Lemma / Manus-style agentic workspace for AI research scientists.

The user gives a research goal through text, voice, or uploaded files. The interface then simulates an end-to-end research workflow:

1. Idea Discovery
2. Literature Survey
3. Experiment Design
4. Iteration & Feedback
5. Writing Studio
6. Publish & Influence
7. Memory & Growing

The product should feel process-driven, automated, streaming, and alive.

The final experience should communicate:

> This is not a research dashboard. This is an AI research scientist operating system that can autonomously move a researcher from idea to experiment to writing to publishing, while keeping the human in control.

---

## Frontend Scope

Build a React + TypeScript frontend prototype that is frontend-first, mock-first, and backend-ready.

Use:

- React
- TypeScript
- Reusable components
- Centralized mock JSON data for the initial demo
- Local frontend state for simulated agent progress
- Simulated streaming
- Simulated timestamps
- Simulated tool calls
- Simulated progress updates
- Simulated approval gates
- Replaceable service functions for future backend integration
- Clear TypeScript interfaces for frontend-backend data contracts

Do not:

- Put backend business logic directly inside React components.
- Hard-code workflow content across unrelated JSX components.
- Scatter mock data inside UI components.
- Make real API calls unless API contracts are explicitly provided.
- Add authentication, database persistence, or production infrastructure unless explicitly requested.
- Overengineer the architecture before the demo workflow is stable.
- Build disconnected static module pages.
- Turn the product into a generic SaaS dashboard.

Backend-ready rule:

- Use mock data by default.
- Route all workflow data through service functions.
- Keep components typed and data-driven.
- Make it possible to replace mock service functions with real backend API calls later without rewriting UI components.

---

## Required App States

The prototype has two major states.

---

## State 1: Home / New Task Input Screen

This is the first screen before the researcher submits a task.

The home screen should feel clean, focused, and minimal.

### Required Layout

Use:

- Left sidebar
- Main center input area
- Example task cards below input

### Left Sidebar

Include:

- Logo: `Nobli`
- Home
- New task
- All tasks
- My Papers
- Experiments
- Writing Drafts
- Conference Watch
- Memory & Growing
- Settings
- Bottom user avatar
- Credits / usage status

### Main Center Area

Headline:

```txt
Stay in the flow. Let research move.
```

Mode tabs:

- Explore
- Survey
- Experiment
- Write
- Publish

Large input placeholder:

```txt
Ask Nobli to explore, design, write, or publish your research…
```

Input box must include:

- Text input
- Microphone icon
- Upload file icon
- Plus icon
- Send button

Example task cards:

- Find emerging research opportunities in interpretable AI for computer vision.
- Design an experiment for testing reasoning models.
- Draft an abstract from my notes and experiment results.
- Find upcoming conferences for this paper.
- Prepare an OpenReview submission package.

### Home Screen Rules

Do:

- Keep it extremely clean.
- Use lots of whitespace.
- Make the input feel like the starting point of an agent workflow.
- Keep example task cards compact.

Do not:

- Create a marketing hero landing page.
- Add generic feature sections.
- Add large dashboard widgets.
- Add colorful gradients.
- Add fake analytics cards.

---

## State 2: Running Agent Workspace

After the user submits a task, transition to a running workspace.

The running workspace must feel like an agent is actively working.

Use a 3-column Lemma-style layout:

1. Task Sidebar
2. Main Agent Workspace
3. Detail / Tool Panel

---

## Column 1: Task Sidebar

The left sidebar stays visible in the running state.

Include:

- Logo
- Home
- New task
- All tasks
- Current task highlighted
- Task history
- Credits
- User profile

Rules:

- Keep sidebar compact.
- Do not add complex navigation.
- Current task should be visually highlighted.
- Sidebar should support demo storytelling, not become the main focus.

---

## Column 2: Main Agent Workspace

This is the central workspace where the agent’s work appears.

### Top Area

Include:

- Current mode: Explore / Survey / Experiment / Write / Publish
- Used credits indicator
- Process bar
- Time elapsed
- Current task status

### Process Bar

The process bar must show:

1. Idea Discovery
2. Literature Survey
3. Experiment Design
4. Iteration & Feedback
5. Writing Studio
6. Publish & Influence
7. Memory & Growing

The process bar should show:

- Current stage
- Completed stages
- Next stage
- Time elapsed
- Current task status

Rules:

- Clicking a process stage should jump the main stream to the relevant section.
- Active and completed stages should visibly differ from inactive stages.
- Use the styling from `design_system.md`.

---

## Main Stream

The central stream is the heart of the product.

Show agent activity as a vertical timeline with timestamps.

Example stream items:

```txt
Worked for 12s
Understanding research goal

Worked for 28s
Searching arXiv, Semantic Scholar, Papers with Code

Worked for 51s
Extracting research gaps

Worked for 1m 20s
Generating emerging research opportunities

Worked for 1m 42s
Waiting for human approval
```

Each stream step should include:

- Timestamp or worked duration
- Status pill
- Short reasoning summary
- Source chips when relevant
- Clickable tool blocks when relevant

Status pill examples:

- running
- done
- waiting for human
- needs review

Rules:

- Render output cards inside the stream.
- Do not make output modules separate static pages.
- The stream should progressively reveal work.
- Use loading states and simulated streaming.
- Make the user feel the agent is actively working.

---

## Output Cards Inside Stream

Output cards may include:

- Literature report card
- Emerging opportunities table
- Experiment plan card
- AutoResearch progress chart
- Abstract draft editor
- Conference monitor card
- PDF preview card
- Overleaf handoff card
- Approval panel

Rules:

- Output cards must appear as part of the workflow.
- Do not create disconnected module pages.
- Do not place all cards side by side with equal weight.
- Give priority to the current task.

---

## Bottom Follow-up Input

At the bottom of the main workspace, include a small input box.

Placeholder:

```txt
Discover more / Ask follow-up…
```

Include:

- Upload icon
- Microphone icon
- Send button

Rules:

- This input is for follow-up during the running task.
- It should feel secondary to the main stream.
- It should remain accessible during the demo.

---

## Column 3: Detail / Tool Panel

The right panel shows the selected tool block details.

Header:

```txt
Detail
```

When no block is selected, show:

```txt
Click a tool block to view the full information.
```

When a tool block is clicked, show:

- Tool name
- Input JSON-like preview
- Output / result preview
- Sources
- Citations
- Status
- Time used

Example tools:

- Literature Scraper
- Paper Ranker
- Novelty Scorer
- Experiment Designer
- Situation Diagnoser
- Abstract Writer
- Conference Monitor
- Memory Tracker
- Opportunity Ranker
- Paper Clusterer
- Gap Extractor

Rules:

- Tool blocks in the main stream must be clickable.
- Clicking a tool block updates the right detail panel.
- Do not open a new page for tool details.
- Use realistic JSON-like previews but keep them readable.

---

## Persistent Research Agent Control

Add a floating or bottom-right agent control area in the running workspace.

It must include:

- Research Agent status: live
- Mode toggle:
  - Full Automation
  - Discuss
- Voice input
- Text input
- Upload file
- Drag and drop paper
- Send button

### Behavior

Full Automation mode:

- Agent continues the workflow automatically.
- Agent only pauses at approval gates.

Discuss mode:

- Agent asks clarifying questions before major steps.
- Status text should visibly change.

Rules:

- The mode toggle must work.
- Toggling mode must update the status text.
- Voice and upload interactions may be simulated.

---

## Core Demo Task

Use this as the default sample command:

```txt
I want to write a paper about explainable AI in computer vision and publish it in a strong venue.
```

After this command, simulate an end-to-end agent run.

Use mock data, but make it feel real and dynamic.

The demo should include:

- Simulated streaming
- Loading states
- Progress changes
- Timestamps
- Citations as source chips
- Human approval gates
- Realistic research outputs

---

## Workflow Content Requirements

### Idea Discovery

Use the title:

```txt
Emerging Research Opportunities
```

Do not use:

```txt
AHA Moment Radar
```

Generate:

- Ranked emerging research directions
- Short explanation
- Why now
- Novelty score
- Feasibility score
- Citation momentum
- Strategic fit
- Suggested research question
- Possible method
- Possible dataset
- Expected contribution

Display as:

- Ranked table
- Compact opportunity cards
- Source chips: arXiv, Semantic Scholar, Papers with Code
- Score pills:
  - High potential
  - Promising
  - Niche
  - Low fit

Add tool block:

```txt
Opportunity Ranker
```

---

### Literature Survey

Generate a concise literature survey.

Show:

- Key papers
- Schools of thought
- Research gap
- Conflicting evidence
- Missing citations
- Recommended reading path

Each paper card includes:

- Title
- Year
- Venue
- One-line contribution
- Why it matters
- Citation chip
- Relevance score

Add tool blocks:

- Literature Scraper
- Paper Clusterer
- Gap Extractor

---

### Experiment Design

Create an experiment planning workspace.

Show:

- Hypothesis
- Variables
- Dataset
- Baseline
- Method
- Evaluation metric
- Expected contribution
- Required resources

Use the title:

```txt
Situation Diagnosis
```

Situation Diagnosis includes:

- Data situation
- Method situation
- Reproducibility situation
- Compute situation
- Ethics situation
- Publication situation

Rules:

- Display Situation Diagnosis as serious diagnostic cards.
- Do not make them warning-style risk cards.

---

### Iteration & Feedback

Show an end-to-end loop:

```txt
Version 1 → AI Feedback → Human Revision → Version 2 → Improved Result
```

AI Feedback on Version 1 must include:

- Reasoning
- Citations
- Suggested change
- Expected impact
- Confidence level

Human-in-the-loop approval panel buttons:

- Accept
- Reject
- Ask for revision
- Discuss with agent

Add an AutoResearch progress chart:

- x-axis: number of experiments
- y-axis: progress toward research objective
- Connected line with experiment iterations
- Labels: Exp 1, Exp 2, Exp 3, Exp 4
- Target threshold line
- Badge: objective progress +34%

Rules:

- The chart may use mock data.
- The approval buttons must update the timeline.

---

### Writing Studio

Support:

- Draft my abstract
- Draft introduction
- Improve storytelling
- Generate paper outline
- Export to Overleaf
- Export to PDF

When user selects `Draft my abstract`:

Ask the user to upload:

- Paper notes
- Experiment results
- Draft

Show:

- Upload icon
- Plus icon
- Drag-and-drop area

Ask abstract style through selectable chips:

- Concise conference abstract
- Nature-style abstract
- Technical abstract
- Storytelling abstract
- Grant-style abstract
- Other

Generate abstract draft in an editor.

Add paragraph-level approval:

- Approve paragraph
- Rewrite more academic
- Make clearer
- Add stronger hook
- Shorten

Show final export options:

- PDF preview
- Overleaf handoff
- LaTeX source

Rules:

- The abstract editor should look like a serious writing workspace.
- Do not make it look like a simple plain textarea.

---

### Publish & Influence

Create a research launchpad.

Platform cards:

- arXiv
- OpenReview
- GitHub
- Overleaf
- Personal academic website

Actions:

- Prepare arXiv package
- Prepare OpenReview submission
- Generate GitHub README
- Generate talk proposal
- Generate reviewer response checklist

Conference monitoring section title:

```txt
Incoming Conferences
```

Each conference card includes:

- Conference name
- Deadline
- Submission requirements
- Official website link
- Relevance score
- Suggested fit
- Required paper format
- Recommended next action

Add timeline:

- Upcoming deadline
- Abstract deadline
- Full paper deadline
- Notification date
- Camera-ready deadline

---

### Memory & Growing

Use the title:

```txt
Memory & Growing
```

Track:

- Researchers to connect with
- Papers to read
- Labs working on similar problems
- People who cited the user
- People who should have cited the user but did not
- Relevant conferences
- Weekly learning reminders

Show mobile-style notifications:

- Connect with Dr. Lee — working on highly related interpretable AI methods.
- Workshop deadline in 12 days.
- A new paper strongly overlaps with your method.
- Your experiment still has one unresolved reproducibility issue.

Add button:

```txt
Send to phone
```

On click, show mock success state:

```txt
Reminder sent to mobile.
```

---

## Required Clickable Interactions

The following interactions must work in the prototype:

1. Submit home input → transition to running workspace.
2. Click process bar stages → main stream jumps to relevant section.
3. Click tool block → right Detail panel updates.
4. Toggle Full Automation / Discuss → status changes.
5. Click upload icon → show drag-and-drop state.
6. Click microphone icon → show `listening…` and fake transcript.
7. Click Accept / Reject / Ask revision → timeline updates.
8. Click Export PDF → show `PDF prepared`.
9. Click Overleaf → show `Overleaf handoff prepared`.
10. Click Send to phone → show `Reminder sent to mobile`.

---

## Mock Data Requirements

Use mock data for all demo research content.

Default research topic:

```txt
Explainable AI in computer vision
```

Example papers:

- Concept Bottleneck Models for Interpretable Vision
- Prototype-based Explanations for Visual Recognition
- Faithfulness Evaluation in Vision Explainability
- Attribution Methods under Distribution Shift

Example emerging opportunities:

- Evaluation-first explainability benchmarks
- Citation lineage and controversy maps
- Human-centered explanation preference modeling
- Reproducibility-first XAI experiment protocols

Example conferences:

- NeurIPS
- ICML
- ICLR
- CVPR
- ICCV
- CHI
- FAccT

---

## Backend Integration Readiness

The frontend should be mock-first but backend-ready.

All mock data must be centralized under `src/data/`.

All data access must go through service functions under `src/services/`.

React components must not directly hard-code workflow data, tool results, paper data, conference data, or agent stream content.

Define TypeScript interfaces under `src/types/` for:

- WorkflowStage
- AgentRun
- StreamEvent
- ToolBlock
- ToolDetail
- SourceChip
- Citation
- ApprovalGate
- OutputCard
- UploadedFile
- Conference
- Paper
- AgentMode
- AgentStatus
- FileStatus

Service functions should be written so mock implementations can later be replaced by real backend API calls without rewriting UI components.

Do not implement backend logic inside frontend components.

Do not assume backend response shapes unless they are defined in `src/types/`.

---

## Data Flow Rule

Use this data flow for all demo and future backend integration:

```txt
UI Component → service function → mock data now / backend API later
```

Do not use this pattern:

```txt
UI Component → hard-coded mock text inside JSX
```

Components should receive typed props and render data.

Services should provide data and handle simulated actions.

Mock data files should store the actual demo content.

---

## Recommended Project Structure

Use React and TypeScript.

Recommended structure:

```txt
src/
  components/
    Sidebar.tsx
    HomeInput.tsx
    ModeTabs.tsx
    RunningWorkspace.tsx
    ProcessBar.tsx
    AgentStream.tsx
    StreamItem.tsx
    ToolBlock.tsx
    DetailPanel.tsx
    AgentControl.tsx
    OutputCards/
      OpportunityCard.tsx
      LiteratureReportCard.tsx
      ExperimentPlanCard.tsx
      AutoResearchChart.tsx
      AbstractEditorCard.tsx
      ConferenceMonitorCard.tsx
      PdfPreviewCard.tsx
      ApprovalPanel.tsx
  data/
    mockWorkflow.ts
    mockStreamEvents.ts
    mockTools.ts
    mockPapers.ts
    mockConferences.ts
    mockFiles.ts
  services/
    agentService.ts
    workflowService.ts
    toolService.ts
    uploadService.ts
  types/
    workflow.ts
    stream.ts
    tools.ts
    papers.ts
    conferences.ts
    files.ts
  styles/
    tokens.css
    globals.css
```

Rules:

- Use reusable components.
- Use centralized mock JSON data for demo content.
- Keep mock data centralized.
- Use local frontend state for demo interactions.
- Route all workflow data through service functions, even if those functions currently return mock data.
- Define clear TypeScript types for data contracts.
- Keep the implementation stable and easy to connect to a backend later.
- Avoid unnecessary dependencies.
- Avoid overengineering.
- Prioritize demo clarity, product story, and frontend-backend handoff readiness.

---

## Service Function Requirements

Create service functions that can be mocked now and replaced later.

Recommended service functions:

```ts
startAgentRun(input: StartAgentRunInput): Promise<AgentRun>
getWorkflowStages(runId: string): Promise<WorkflowStage[]>
getInitialStreamEvents(runId: string): Promise<StreamEvent[]>
subscribeToAgentRun(runId: string, onEvent: (event: StreamEvent) => void): () => void
getToolDetail(toolId: string): Promise<ToolDetail>
submitApproval(input: SubmitApprovalInput): Promise<StreamEvent>
setAgentMode(runId: string, mode: AgentMode): Promise<AgentRun>
uploadFile(file: File): Promise<UploadedFile>
preparePdfExport(runId: string): Promise<OutputCard>
prepareOverleafHandoff(runId: string): Promise<OutputCard>
sendMobileReminder(input: SendReminderInput): Promise<{ status: "sent" }>
```

Current implementation may return mock promises and use timers.

Future implementation may replace the internals with real API calls.

UI components should not care whether the service is mocked or real.

---

## Suggested Type Contracts

Define typed contracts before building UI-heavy components.

Example:

```ts
export type AgentStatus = "running" | "done" | "waiting_for_human" | "needs_review";

export type AgentMode = "full_automation" | "discuss";

export type FileStatus = "selected" | "uploading" | "parsing" | "ready" | "failed" | "used_as_context";

export interface SourceChip {
  id: string;
  label: string;
  type: "arxiv" | "semantic_scholar" | "papers_with_code" | "openreview" | "github" | "pdf" | "other";
  url?: string;
}

export interface ToolBlock {
  id: string;
  name: string;
  status: AgentStatus;
  summary: string;
  timeUsed?: string;
}

export interface StreamEvent {
  id: string;
  stageId: string;
  title: string;
  summary: string;
  durationLabel: string;
  status: AgentStatus;
  sourceChips?: SourceChip[];
  toolBlocks?: ToolBlock[];
  outputCardId?: string;
  approvalGateId?: string;
}

export interface WorkflowStage {
  id: string;
  title: string;
  status: "completed" | "current" | "next" | "inactive";
  elapsedLabel?: string;
}

export interface AgentRun {
  id: string;
  task: string;
  mode: AgentMode;
  status: AgentStatus;
  currentStageId: string;
  elapsedLabel: string;
  usedCredits: number;
}
```

Add more interfaces as needed, but keep contracts simple and stable.

---

## Streaming Simulation Rule

Do not place streaming timers directly inside deeply nested UI components.

Preferred approach:

- Put streaming simulation in `agentService.ts` or `workflowService.ts`.
- Components subscribe to events and render typed stream items.
- Mock streaming should be easy to replace with SSE, WebSocket, polling, or HTTP streaming later.

Service-level mock example:

```ts
subscribeToAgentRun(runId, onEvent)
```

Current behavior:

- Uses mock timers.
- Emits predefined stream events progressively.
- Updates progress and output cards.

Future behavior:

- Connects to backend streaming endpoint.
- Receives real agent events.
- Keeps the same UI rendering layer.

---

## Upload Interaction Rule

File upload may be simulated, but it must use backend-ready file states.

Use statuses such as:

- selected
- uploading
- parsing
- ready
- failed
- used_as_context

Upload UI should show:

- Filename
- File type
- Status
- Whether the file is used as context

Do not treat upload as only a decorative icon.

---

## Approval Gate Rule

Approval actions must go through a service function.

Do not directly mutate UI-only status in the component without a service boundary.

Use a service action such as:

```ts
submitApproval({ runId, eventId, action: "accept" })
```

Supported approval actions:

- accept
- reject
- ask_revision
- discuss

Current implementation may return a mock timeline update.

Future implementation may call a backend endpoint.

---

## Design System Requirement

All frontend implementation must follow `design_system.md`.

Do not override:

- Layout structure
- Typography
- Color tokens
- Radius system
- Glass surface rules
- Progress bar rules
- Voice interaction styling
- Banned patterns
- Component behavior

If there is a conflict between this file and `design_system.md`:

- `AGENTS.md` controls frontend product behavior, data flow, typed contracts, and required demo interactions.
- `design_system.md` controls visual style and UI presentation.

---

## Banned Frontend Patterns

Do not create:

- Separate static module pages
- Fake fixed cards that look like a normal SaaS dashboard
- Colorful marketing landing page
- Huge hero marketing section
- Generic dashboard charts unrelated to the research task
- Generic AI SaaS visual identity
- Purple-blue neon gradients as the main visual identity
- Abstract glowing spheres, particles, or 3D blobs
- Magic wand, sparkle, robot, rocket, or brain icons as primary symbols
- Overly large rounded feature cards
- Repeated three-card layouts
- Equal-weight layouts everywhere
- Agent chat that feels decorative
- Modules that look disconnected
- Output cards detached from the agent stream
- Mock data scattered across JSX files
- Backend-like business logic inside React components
- Streaming timers deeply embedded in UI components

Do not use this title:

```txt
AHA Moment Radar
```

Use instead:

```txt
Emerging Research Opportunities
```

Do not rename:

```txt
Memory & Growing
```

Do not rename:

```txt
Situation Diagnosis
```

---

## Final Demo Quality Bar

The prototype is successful if the user immediately understands:

- The agent is actively working.
- The workflow is end-to-end.
- The human remains in control.
- The product is for serious research work.
- The UI is not a dashboard.
- The outputs are connected to the agent process.
- The frontend is mock-first but backend-ready.
- The product can move from idea to experiment to writing to publishing.

The final interface should feel like:

```txt
A calm, serious, agentic research scientist operating system.
```
