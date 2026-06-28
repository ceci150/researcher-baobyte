import { useEffect, useRef } from "react";
import type { Step } from "@/lib/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Check, MessageSquare, Pencil, X } from "lucide-react";
import {
  AbstractCard,
  ApprovalOpportunitiesCard,
  ConferencesCard,
  ExperimentCard,
  IterationCard,
  LiteratureCard,
  MemoryCard,
  OpportunitiesCard,
  PublishCard,
} from "./cards";

export function AgentStream({
  steps,
  pending,
  paused,
  task,
  approvedOpportunity,
  onApprove,
  onApprovalAction,
  onSelectTool,
  selectedToolStepId,
  onSelectOpportunity,
  selectedOpportunity,
  stageJump,
}: {
  steps: (Step & { gate?: boolean; gateLabel?: string; gateHint?: string })[];
  pending: boolean;
  paused: boolean;
  task: string;
  approvedOpportunity?: string;
  onApprove: (id: string) => void;
  onApprovalAction: (stepId: string, action: "accept" | "reject" | "ask-revision") => void;
  onSelectTool: (stepId: string) => void;
  selectedToolStepId?: string;
  onSelectOpportunity: (id: string) => void;
  selectedOpportunity?: string;
  stageJump?: number;
  mode?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [steps.length, pending]);

  useEffect(() => {
    if (stageJump == null) return;
    const node = refs.current[stageJump];
    if (node) node.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [stageJump]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-[820px] px-6 py-6">
        <div className="mb-5 rounded-xl border border-border bg-card p-3.5">
          <div className="text-[10.5px] font-medium uppercase tracking-wider text-ink-muted">
            Research goal
          </div>
          <div className="mt-1 text-[13px] leading-snug text-foreground">{task}</div>
        </div>

        <div className="relative pl-5">
          <div className="absolute bottom-0 left-[7px] top-1 w-px bg-border" />
          {steps.map((s) => (
            <div
              key={s.id}
              ref={(el) => {
                refs.current[s.stageIndex] = el;
              }}
              className="relative mb-5 last:mb-2 rounded-lg px-3 py-2.5 -ml-3 border"
              style={{
                backgroundColor: `var(--stage-${s.stageIndex}-bg)`,
                borderColor: `color-mix(in oklab, var(--stage-${s.stageIndex}-ring) 25%, transparent)`,
              }}
            >
              <span
                className={cn(
                  "absolute -left-2 top-3.5 grid h-3.5 w-3.5 place-items-center rounded-full border-2 bg-background",
                )}
                style={{ borderColor: `var(--stage-${s.stageIndex}-ring)` }}
              >
                {s.status === "running" && (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: `var(--stage-${s.stageIndex}-ring)` }} />
                )}
              </span>

              <div className="flex items-center gap-2 text-[10.5px]">
                <span
                  className="rounded-full px-1.5 py-px text-[9.5px] font-medium uppercase tracking-wider"
                  style={{
                    backgroundColor: `color-mix(in oklab, var(--stage-${s.stageIndex}-ring) 18%, transparent)`,
                    color: `var(--stage-${s.stageIndex}-ink)`,
                  }}
                >
                  Stage {s.stageIndex + 1}
                </span>
                <span className="text-ink-muted">{formatDurationLabel(s.duration)}</span>
                <StatusPill status={s.status} />
              </div>
              <div className="mt-0.5 text-[13px] font-medium text-foreground">{s.title}</div>
              <div className="mt-0.5 text-[12px] leading-snug text-ink-muted">{s.summary}</div>

              {s.tool && (
                <button
                  onClick={() => onSelectTool(s.id)}
                  className={cn(
                    "mt-2 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition-colors",
                    selectedToolStepId === s.id
                      ? "border-foreground bg-[var(--color-surface)] text-foreground"
                      : "border-border bg-card text-ink-muted hover:text-foreground",
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-sm bg-foreground" />
                  Tool · {s.tool.name}
                </button>
              )}

              {s.sources && s.sources.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {s.sources.map((src) => (
                    <span
                      key={src}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10.5px] text-ink-muted"
                    >
                      <span className="h-1 w-1 rounded-full bg-ink-muted" />
                      {src}
                    </span>
                  ))}
                </div>
              )}

              {s.output && (
                <div className="mt-3">
                  {s.output.kind === "literature" && <LiteratureCard />}
                  {s.output.kind === "opportunities" && (
                    <OpportunitiesCard
                      selected={selectedOpportunity}
                      onSelect={onSelectOpportunity}
                    />
                  )}
                  {s.output.kind === "approval-opportunities" && (
                    <ApprovalOpportunitiesCard
                      approved={approvedOpportunity}
                      onApprove={onApprove}
                    />
                  )}
                  {s.output.kind === "experiment" && <ExperimentCard step={s} />}
                  {s.output.kind === "iteration" && <IterationCard step={s} />}
                  {s.output.kind === "abstract" && <AbstractCard step={s} />}
                  {s.output.kind === "publish" && <PublishCard />}
                  {s.output.kind === "conferences" && <ConferencesCard />}
                  {s.output.kind === "memory" && <MemoryCard step={s} />}
                </div>
              )}

              {paused &&
                s.gate &&
                s.id === steps[steps.length - 1]?.id &&
                s.output?.kind !== "approval-opportunities" && (
                  <GateBar
                    label={s.gateLabel ?? "Human approval"}
                    hint={s.gateHint ?? "Approve to let the agent continue."}
                    onAction={(action) => onApprovalAction(s.id, action)}
                  />
                )}
            </div>
          ))}

          {pending && (
            <div className="relative mb-2">
              <span className="absolute -left-5 top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full border border-[var(--color-running)] bg-background">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-running)]" />
              </span>
              <div className="text-[10.5px] text-ink-muted">Working…</div>
              <div className="mt-0.5 shimmer-text text-[13px] font-medium">
                Reasoning, searching, and drafting next step
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDurationLabel(duration: string) {
  if (duration === "pending" || duration === "queued") return "Queued";
  if (!duration) return "Queued";
  return `Worked for ${duration}`;
}

function StatusPill({ status }: { status: Step["status"] }) {
  const map: Record<Step["status"], { label: string; className: string }> = {
    running: { label: "running", className: "border-[var(--color-running)] text-[var(--color-running)]" },
    done: { label: "done", className: "border-border text-ink-muted" },
    waiting: { label: "waiting for human", className: "border-foreground text-foreground" },
    review: { label: "needs review", className: "border-foreground text-foreground" },
  };
  const v = map[status];
  return (
    <span className={cn("rounded-full border px-1.5 py-px text-[10px]", v.className)}>
      {v.label}
    </span>
  );
}

function GateBar({
  label,
  hint,
  onAction,
}: {
  label: string;
  hint: string;
  onAction: (action: "accept" | "reject" | "ask-revision") => void;
}) {
  return (
    <div className="mt-3 rounded-lg border border-foreground/30 bg-[var(--color-surface)] p-3">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-foreground">
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground opacity-50" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-foreground" />
        </span>
        {label}
      </div>
      <div className="mt-1 text-[12px] text-ink-muted">{hint}</div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => {
            toast.success("Approved — agent continuing.");
            onAction("accept");
          }}
          className="inline-flex items-center gap-1 rounded-md bg-foreground px-2.5 py-1 text-[11.5px] font-medium text-background hover:opacity-90"
        >
          <Check className="h-3 w-3" /> Accept &amp; continue
        </button>
        <button
          onClick={() => {
            toast("Revision requested — agent will adjust before continuing.");
            onAction("ask-revision");
          }}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-[11.5px] hover:bg-[var(--color-surface-2)]"
        >
          <Pencil className="h-3 w-3" /> Ask for revision
        </button>
        <button
          onClick={() => toast("Opened discussion with agent.")}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-[11.5px] hover:bg-[var(--color-surface-2)]"
        >
          <MessageSquare className="h-3 w-3" /> Discuss
        </button>
        <button
          onClick={() => {
            toast("Skipped — run paused without approval.");
            onAction("reject");
          }}
          className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] text-ink-muted hover:text-foreground"
          title="Skip"
        >
          <X className="h-3 w-3" /> Skip
        </button>
      </div>
    </div>
  );
}
