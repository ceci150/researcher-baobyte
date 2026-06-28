import { useEffect, useMemo, useState } from "react";
import { getTaskHistory, type DemoTaskHistoryItem } from "@/lib/demo-task-storage";
import { cn } from "@/lib/utils";

type ControlMode = "encouraging" | "strict";

export function AllTasksView({ refreshToken = 0 }: { refreshToken?: number }) {
  const [mode, setMode] = useState<ControlMode>("encouraging");
  const [history, setHistory] = useState<DemoTaskHistoryItem[]>([]);

  useEffect(() => {
    setHistory(getTaskHistory());
  }, [refreshToken]);

  const currentYear = new Date().getFullYear();
  const completedThisYear = useMemo(
    () =>
      history.filter((item) => {
        const year = new Date(item.completedAt).getFullYear();
        return Number.isFinite(year) && year === currentYear;
      }).length,
    [currentYear, history],
  );
  const estimatedHoursSaved = completedThisYear * 3;

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-background px-6 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-[1080px]">
        <section
          className="rounded-[28px] border border-border bg-card p-5 sm:p-6"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="sm:pt-1">
              <div
                className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                AI Control Check
              </div>
            </div>

            <div className="inline-flex rounded-full border border-border bg-[var(--color-surface)] p-1">
              {([
                ["encouraging", "Encouraging"],
                ["strict", "Strict"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[11.5px] transition-colors",
                    mode === key ? "text-foreground" : "text-ink-muted hover:text-foreground",
                  )}
                  style={
                    mode === key
                      ? {
                          background: "color-mix(in srgb, var(--brand-blue) 18%, white)",
                          fontFamily: "var(--font-ui)",
                        }
                      : { fontFamily: "var(--font-ui)" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <h1
            className="mt-4 text-center text-[24px] font-semibold tracking-[-0.03em] text-foreground sm:text-[28px]"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            {mode === "encouraging"
              ? "You are steering the research machine."
              : "Careful — AI can drive you too."}
          </h1>

          <div className="mt-6 flex justify-center">
            <div className="w-full max-w-[760px] text-center">
              <p className="text-[14px] leading-[1.85] text-foreground sm:text-[15px]">
                {mode === "encouraging" ? (
                  <>
                    You completed{" "}
                    <span className="font-medium text-foreground">{completedThisYear}</span>{" "}
                    research runs this year and saved an estimated{" "}
                    <span className="font-medium text-foreground">{estimatedHoursSaved} hours</span>{" "}
                    of research friction.
                  </>
                ) : (
                  <>
                    Your outputs are growing, but your research agent only stays useful if you keep
                    reviewing, updating, and teaching it.
                  </>
                )}
              </p>

              <div className="mt-3 space-y-2">
                {mode === "encouraging" ? (
                  <p className="text-[12px] leading-[1.7] text-ink-muted">
                    Estimated from completed Nobli runs, for demo purposes.
                  </p>
                ) : (
                  <>
                    <p className="text-[12px] leading-[1.7] text-ink-muted">
                      {completedThisYear} completed runs · {estimatedHoursSaved} estimated hours
                      saved · Growing Together updates pending.
                    </p>
                    <p className="text-[12px] font-medium text-[var(--review-text)]">
                      Don’t forget Growing together.
                    </p>
                  </>
                )}
              </div>

              <div
                className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-[18px] sm:text-[20px]"
                aria-hidden="true"
              >
                {mode === "encouraging" ? (
                  <>
                    <span>🧑‍🔬</span>
                    <span className="text-[13px] text-ink-muted sm:text-[14px]">hands on wheel</span>
                    <span className="text-ink-muted">→</span>
                    <span>🤖</span>
                    <span className="text-[13px] text-ink-muted sm:text-[14px]">engine humming</span>
                    <span className="text-ink-muted">→</span>
                    <span>📄</span>
                    <span className="text-[13px] text-ink-muted sm:text-[14px]">papers shipped</span>
                  </>
                ) : (
                  <>
                    <span>🤖</span>
                    <span className="text-[13px] text-ink-muted sm:text-[14px]">at the wheel</span>
                    <span className="text-ink-muted">→</span>
                    <span>🧑‍🔬</span>
                    <span className="text-[13px] text-ink-muted sm:text-[14px]">checking the map</span>
                    <span className="text-ink-muted">→</span>
                    <span>📄</span>
                    <span className="text-[13px] text-ink-muted sm:text-[14px]">outputs everywhere</span>
                  </>
                )}
              </div>

              <div className="mt-4 text-[12.5px] font-medium text-foreground">
                {mode === "encouraging"
                  ? "You are driving AI, not chasing it."
                  : "Keep your hands on the research wheel."}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div
            className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            Gallery
          </div>

          {history.length === 0 ? (
            <div
              className="mt-3 rounded-[24px] border border-border bg-card px-5 py-8 text-[14px] text-ink-muted"
              style={{ boxShadow: "var(--shadow-quiet)" }}
            >
              No completed research runs yet.
            </div>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {history.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[24px] border border-border bg-card p-4"
                  style={{ boxShadow: "var(--shadow-quiet)" }}
                >
                  <div className="rounded-[18px] border border-border bg-[var(--color-surface)] p-4">
                    <div
                      className="flex h-[132px] items-center justify-center rounded-[14px] border border-dashed border-border"
                      style={{
                        background:
                          "linear-gradient(135deg, color-mix(in srgb, var(--brand-blue) 18%, white), color-mix(in srgb, var(--brand-mint) 18%, white))",
                      }}
                    >
                      <div className="text-center">
                        <div
                          className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted"
                          style={{ fontFamily: "var(--font-ui)" }}
                        >
                          PDF
                        </div>
                        <div className="mt-2 text-[12.5px] text-foreground">Research artifact</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div
                      className="text-[13px] font-medium leading-[1.55] text-foreground"
                      style={{ fontFamily: "var(--font-ui)" }}
                    >
                      {item.title}
                    </div>
                    <div className="mt-2 text-[11.5px] text-ink-muted">
                      Completed {formatCompletedAt(item.completedAt)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function formatCompletedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
