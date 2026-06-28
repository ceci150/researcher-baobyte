import { useState } from "react";
import { ArrowUp, Mic, Paperclip, Plus } from "lucide-react";
import { toast } from "sonner";
import { EXAMPLE_TASKS, MODES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const MODE_STYLES: Record<
  (typeof MODES)[number],
  { tint: string; ring: string; ink: string }
> = {
  Explore: {
    tint: "color-mix(in srgb, var(--brand-yellow) 42%, white)",
    ring: "rgba(201,166,61,0.34)",
    ink: "var(--stage-0-ink)",
  },
  Survey: {
    tint: "color-mix(in srgb, var(--brand-blue) 34%, white)",
    ring: "rgba(123,158,191,0.34)",
    ink: "var(--stage-1-ink)",
  },
  Experiment: {
    tint: "color-mix(in srgb, var(--brand-orange) 22%, white)",
    ring: "rgba(216,165,126,0.34)",
    ink: "var(--stage-2-ink)",
  },
  Write: {
    tint: "color-mix(in srgb, var(--brand-mint) 52%, white)",
    ring: "rgba(111,154,146,0.34)",
    ink: "var(--stage-3-ink)",
  },
  Publish: {
    tint: "color-mix(in srgb, #d9e3ee 72%, white)",
    ring: "rgba(132,153,175,0.34)",
    ink: "var(--stage-5-ink)",
  },
};

export function HomeScreen({ onSubmit }: { onSubmit: (task: string) => void }) {
  const [value, setValue] = useState(
    "I want to write a paper about explainable AI in computer vision and publish it in a strong venue.",
  );
  const [mode, setMode] = useState<(typeof MODES)[number]>("Explore");
  const [listening, setListening] = useState(false);

  const submit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
  };

  return (
    <div className="flex h-full flex-col items-center justify-center px-8">
      <div className="w-full max-w-[720px]">
        <h1
          className="text-[38px] font-semibold leading-[1.08] tracking-[-0.03em] text-foreground sm:text-[42px]"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          Stay in the flow. Let research move.
        </h1>
        <p className="mt-3 max-w-[640px] text-[14px] leading-[1.65] text-ink-muted">
          An autonomous research scientist that plans, surveys, experiments, writes, and ships —
          while you stay in control.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[12px] transition-colors",
                mode === m
                  ? "border-transparent text-foreground shadow-[inset_0_0_0_1px_rgba(172,206,234,0.22)]"
                  : "border-border bg-card text-ink-muted hover:bg-[var(--color-sidebar-accent)] hover:text-foreground",
              )}
              style={
                mode === m
                  ? {
                      background: MODE_STYLES[m].tint,
                      boxShadow: `inset 0 0 0 1px ${MODE_STYLES[m].ring}`,
                      color: MODE_STYLES[m].ink,
                      fontFamily: "var(--font-ui)",
                    }
                  : {
                      background: `color-mix(in srgb, ${MODE_STYLES[m].tint} 58%, white)`,
                      boxShadow: `inset 0 0 0 1px ${MODE_STYLES[m].ring}`,
                      color: "var(--ink-muted)",
                      fontFamily: "var(--font-ui)",
                    }
              }
            >
              {m}
            </button>
          ))}
        </div>

        <div
          className="mt-4 rounded-[24px] border border-border bg-card"
          style={{ boxShadow: "var(--shadow-soft)", backdropFilter: "blur(10px)" }}
        >
          <textarea
            value={listening ? "Listening… faithfulness benchmarks for vision explainability…" : value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask Nobli to explore, design, write, or publish your research…"
            className="block w-full resize-none rounded-t-[24px] bg-transparent px-5 pt-4 pb-2 text-[14px] leading-[1.7] text-foreground placeholder:text-ink-muted focus:outline-none"
            rows={4}
          />
          <div className="flex items-center justify-between gap-2 border-t border-border px-2.5 py-2">
            <div className="flex items-center gap-1">
              <IconBtn title="Attach file" onClick={() => toast("Attach a paper, dataset, or notes")}>
                <Paperclip className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn
                title="Voice input"
                active={listening}
                onClick={() => setListening((v) => !v)}
              >
                <Mic className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn title="More" onClick={() => toast("More options · upload, templates, import")}>
                <Plus className="h-3.5 w-3.5" />
              </IconBtn>
              {listening && (
                <span
                  className="ml-1 rounded-full px-2 py-0.5 text-[11px]"
                  style={{
                    background: "color-mix(in srgb, var(--brand-blue) 16%, white)",
                    color: "var(--stage-1-ink)",
                    fontFamily: "var(--font-ui)",
                  }}
                >
                  listening…
                </span>
              )}
            </div>
            <button
              onClick={submit}
              className="grid h-8 w-8 place-items-center rounded-full bg-foreground text-background transition-all hover:-translate-y-px hover:opacity-92"
              style={{ boxShadow: "var(--shadow-quiet)" }}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-8">
          <div
            className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            Try a task
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {EXAMPLE_TASKS.map((t) => (
              <button
                key={t}
                onClick={() => onSubmit(t)}
                className="group flex items-start gap-2 rounded-2xl border border-border bg-card px-3.5 py-3 text-left text-[12.5px] text-ink-muted transition-colors hover:border-[color:var(--brand-blue)] hover:bg-[var(--color-sidebar-accent)] hover:text-foreground"
                style={{ boxShadow: "var(--shadow-quiet)" }}
              >
                <span className="mt-[5px] inline-block h-1 w-1 shrink-0 rounded-full bg-ink-muted group-hover:bg-foreground" />
                <span className="leading-snug">{t}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  active,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full text-ink-muted transition-colors hover:bg-[var(--color-surface-2)] hover:text-foreground",
        active && "text-foreground shadow-[inset_0_0_0_1px_rgba(172,206,234,0.24)]",
      )}
      style={
        active
          ? {
              background: "color-mix(in srgb, var(--brand-blue) 22%, white)",
              boxShadow: "0 0 0 1px rgba(172,206,234,0.22)",
            }
          : undefined
      }
    >
      {children}
    </button>
  );
}
