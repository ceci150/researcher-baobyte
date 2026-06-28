import { Check } from "lucide-react";
import { STAGES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const BAR_STOPS = [
  "#b8cae3",
  "#b7c7ea",
  "#f1b08f",
  "#ff9270",
  "#f0c768",
  "#f4de82",
  "#dbe6a9",
];

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
  const progressPercent =
    STAGES.length > 1 ? (currentStage / (STAGES.length - 1)) * 100 : 0;
  const gradientTrack = `linear-gradient(90deg, ${BAR_STOPS.join(", ")})`;

  return (
    <div
      className="border-b border-border bg-card/70 backdrop-blur-md"
      style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.5)" }}
    >
      <div className="flex flex-col gap-2 px-5 pt-3 pb-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-ink-muted">Mode</span>
          <span
            className="rounded-full border border-border bg-card px-2 py-0.5 font-medium text-foreground"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            Explore → Publish
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted sm:justify-end sm:text-[11.5px]">
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

      <div className="relative overflow-x-auto px-5 pb-3 scrollbar-thin">
        <div className="pointer-events-none absolute inset-x-5 top-[18px] h-[2px] rounded-full bg-border/80" />
        <div
          className="pointer-events-none absolute inset-x-5 top-[18px] h-[2px] rounded-full opacity-28"
          style={{ background: gradientTrack }}
        />
        <div
          className="pointer-events-none absolute left-5 top-[17px] h-[4px] rounded-full"
          style={{
            width: `calc((100% - 2.5rem) * ${Math.max(0, Math.min(100, progressPercent)) / 100})`,
            background: gradientTrack,
            boxShadow: "0 0 0 1px rgba(255,255,255,0.35)",
          }}
        />
        <div className="relative flex items-center gap-0">
          {STAGES.map((stage, i) => {
            const done = i < maxStage;
            const current = i === currentStage;
            return (
              <div key={stage} className="flex shrink-0 items-center">
                <button
                  onClick={() => onJump(i)}
                  className={cn(
                    "group flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11.5px] transition-colors",
                    current && "text-foreground",
                    !current && done && "text-foreground hover:bg-[var(--color-surface-2)]",
                    !current && !done && "text-ink-muted hover:bg-[var(--color-surface-2)]",
                  )}
                  style={
                    current
                      ? {
                          background: "color-mix(in srgb, var(--brand-blue) 12%, white)",
                          boxShadow: "inset 0 0 0 1px rgba(172,206,234,0.18)",
                        }
                      : undefined
                  }
                >
                  <span
                    className={cn(
                      "grid h-4 w-4 place-items-center rounded-full border text-[9px] font-medium",
                      done && "text-background shadow-[0_0_0_2px_rgba(247,247,247,0.98)]",
                      current && !done && "text-foreground shadow-[0_0_0_2px_rgba(247,247,247,0.98)]",
                      !done && !current && "text-ink-muted shadow-[0_0_0_2px_rgba(247,247,247,0.98)]",
                    )}
                    style={
                      done
                        ? {
                            borderColor: "rgba(157, 189, 223, 0.85)",
                            background: "#9dc3e0",
                          }
                        : current
                          ? {
                              borderColor: "rgba(157, 189, 223, 0.92)",
                              background: "#b8d4ea",
                            }
                          : {
                              borderColor: "rgba(184, 202, 227, 0.9)",
                              background: "#c7d9eb",
                            }
                    }
                  >
                    {done ? <Check className="h-2.5 w-2.5" /> : i + 1}
                  </span>
                  <span
                    className={cn(current && "font-medium")}
                    style={{ fontFamily: "var(--font-ui)" }}
                  >
                    {stage}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
