import type { Step } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function DetailPanel({
  step,
  onClose,
}: {
  step?: Step;
  onClose: () => void;
}) {
  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-l border-border bg-[var(--color-sidebar)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="text-[12px] font-semibold tracking-tight">Detail</div>
        {step && (
          <button
            onClick={onClose}
            className="text-[11px] text-ink-muted hover:text-foreground"
          >
            Close
          </button>
        )}
      </div>

      {!step || !step.tool ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-[12px] text-ink-muted">
          Click a tool block to view the full information.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
          <div className="text-[11px] uppercase tracking-wider text-ink-muted">Tool</div>
          <div className="mt-0.5 text-[14px] font-semibold text-foreground">
            {step.tool.name}
          </div>
          <div className="mt-0.5 text-[11.5px] text-ink-muted">
            From step · {step.title}
          </div>

          <Row label="Status">
            <span
              className={cn(
                "rounded-full border px-1.5 py-px text-[10.5px]",
                step.tool.status === "done" && "border-border text-ink-muted",
                step.tool.status === "running" && "border-[var(--color-running)] text-[var(--color-running)]",
                step.tool.status === "review" && "border-foreground text-foreground",
                step.tool.status === "waiting" && "border-foreground text-foreground",
              )}
            >
              {step.tool.status}
            </span>
          </Row>
          <Row label="Time used">
            <span className="tabular-nums">{(step.tool.timeMs / 1000).toFixed(1)}s</span>
          </Row>

          <Section label="Input">
            <pre className="overflow-x-auto rounded-md border border-border bg-[var(--color-surface)] p-2.5 text-[11px] leading-relaxed text-foreground">
{JSON.stringify(step.tool.input, null, 2)}
            </pre>
          </Section>

          <Section label="Output">
            <div className="rounded-md border border-border bg-[var(--color-surface)] p-2.5 text-[12px] leading-snug">
              {step.tool.output}
            </div>
          </Section>

          {step.tool.sources.length > 0 && (
            <Section label="Sources">
              <div className="flex flex-wrap gap-1">
                {step.tool.sources.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10.5px] text-ink-muted"
                  >
                    <span className="h-1 w-1 rounded-full bg-ink-muted" />
                    {s}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {step.tool.citations.length > 0 && (
            <Section label="Citations">
              <ul className="space-y-1 text-[11.5px] text-foreground">
                {step.tool.citations.map((c) => (
                  <li key={c} className="rounded-md border border-border bg-card px-2 py-1">
                    {c}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}
    </aside>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-2.5 flex items-center justify-between text-[11.5px]">
      <span className="text-ink-muted">{label}</span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3.5">
      <div className="mb-1 text-[10.5px] font-medium uppercase tracking-wider text-ink-muted">
        {label}
      </div>
      {children}
    </div>
  );
}
