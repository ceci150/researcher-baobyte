import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { HomeScreen } from "@/components/HomeScreen";
import { ProcessBar } from "@/components/ProcessBar";
import { AgentStream } from "@/components/AgentStream";
import { FinalPaperViewer } from "@/components/FinalPaperViewer";
import { AgentControl, type AgentMode } from "@/components/AgentControl";
import { SCRIPT } from "@/lib/script";
import type { Step } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Research Compass — AI Research Scientist Workspace" },
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
  const [task, setTask] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [pending, setPending] = useState(false);
  const [paused, setPaused] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [approvedOpportunity, setApprovedOpportunity] = useState<string | undefined>();
  const [selectedToolStepId, setSelectedToolStepId] = useState<string | undefined>();
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | undefined>();
  const [mode, setMode] = useState<AgentMode>("Full Automation");
  const [elapsed, setElapsed] = useState(0);
  const [stageJump, setStageJump] = useState<number | undefined>();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRun = useCallback((t: string) => {
    setTask(t);
    setSteps([]);
    setCursor(0);
    setPaused(false);
    setApprovedOpportunity(undefined);
    setSelectedToolStepId(undefined);
    setSelectedOpportunity(undefined);
    setElapsed(0);
  }, []);

  // Elapsed timer
  useEffect(() => {
    if (!task) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [task]);

  // Streaming scheduler
  useEffect(() => {
    if (!task) return;
    if (paused) return;
    if (cursor >= SCRIPT.length) {
      setPending(false);
      return;
    }
    const next = SCRIPT[cursor];
    const stepToAdd =
      mode === "Discuss" && !next.gate
        ? {
            ...next,
            gate: true,
            gateLabel: "Discuss before continuing",
            gateHint:
              "Discuss mode is on — confirm or comment on this step before the agent proceeds.",
          }
        : next;
    setPending(true);
    timerRef.current = setTimeout(() => {
      setSteps((prev) => [...prev, stepToAdd]);
      setPending(false);
      if (stepToAdd.gate) {
        setPaused(true);
      } else {
        setCursor((c) => c + 1);
      }
    }, next.delayMs ?? 1200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [task, cursor, paused, mode]);

  const handleApprove = (id: string) => {
    if (id.startsWith("o")) setApprovedOpportunity(id);
    setPaused(false);
    setCursor((c) => c + 1);
  };

  const selectedStep = useMemo(
    () => steps.find((s) => s.id === selectedToolStepId),
    [steps, selectedToolStepId],
  );

  const maxStage = steps.reduce((m, s) => Math.max(m, s.stageIndex + 1), 0);
  const currentStage = steps.length ? steps[steps.length - 1].stageIndex : 0;

  const elapsedStr = useMemo(() => {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return m > 0 ? `${m}m ${s.toString().padStart(2, "0")}s` : `${s}s`;
  }, [elapsed]);

  const status = paused
    ? "Awaiting human approval"
    : pending
      ? mode === "Discuss"
        ? "Asking before next step"
        : "Working autonomously"
      : task
        ? "Run complete"
        : "Idle";

  if (!task) {
    return (
      <div className="flex h-screen w-full bg-background text-foreground">
        <Sidebar active="home" onHome={() => setTask(null)} />
        <main className="min-w-0 flex-1 overflow-hidden">
          <HomeScreen onSubmit={startRun} />
        </main>
        <FinalPaperViewer task="Your next paper will appear here" currentStage={0} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      <Sidebar active="new" currentTaskTitle={task} onHome={() => setTask(null)} />
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
          onSelectTool={(id) =>
            setSelectedToolStepId((cur) => (cur === id ? undefined : id))
          }
          selectedToolStepId={selectedToolStepId}
          onSelectOpportunity={setSelectedOpportunity}
          selectedOpportunity={selectedOpportunity}
          stageJump={stageJump}
          mode={mode}
        />
        <AgentControl mode={mode} setMode={setMode} />
      </main>
      <FinalPaperViewer task={task} currentStage={currentStage} />
    </div>
  );
}
