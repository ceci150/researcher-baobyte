import { useState } from "react";
import { ArrowUp, Mic, Paperclip, Plus } from "lucide-react";
import { toast } from "sonner";
import { EXAMPLE_TASKS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type GrowingUpdate = {
  source: string;
  timestamp: string;
  message: string;
  status: "Ready to learn" | "Coming soon";
  action: "Help me grow" | "Push for update";
  modal: {
    title: string;
    body: string;
    action: string;
  };
};

const GROWING_UPDATES: GrowingUpdate[] = [
  {
    source: "Recursive",
    timestamp: "Jun 11, 2026",
    message:
      "Recursive’s benchmarks show AI research agents can improve model training, speedruns, and GPU kernel optimization-not just summarize papers.",
    status: "Ready to learn",
    action: "Help me grow",
    modal: {
      title: "All done.",
      body: "Nobli just got a little stronger for your next research move.",
      action: "High five ✋",
    },
  },
  {
    source: "AutoResearch by Andrej Karpathy",
    timestamp: "Jun 2026",
    message:
      "AutoResearch now detects GPU capability for better MFU scoring, so Nobli can adapt experiment reports to the user’s hardware.",
    status: "Ready to learn",
    action: "Help me grow",
    modal: {
      title: "All done.",
      body: "Nobli just got a little stronger for your next research move.",
      action: "High five ✋",
    },
  },
  {
    source: "AutoResearchClaw",
    timestamp: "May 2026",
    message:
      "AutoResearchClaw’s LaTeX export, BibTeX pruning, citation checks, and venue templates point to better conference-ready paper packaging.",
    status: "Ready to learn",
    action: "Help me grow",
    modal: {
      title: "All done.",
      body: "Nobli just got a little stronger for your next research move.",
      action: "High five ✋",
    },
  },
  {
    source: "Feynman / AI-Researcher",
    timestamp: "2026",
    message:
      "Feynman and AI-Researcher strengthen source-grounded workflows with citation checks, research briefs, benchmarks, and Web GUI review.",
    status: "Coming soon",
    action: "Push for update",
    modal: {
      title: "We’re on it.",
      body: "Sending a ten-alarm signal to the research frontier team.",
      action: "🔥",
    },
  },
  {
    source: "Deli AutoResearch",
    timestamp: "Jun 2026",
    message:
      "Deli AutoResearch adds anti-loop rules, watchdogs, state files, and stall detection for safer long-running research agents.",
    status: "Coming soon",
    action: "Push for update",
    modal: {
      title: "We’re on it.",
      body: "Sending a ten-alarm signal to the research frontier team.",
      action: "🔥",
    },
  },
];

const STATUS_STYLES = {
  "Ready to learn": {
    background: "color-mix(in srgb, var(--brand-mint) 34%, white)",
    color: "var(--stage-3-ink)",
  },
  "Coming soon": {
    background: "color-mix(in srgb, var(--brand-yellow) 32%, white)",
    color: "var(--stage-0-ink)",
  },
};

const ACTION_STYLES = {
  "Help me grow": {
    background:
      "linear-gradient(90deg, color-mix(in srgb, var(--brand-blue) 72%, white), color-mix(in srgb, var(--brand-mint) 82%, white))",
    borderColor: "color-mix(in srgb, var(--brand-blue) 28%, var(--color-border))",
    color: "var(--stage-1-ink)",
  },
  "Push for update": {
    background: "color-mix(in srgb, var(--brand-orange) 14%, white)",
    borderColor: "color-mix(in srgb, var(--brand-orange) 26%, var(--color-border))",
    color: "var(--review-text)",
  },
};

export function HomeScreen({ onSubmit }: { onSubmit: (task: string) => void }) {
  const [value, setValue] = useState(
    "I want to write a paper about explainable AI in computer vision and publish it in a strong venue.",
  );
  const [listening, setListening] = useState(false);
  const [modal, setModal] = useState<GrowingUpdate["modal"] | null>(null);

  const submit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-start px-8 pt-14 pb-14 sm:pt-20 sm:pb-20 lg:pt-24 lg:pb-24">
      <div className="w-full max-w-[720px]">
        <h1
          className="text-[38px] font-semibold leading-[1.08] tracking-[-0.03em] text-foreground sm:text-[42px]"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          <span className="block">Research at Nobel speed.</span>
          <span className="block">Growth at your pace.</span>
        </h1>
        <p className="mt-3 max-w-[640px] text-[14px] leading-[1.65] text-ink-muted">
          An autonomous research scientist that plans, surveys, experiments, writes, and ships —
          while you stay in control.
        </p>

        <div
          className="mt-8 rounded-[24px] border border-border bg-card"
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

        <GrowingTogether onOpenModal={setModal} />
      </div>

      {modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(244,242,236,0.72)] px-6 backdrop-blur-sm">
          <div
            className="w-full max-w-[360px] rounded-[28px] border border-border bg-card p-6 text-center"
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            <div
              className="text-[20px] font-semibold tracking-[-0.02em] text-foreground"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {modal.title}
            </div>
            <p className="mt-2 text-[13.5px] leading-[1.7] text-ink-muted">{modal.body}</p>
            <button
              onClick={() => setModal(null)}
              className="mt-5 inline-flex rounded-full bg-foreground px-4 py-2 text-[12px] font-medium text-background hover:opacity-92"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {modal.action}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GrowingTogether({ onOpenModal }: { onOpenModal: (modal: GrowingUpdate["modal"]) => void }) {
  const loopedUpdates = [...GROWING_UPDATES, ...GROWING_UPDATES];

  return (
    <section className="mt-8">
      <style>{`
        .growing-carousel {
          --growing-gap: 0.75rem;
          --growing-card-width: min(18rem, calc(100vw - 5.5rem));
          overflow: hidden;
        }
        .growing-carousel-track {
          display: flex;
          gap: var(--growing-gap);
          width: max-content;
          animation: growing-carousel-loop 34s linear infinite;
          will-change: transform;
        }
        .growing-carousel-card {
          width: var(--growing-card-width);
          scroll-snap-align: start;
        }
        .growing-carousel:hover .growing-carousel-track,
        .growing-carousel:focus-within .growing-carousel-track {
          animation-play-state: paused;
        }
        @keyframes growing-carousel-loop {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-1 * ((var(--growing-card-width) + var(--growing-gap)) * 5)));
          }
        }
        @media (min-width: 640px) {
          .growing-carousel {
            --growing-card-width: 18.25rem;
          }
        }
        @media (min-width: 1024px) {
          .growing-carousel {
            --growing-card-width: 14rem;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .growing-carousel {
            overflow-x: auto;
            padding-bottom: 0.25rem;
            scroll-snap-type: x proximity;
          }
          .growing-carousel-track {
            animation: none;
          }
        }
      `}</style>
      <div
        className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        Growing together
      </div>
      <div
        className="growing-carousel rounded-[24px]"
        aria-label="Growing together updates"
      >
        <div className="growing-carousel-track">
          {loopedUpdates.map((item, index) => (
            <article
              key={`${item.source}-${index}`}
              className="growing-carousel-card rounded-2xl border border-border bg-card px-4 py-3"
              style={{ boxShadow: "var(--shadow-quiet)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div
                    className="text-[12px] font-medium leading-snug text-foreground"
                    style={{ fontFamily: "var(--font-ui)" }}
                  >
                    {item.source}
                  </div>
                  <div
                    className="mt-1 text-[10.5px] uppercase tracking-[0.08em] text-ink-muted"
                    style={{ fontFamily: "var(--font-ui)" }}
                  >
                    {item.timestamp}
                  </div>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-[10.5px]"
                  style={{
                    background: STATUS_STYLES[item.status].background,
                    color: STATUS_STYLES[item.status].color,
                    fontFamily: "var(--font-ui)",
                  }}
                >
                  {item.status}
                </span>
              </div>
              <p className="mt-2 text-[12.5px] leading-[1.65] text-ink-muted">{item.message}</p>
              <button
                onClick={() => onOpenModal(item.modal)}
                className="mt-3 inline-flex rounded-full border px-3 py-1.5 text-[11.5px] transition-transform hover:-translate-y-px"
                style={{
                  background: ACTION_STYLES[item.action].background,
                  borderColor: ACTION_STYLES[item.action].borderColor,
                  color: ACTION_STYLES[item.action].color,
                  fontFamily: "var(--font-ui)",
                }}
              >
                {item.action}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
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
