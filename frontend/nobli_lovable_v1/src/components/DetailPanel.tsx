import type { Step } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function DetailPanel({
  step,
}: {
  step?: Step;
}) {
  return (
    <aside
      className="hidden h-full w-[340px] shrink-0 flex-col border-l border-border bg-[var(--color-sidebar)] min-[1101px]:flex"
      style={{ boxShadow: "inset 1px 0 0 rgba(255,255,255,0.48)" }}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div
          className="text-[12px] font-semibold tracking-tight text-foreground"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          Current Tool
        </div>
      </div>

      {!step || !step.tool ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-[12px] text-ink-muted">
          The active stage has not emitted a tool payload yet.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
          <div
            className="text-[10.5px] uppercase tracking-[0.12em] text-ink-muted"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            Tool
          </div>
          <div className="mt-0.5 text-[14px] font-semibold text-foreground">
            {step.tool.name}
          </div>
          <div className="mt-0.5 text-[11.5px] text-ink-muted">
            Auto-expanded from step · {step.title}
          </div>

          <Row label="Status">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10.5px]",
                step.tool.status === "running" && "border-transparent",
                step.tool.status === "review" && "border-transparent",
                step.tool.status === "waiting" && "border-transparent",
              )}
              style={{
                background:
                  step.tool.status === "done"
                    ? "var(--success-bg)"
                    : step.tool.status === "running"
                      ? "color-mix(in srgb, var(--brand-blue) 20%, white)"
                      : step.tool.status === "review"
                        ? "var(--review-bg)"
                        : "var(--warning-bg)",
                color:
                  step.tool.status === "done"
                    ? "var(--success-text)"
                    : step.tool.status === "running"
                      ? "var(--stage-1-ink)"
                      : step.tool.status === "review"
                        ? "var(--review-text)"
                        : "var(--warning-text)",
              }}
            >
              {step.tool.status}
            </span>
          </Row>
          <Row label="Time used">
            <span className="tabular-nums">{(step.tool.timeMs / 1000).toFixed(1)}s</span>
          </Row>

          <Section label="Input">
            <pre className="overflow-x-auto rounded-xl border p-3 text-[11px] leading-relaxed text-[var(--code-text)] code-surface">
{JSON.stringify(step.tool.input, null, 2)}
            </pre>
          </Section>

          <Section label="Output">
            <div className="rounded-xl border border-border bg-[var(--color-surface)] p-3 text-[12px] leading-[1.65]">
              {step.tool.output}
            </div>
          </Section>

          {step.tool.sources.length > 0 && (
            <Section label="Sources">
              <div className="flex flex-wrap gap-1">
                {step.tool.sources.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[10.5px] text-ink-muted"
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
                  <li key={c} className="rounded-xl border border-border bg-card px-2.5 py-1.5">
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
      <div
        className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-ink-muted"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
