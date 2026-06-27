import { useState } from "react";
import { ArrowUp, Mic, Paperclip, Plus } from "lucide-react";
import { toast } from "sonner";
import { EXAMPLE_TASKS, MODES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

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
        <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
          Research Compass
        </div>
        <h1 className="text-[34px] font-medium leading-tight tracking-tight text-foreground">
          Stay in the flow. Let research move.
        </h1>
        <p className="mt-2 text-[13px] text-ink-muted">
          An autonomous research scientist that plans, surveys, experiments, writes, and ships —
          while you stay in control.
        </p>

        <div className="mt-7 flex flex-wrap gap-1">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px] transition-colors",
                mode === m
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-ink-muted hover:text-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]">
          <textarea
            value={listening ? "Listening… faithfulness benchmarks for vision explainability…" : value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask Research Compass to explore, design, write, or publish your research…"
            className="block w-full resize-none rounded-t-xl bg-transparent px-4 pt-3.5 pb-2 text-[13.5px] leading-relaxed text-foreground placeholder:text-ink-muted focus:outline-none"
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
                <span className="ml-1 text-[11px] text-[var(--color-running)]">listening…</span>
              )}
            </div>
            <button
              onClick={submit}
              className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background hover:opacity-90"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Try a task
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {EXAMPLE_TASKS.map((t) => (
              <button
                key={t}
                onClick={() => onSubmit(t)}
                className="group flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-[12.5px] text-ink-muted hover:border-border-strong hover:text-foreground transition-colors"
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
        "grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-[var(--color-surface-2)] hover:text-foreground transition-colors",
        active && "bg-[var(--color-surface-2)] text-foreground",
      )}
    >
      {children}
    </button>
  );
}
