import { Check } from "lucide-react";
import { STAGES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function ProcessBar({
  currentStage,
  maxStage,
  elapsed,
  status,
  onJump,
}: {
  currentStage: number;
  maxStage: number;
  elapsed: string;
  status: string;
  onJump: (stageIndex: number) => void;
}) {
  return (
    <div className="border-b border-border bg-card/60 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-5 pt-3 pb-2">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-ink-muted">Mode</span>
          <span className="rounded-md border border-border bg-card px-1.5 py-0.5 font-medium">
            Explore → Publish
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11.5px] text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-running)] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-running)]" />
            </span>
            <span className="text-foreground">{status}</span>
          </span>
          <span>·</span>
          <span>Elapsed <span className="text-foreground tabular-nums">{elapsed}</span></span>
          <span>·</span>
          <span>Credits <span className="text-foreground tabular-nums">142</span></span>
        </div>
      </div>

      <div className="flex items-center gap-0 overflow-x-auto px-5 pb-3 scrollbar-thin">
        {STAGES.map((stage, i) => {
          const done = i < maxStage;
          const current = i === currentStage;
          return (
            <div key={stage} className="flex shrink-0 items-center">
              <button
                onClick={() => onJump(i)}
                className={cn(
                  "group flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] transition-colors",
                  current && "bg-[var(--color-surface-2)] text-foreground",
                  !current && done && "text-foreground hover:bg-[var(--color-surface-2)]",
                  !current && !done && "text-ink-muted hover:bg-[var(--color-surface-2)]",
                )}
              >
                <span
                  className={cn(
                    "grid h-4 w-4 place-items-center rounded-full border text-[9px] font-medium",
                    done && "border-foreground bg-foreground text-background",
                    current && !done && "border-[var(--color-running)] text-[var(--color-running)]",
                    !done && !current && "border-border text-ink-muted",
                  )}
                >
                  {done ? <Check className="h-2.5 w-2.5" /> : i + 1}
                </span>
                <span className={cn(current && "font-medium")}>{stage}</span>
              </button>
              {i < STAGES.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-px w-6 shrink-0",
                    i < maxStage - 1 ? "bg-foreground/60" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
