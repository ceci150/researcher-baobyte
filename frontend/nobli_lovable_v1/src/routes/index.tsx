import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { HomeScreen } from "@/components/HomeScreen";
import { AllTasksView } from "@/components/AllTasksView";
import { ProcessBar } from "@/components/ProcessBar";
import { AgentStream } from "@/components/AgentStream";
import { DetailPanel } from "@/components/DetailPanel";
import { FinalPaperViewer } from "@/components/FinalPaperViewer";
import { AgentControl, type AgentMode } from "@/components/AgentControl";
import { addCompletedTask } from "@/lib/demo-task-storage";
import type { Step } from "@/lib/mock-data";
import {
  createResearchRun,
  sendResearchFollowUp,
  submitResearchApproval,
  subscribeToResearchRun,
  type ResearchRunEvent,
  type RunStatus,
} from "@/lib/research-run-service";

type WorkflowStage = "home" | "explore" | "survey" | "experiment" | "write" | "publish";
type WorkspaceView = "new" | "all";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nobli — AI Research Scientist Workspace" },
      {
        name: "description",
        content:
          "An autonomous research scientist that plans, surveys, experiments, writes, and ships — while you stay in control.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [view, setView] = useState<WorkspaceView>("new");
  const [task, setTask] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [pending, setPending] = useState(false);
  const [paused, setPaused] = useState(false);
  const [runId, setRunId] = useState<string | undefined>();
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [approvedOpportunity, setApprovedOpportunity] = useState<string | undefined>();
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | undefined>();
  const [mode, setMode] = useState<AgentMode>("Full Automation");
  const [elapsed, setElapsed] = useState(0);
  const [stageJump, setStageJump] = useState<number | undefined>();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0);
  const [selectedToolStepId, setSelectedToolStepId] = useState<string | undefined>();
  const savedRunIdsRef = useRef<Set<string>>(new Set());

  const startRun = useCallback(async (t: string) => {
    setView("new");
    setTask(t);
    setSteps([]);
    setPaused(false);
    setPending(true);
    setRunId(undefined);
    setRunStatus("running");
    setApprovedOpportunity(undefined);
    setSelectedOpportunity(undefined);
    setSelectedToolStepId(undefined);
    setElapsed(0);

    try {
      const run = await createResearchRun({
        task: t,
        mode,
        controlMode: mode === "Discuss" ? "Discuss" : "Full Automation",
      });
      setRunId(run.id);
      setRunStatus(run.status);
    } catch (error) {
      setPending(false);
      setRunId(undefined);
      setRunStatus("failed");
      setSteps([
        {
          id: "connection-error",
          stageIndex: 0,
          title: "Could not connect to research backend",
          summary:
            error instanceof Error
              ? error.message
              : "Start the Research Claw gateway and try again.",
          duration: "0s",
          status: "waiting",
        },
      ]);
    }
  }, [mode]);

  const applyRunEvent = useCallback((event: ResearchRunEvent) => {
    if (event.type === "step") {
      setSteps((prev) => {
        const existingIndex = prev.findIndex((step) => step.id === event.step.id);
        if (existingIndex >= 0) {
          return prev.map((step, index) =>
            index === existingIndex
              ? { ...step, ...event.step, tool: { ...step.tool, ...event.step.tool } }
              : step,
          );
        }
        return [...prev, event.step];
      });
      setPending(false);
      if (event.step.gate) {
        setPaused(true);
      }
      return;
    }

    if (event.type === "status") {
      setRunStatus(event.status);
      setPaused(event.status === "waiting");
      setPending(event.status === "running");
      return;
    }

    setPending(false);
    setRunStatus("failed");
  }, []);

  useEffect(() => {
    if (!runId) return;
    return subscribeToResearchRun(
      runId,
      applyRunEvent,
      () => {
        setPending(false);
        setRunStatus("failed");
      },
    );
  }, [runId, applyRunEvent]);

  const showHome = useCallback(() => {
    setView("new");
    setTask(null);
    setPending(false);
    setPaused(false);
    setRunId(undefined);
    setRunStatus("idle");
    setSteps([]);
    setApprovedOpportunity(undefined);
    setSelectedOpportunity(undefined);
    setSelectedToolStepId(undefined);
    setElapsed(0);
    setStageJump(undefined);
  }, []);

  const showAllTasks = useCallback(() => {
    setView("all");
  }, []);

  useEffect(() => {
    if (!task) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [task]);

  const handleApprove = async (id: string) => {
    if (id.startsWith("o")) setApprovedOpportunity(id);
    if (!runId) return;
    const stepId = id.startsWith("o") ? steps[steps.length - 1]?.id : id;
    if (!stepId) return;
    setPaused(false);
    setPending(true);
    await submitResearchApproval({
      runId,
      stepId,
      action: "accept",
      selectedOpportunityId: id.startsWith("o") ? id : selectedOpportunity,
    });
  };

  const handleApprovalAction = async (
    stepId: string,
    action: "accept" | "reject" | "ask-revision",
  ) => {
    if (!runId) return;
    setPaused(false);
    setPending(true);
    await submitResearchApproval({
      runId,
      stepId,
      action,
      selectedOpportunityId: selectedOpportunity,
      comment: action === "ask-revision" ? "User requested a revision before continuing." : "",
    });
  };

  const handleFollowUp = async (message: string) => {
    if (!runId) return;
    await sendResearchFollowUp({ runId, message });
  };

  const maxStage = steps.reduce((m, s) => Math.max(m, s.stageIndex + 1), 0);
  const currentStage = steps.length ? steps[steps.length - 1].stageIndex : 0;
  const contextualDetailStep = useMemo(() => {
    if (!steps.length) return undefined;
    const selectedStep = selectedToolStepId
      ? steps.find((step) => step.id === selectedToolStepId && step.tool)
      : undefined;
    if (selectedStep) return selectedStep;
    return (
      [...steps]
        .reverse()
        .find((step) => step.stageIndex === currentStage && step.tool) ??
      [...steps].reverse().find((step) => step.tool)
    );
  }, [steps, currentStage, selectedToolStepId]);
  const workflowStage = getWorkflowStage(task, currentStage);
  const isWorkflowRunning = workflowStage !== "home";
  const showPaperPanel = workflowStage === "write" || workflowStage === "publish";
  const sidebarVariant = !isWorkflowRunning
    ? "expanded"
    : isSidebarHovered
      ? "expanded-hover"
      : "collapsed";

  const elapsedStr = useMemo(() => {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return m > 0 ? `${m}m ${s.toString().padStart(2, "0")}s` : `${s}s`;
  }, [elapsed]);

  const status = runStatus === "failed"
    ? "Connection failed"
    : paused
      ? "Awaiting human approval"
      : pending
        ? mode === "Discuss"
          ? "Asking before next step"
          : "Working autonomously"
        : task
          ? "Run complete"
          : "Idle";
  const isRunComplete = !!task && runStatus === "complete" && !pending && !paused;

  useEffect(() => {
    if (!isWorkflowRunning && isSidebarHovered) {
      setIsSidebarHovered(false);
    }
  }, [isSidebarHovered, isWorkflowRunning]);

  useEffect(() => {
    if (!task || !runId || runStatus !== "complete" || pending) return;
    if (savedRunIdsRef.current.has(runId)) return;
    addCompletedTask(task, runId);
    savedRunIdsRef.current.add(runId);
    setHistoryRefreshToken((value) => value + 1);
  }, [pending, runId, runStatus, task]);

  if (view === "all") {
    return (
      <div className="flex h-screen w-full bg-background text-foreground">
        <Sidebar
          active="all"
          currentTaskTitle={task ?? undefined}
          currentTaskStatus={runStatus}
          onHome={showHome}
          onAllTasks={showAllTasks}
          variant={isWorkflowRunning ? sidebarVariant : "expanded"}
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
        />
        <AllTasksView refreshToken={historyRefreshToken} />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex h-screen w-full bg-background text-foreground">
        <Sidebar active="new" variant="expanded" onHome={showHome} onAllTasks={showAllTasks} />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <HomeScreen onSubmit={startRun} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      <Sidebar
        active="new"
        currentTaskTitle={task}
        currentTaskStatus={runStatus}
        onHome={showHome}
        onAllTasks={showAllTasks}
        variant={sidebarVariant}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <ProcessBar
          currentStage={currentStage}
          maxStage={maxStage}
          elapsed={elapsedStr}
          status={status}
          onJump={(i) => setStageJump(i)}
        />
        <AgentStream
          steps={steps}
          pending={pending && !paused}
          paused={paused}
          task={task}
          approvedOpportunity={approvedOpportunity}
          onApprove={handleApprove}
          onApprovalAction={handleApprovalAction}
          onSelectTool={(id) =>
            setSelectedToolStepId((cur) => (cur === id ? undefined : id))
          }
          selectedToolStepId={selectedToolStepId}
          onSelectOpportunity={setSelectedOpportunity}
          selectedOpportunity={selectedOpportunity}
          stageJump={stageJump}
          mode={mode}
        />
        <AgentControl mode={mode} setMode={setMode} onSendFollowUp={handleFollowUp} />
        {isRunComplete && (
          <div className="px-5 pb-4">
            <div className="mx-auto max-w-[980px] text-[12px] text-ink-muted">
              <span>Run complete</span>
              <span> · </span>
              <span>Saved to All tasks</span>
              <span> · </span>
              <button
                type="button"
                onClick={showAllTasks}
                className="rounded-full text-[12px] text-foreground underline underline-offset-4 transition-colors hover:text-[var(--stage-1-ink)]"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                View Gallery
              </button>
            </div>
          </div>
        )}
      </main>
      {showPaperPanel ? (
        <FinalPaperViewer task={task} currentStage={currentStage} steps={steps} />
      ) : (
        <DetailPanel step={contextualDetailStep} />
      )}
    </div>
  );
}

function getWorkflowStage(task: string | null, stageIndex: number): WorkflowStage {
  if (!task) return "home";
  if (stageIndex <= 0) return "explore";
  if (stageIndex === 1) return "survey";
  if (stageIndex === 2 || stageIndex === 3) return "experiment";
  if (stageIndex === 4) return "write";
  return "publish";
}
