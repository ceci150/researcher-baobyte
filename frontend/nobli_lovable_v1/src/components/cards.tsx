import {
  ABSTRACT_DRAFT,
  ABSTRACT_STYLES,
  CONFERENCES,
  DIAGNOSIS,
  EXPERIMENT,
  ITERATIONS,
  LITERATURE,
  MEMORY_NOTIFICATIONS,
  OPPORTUNITIES,
  PLATFORMS,
} from "@/lib/mock-data";
import type { Step } from "@/lib/mock-data";
import { API_BASE } from "@/lib/research-run-service";
import { cn } from "@/lib/utils";
import {
  Bell,
  BookOpen,
  Braces,
  Check,
  ChevronRight,
  Code2,
  Download,
  ExternalLink,
  FileText,
  GitBranch,
  MessageSquare,
  Send,
  Smartphone,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const bandStyle: Record<string, string> = {
  "High potential": "border border-transparent text-foreground",
  Promising: "border border-border bg-card text-foreground",
  Niche: "border border-border bg-[var(--color-surface-2)] text-ink-muted",
  "Low fit": "border border-border bg-card text-ink-muted",
};

export function LiteratureCard() {
  const maxCite = Math.max(...LITERATURE.map((p) => p.citations));
  // why-popular reasoning chips, color-coded
  const reasonColor = (k: string) =>
    k === "novelty"
      ? "var(--stage-2-ring)"
      : k === "citations"
        ? "var(--stage-4-ring)"
        : k === "venue"
          ? "var(--stage-5-ring)"
          : k === "recency"
            ? "var(--stage-3-ring)"
            : "var(--stage-1-ring)";

  const reasonsFor = (p: (typeof LITERATURE)[number]) => {
    const r: { k: string; label: string }[] = [];
    if (p.citations > 500) r.push({ k: "citations", label: `${p.citations.toLocaleString()} cites` });
    if (p.year >= 2024) r.push({ k: "recency", label: "fresh 2024+" });
    if (["NeurIPS", "ICML", "ICLR", "CVPR"].includes(p.venue))
      r.push({ k: "venue", label: `top venue · ${p.venue}` });
    if (p.relevance >= 0.93) r.push({ k: "novelty", label: "high novelty signal" });
    r.push({ k: "topic", label: "matches your goal" });
    return r;
  };

  return (
    <Card title="Literature survey" subtitle="184 papers · 4 clusters · why these rose to the top">
      {/* Bubble landscape — citations (x) vs relevance (y), sized by citations */}
      <div className="rounded-lg border border-border bg-[var(--color-surface)] p-3">
        <div className="mb-1.5 flex items-center justify-between text-[10.5px] text-ink-muted">
          <span>Relevance × impact landscape</span>
          <span className="flex items-center gap-2">
            <Legend color="var(--stage-4-ring)" label="impact" />
            <Legend color="var(--stage-2-ring)" label="novelty" />
            <Legend color="var(--stage-3-ring)" label="recency" />
          </span>
        </div>
        <svg viewBox="0 0 460 140" className="h-[140px] w-full">
          {[0.25, 0.5, 0.75, 1].map((g) => (
            <line key={g} x1={32} x2={448} y1={12 + (1 - g) * 108} y2={12 + (1 - g) * 108} stroke="var(--color-border)" strokeDasharray="2 3" />
          ))}
          {LITERATURE.map((p) => {
            const x = 32 + (p.citations / maxCite) * 410;
            const y = 12 + (1 - p.relevance) * 108;
            const r = 6 + (p.citations / maxCite) * 14;
            const color =
              p.year >= 2024 ? "var(--stage-3-ring)" : p.relevance >= 0.93 ? "var(--stage-2-ring)" : "var(--stage-4-ring)";
            return (
              <g key={p.title}>
                <circle cx={x} cy={y} r={r} fill={color} fillOpacity={0.25} stroke={color} strokeWidth={1.5} />
                <text x={x} y={y + 3} textAnchor="middle" fontSize="8.5" fill="var(--color-ink)" fontWeight={600}>
                  {p.venue}
                </text>
              </g>
            );
          })}
          <text x={32} y={134} fontSize="8.5" fill="var(--color-ink-muted)">low cites</text>
          <text x={448} y={134} textAnchor="end" fontSize="8.5" fill="var(--color-ink-muted)">high cites</text>
          <text x={4} y={16} fontSize="8.5" fill="var(--color-ink-muted)">rel↑</text>
        </svg>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
        {LITERATURE.map((p) => (
          <div
            key={p.title}
            className="rounded-lg border border-border bg-[var(--color-surface)] p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-[12.5px] font-medium leading-snug text-foreground">
                {p.title}
              </div>
              <span className="shrink-0 rounded-md border border-border bg-card px-1.5 py-0.5 text-[10.5px] text-ink-muted">
                {p.venue} {p.year}
              </span>
            </div>
            <div className="mt-1 text-[11.5px] text-ink-muted">{p.contribution}</div>
            <div className="mt-1.5 text-[10.5px] uppercase tracking-wider text-ink-muted">why popular</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {reasonsFor(p).map((r) => (
                <span
                  key={r.k}
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    background: `color-mix(in oklab, ${reasonColor(r.k)} 18%, transparent)`,
                    color: reasonColor(r.k),
                  }}
                >
                  {r.label}
                </span>
              ))}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-ink-muted">
              <span>{p.why}</span>
              <span className="tabular-nums">rel {(p.relevance * 100).toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export function OpportunitiesCard({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <Card
      title="Emerging research opportunities"
      subtitle="Ranked by novelty, feasibility, citation momentum, and strategic fit"
    >
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-[11.5px]">
          <thead className="bg-[var(--color-surface-2)] text-ink-muted">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Direction</th>
              <th className="px-2 py-2 font-medium">Band</th>
              <th className="px-2 py-2 text-right font-medium">Nov.</th>
              <th className="px-2 py-2 text-right font-medium">Feas.</th>
              <th className="px-2 py-2 text-right font-medium">Mom.</th>
              <th className="px-2 py-2 text-right font-medium">Fit</th>
            </tr>
          </thead>
          <tbody>
            {OPPORTUNITIES.map((o) => (
              <tr
                key={o.id}
                onClick={() => onSelect?.(o.id)}
                className={cn(
                  "cursor-pointer border-t border-border hover:bg-[var(--color-surface)]",
                  selected === o.id && "bg-[var(--color-surface)]",
                )}
              >
                <td className="px-3 py-2">
                  <div className="font-medium text-foreground">{o.title}</div>
                  <div className="text-[10.5px] text-ink-muted">{o.question}</div>
                </td>
                <td className="px-2 py-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px]", bandStyle[o.band])}>
                    {o.band}
                  </span>
                </td>
                <td className="px-2 py-2 text-right tabular-nums">{o.novelty}</td>
                <td className="px-2 py-2 text-right tabular-nums">{o.feasibility}</td>
                <td className="px-2 py-2 text-right tabular-nums">{o.momentum}</td>
                <td className="px-2 py-2 text-right tabular-nums">{o.fit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {["arXiv", "Semantic Scholar", "Papers with Code"].map((s) => (
          <SourceChip key={s}>{s}</SourceChip>
        ))}
      </div>
    </Card>
  );
}

export function ApprovalOpportunitiesCard({
  onApprove,
  approved,
}: {
  onApprove: (id: string) => void;
  approved?: string;
}) {
  const [pick, setPick] = useState("o1");
  if (approved) {
    const o = OPPORTUNITIES.find((x) => x.id === approved)!;
    return (
      <Card title="Human approval" subtitle="Direction committed">
        <div className="flex items-start gap-2 rounded-lg border border-border bg-[var(--color-surface)] p-3">
          <Check className="mt-0.5 h-3.5 w-3.5 text-[var(--color-success)]" />
          <div className="text-[12.5px]">
            <div className="font-medium text-foreground">{o.title}</div>
            <div className="text-[11.5px] text-ink-muted">{o.contribution}</div>
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Card title="Approval gate" subtitle="Pick a direction to continue">
      <div className="space-y-1.5">
        {OPPORTUNITIES.map((o) => (
          <label
            key={o.id}
            className={cn(
              "flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 transition-colors",
              pick === o.id ? "border-foreground bg-[var(--color-surface)]" : "border-border bg-card hover:bg-[var(--color-surface)]",
            )}
          >
            <input
              type="radio"
              checked={pick === o.id}
              onChange={() => setPick(o.id)}
              className="mt-1 h-3 w-3 accent-foreground"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-medium">{o.title}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px]", bandStyle[o.band])}>
                  {o.band}
                </span>
              </div>
              <div className="text-[11px] text-ink-muted">{o.whyNow}</div>
            </div>
          </label>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => {
            toast.success("Direction approved — drafting experiment plan.");
            onApprove(pick);
          }}
          className="rounded-full bg-foreground px-3.5 py-1.5 text-[12px] font-medium text-background hover:opacity-90"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          Accept & continue
        </button>
        <button
          onClick={() => toast("Revision requested — re-ranking opportunities.")}
          className="rounded-full border border-border bg-card px-3.5 py-1.5 text-[12px] hover:bg-[var(--color-surface)]"
        >
          Ask for revision
        </button>
        <button
          onClick={() => toast("Opened discussion thread with agent.")}
          className="rounded-full border border-border bg-card px-3.5 py-1.5 text-[12px] hover:bg-[var(--color-surface)]"
        >
          Discuss with agent
        </button>
        <button
          onClick={() => toast("Dismissed.")}
          className="ml-auto rounded-md px-2 py-1.5 text-[12px] text-ink-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}

const DESIGN_VARIANTS = [
  {
    id: "A",
    name: "Lean: single dataset",
    desc: "Waterbirds only · λ=0.3 · 1 seed",
    cost: 8,
    risk: 38,
    impact: 52,
    time: "4 days",
    pick: false,
  },
  {
    id: "B",
    name: "Balanced: 3 datasets + ablation",
    desc: "Waterbirds + CUB-Parts + ImageNet-XAI · λ sweep · 3 seeds",
    cost: 36,
    risk: 18,
    impact: 84,
    time: "2 weeks",
    pick: true,
  },
  {
    id: "C",
    name: "Ambitious: + human study",
    desc: "All 3 datasets + radiologist preference study (n=40)",
    cost: 64,
    risk: 46,
    impact: 92,
    time: "5 weeks",
    pick: false,
  },
];

const RISKS = [
  { label: "Distribution-shift datasets too narrow", severity: "med", mitigation: "Add CelebA-Bias as robustness probe." },
  { label: "λ tuning explodes compute budget", severity: "low", mitigation: "Stop sweep early on plateau (patience=3)." },
  { label: "Reviewer pushback on faithfulness metric", severity: "high", mitigation: "Pre-register protocol + release evaluator code." },
  { label: "Reproducibility gap vs. baseline CBM", severity: "med", mitigation: "Pin seeds + Docker image at submission." },
];

const sevColor = (s: string) =>
  s === "high"
    ? "var(--stage-4-ring)"
    : s === "med"
      ? "var(--stage-0-ring)"
      : "var(--stage-3-ring)";

type ExperimentPlanOutput = {
  hypothesis?: string;
  method?: string;
  datasets?: string[];
  metrics?: string[];
  baselines?: string[];
  resources?: string;
  risks?: string[];
  success_criteria?: string[];
  next_actions?: string[];
  rationale?: string;
};

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return items.length > 0 ? items : undefined;
}

function parseExperimentPlan(output?: string): ExperimentPlanOutput | undefined {
  if (!output) return undefined;
  try {
    const parsed: unknown = JSON.parse(output);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    const raw = parsed as Record<string, unknown>;
    return {
      hypothesis: typeof raw.hypothesis === "string" ? raw.hypothesis : undefined,
      method: typeof raw.method === "string" ? raw.method : undefined,
      datasets: stringArray(raw.datasets),
      metrics: stringArray(raw.metrics),
      baselines: stringArray(raw.baselines),
      resources: typeof raw.resources === "string" ? raw.resources : undefined,
      risks: stringArray(raw.risks),
      success_criteria: stringArray(raw.success_criteria),
      next_actions: stringArray(raw.next_actions),
      rationale: typeof raw.rationale === "string" ? raw.rationale : undefined,
    };
  } catch {
    return undefined;
  }
}

export function ExperimentCard({ step }: { step?: Step }) {
  const [pick, setPick] = useState("B");
  const [open, setOpen] = useState(false);
  const realPlan = parseExperimentPlan(step?.tool?.output);
  const subtitle = realPlan
    ? [realPlan.datasets?.[0], realPlan.metrics?.[0]].filter(Boolean).join(" · ") || "Structured plan from Coding Plan Agent"
    : "Faithful-CBM under distribution shift";
  const risks = realPlan?.risks?.map((risk, index) => ({
    label: risk,
    severity: index === 0 ? "med" : "low",
    mitigation: realPlan.next_actions?.[index] ?? "Track during iteration and request revision if it blocks execution.",
  })) ?? RISKS;

  return (
    <Card
      title="Experiment plan"
      subtitle={subtitle}
      headerRight={
        <button
          onClick={() => setOpen(true)}
          className="rounded-full border border-border bg-card px-2.5 py-1 text-[10.5px] hover:bg-[var(--color-surface)]"
        >
          ↗ Open research timeline
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Hypothesis" value={realPlan?.hypothesis ?? EXPERIMENT.hypothesis} />
        <Field label="Method" value={realPlan?.method ?? EXPERIMENT.method} />
        <Field label="Variables" value={EXPERIMENT.variables.join(" · ")} />
        <Field label="Dataset" value={realPlan?.datasets?.join(", ") ?? EXPERIMENT.dataset} />
        <Field label="Baseline" value={realPlan?.baselines?.join(", ") ?? EXPERIMENT.baseline} />
        <Field label="Metric" value={realPlan?.metrics?.join(", ") ?? EXPERIMENT.metric} />
        <Field label={realPlan ? "Success criteria" : "Contribution"} value={realPlan?.success_criteria?.join(" · ") ?? EXPERIMENT.contribution} />
        <Field label="Resources" value={realPlan?.resources ?? EXPERIMENT.resources} />
      </div>

      {realPlan?.rationale && (
        <div className="mt-3 rounded-lg border border-border bg-[var(--color-surface)] p-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            Agent rationale
          </div>
          <div className="mt-1 text-[11.5px] leading-snug text-foreground">{realPlan.rationale}</div>
        </div>
      )}

      {/* Design variants — comparison */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Iteration suggestions · 3 design variants
          </div>
          <span className="text-[10.5px] text-ink-muted">click to commit</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5 md:grid-cols-3">
          {DESIGN_VARIANTS.map((v) => {
            const selected = pick === v.id;
            return (
              <button
                key={v.id}
                onClick={() => {
                  setPick(v.id);
                  toast.success(`Design ${v.id} selected — agent will iterate accordingly.`);
                }}
                className={cn(
                  "group relative rounded-lg border p-2.5 text-left transition-colors",
                  selected
                    ? "border-foreground bg-[var(--color-surface)]"
                    : "border-border bg-card hover:bg-[var(--color-surface)]",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: `color-mix(in oklab, var(--stage-2-ring) 18%, transparent)`,
                      color: "var(--stage-2-ink)",
                    }}
                  >
                    Variant {v.id}
                  </span>
                  {v.pick && (
                    <span className="text-[9.5px] font-medium text-[var(--success-text)]">
                      AI recommends
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[12px] font-medium">{v.name}</div>
                <div className="text-[10.5px] text-ink-muted">{v.desc}</div>
                {/* mini bars */}
                <div className="mt-2 space-y-1">
                  <MiniBar label="impact" v={v.impact} color="var(--stage-3-ring)" />
                  <MiniBar label="risk" v={v.risk} color="var(--stage-4-ring)" />
                  <MiniBar label="cost" v={v.cost} color="var(--stage-0-ring)" />
                </div>
                <div className="mt-1.5 text-[10px] text-ink-muted">~{v.time}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Risk analysis */}
      <div className="mt-4">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
          Risk analysis
        </div>
        <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
          {risks.map((r) => (
            <div
              key={r.label}
              className="rounded-lg border p-2.5"
              style={{
                background: `color-mix(in oklab, ${sevColor(r.severity)} 9%, var(--color-card))`,
                borderColor: `color-mix(in oklab, ${sevColor(r.severity)} 35%, transparent)`,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[12px] font-medium">{r.label}</span>
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                  style={{
                    background: `color-mix(in oklab, ${sevColor(r.severity)} 22%, transparent)`,
                    color: sevColor(r.severity),
                  }}
                >
                  {r.severity}
                </span>
              </div>
              <div className="mt-1 text-[10.5px] text-ink-muted">
                <span className="font-medium text-foreground">Mitigate:</span> {r.mitigation}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
          Situation diagnosis
        </div>
        <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3">
          {DIAGNOSIS.map((d) => (
            <div
              key={d.label}
              className="rounded-lg border border-border bg-[var(--color-surface)] p-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-medium">{d.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px]",
                    d.status === "OK"
                      ? "bg-[var(--color-surface-2)] text-foreground"
                      : "border border-border text-foreground",
                  )}
                >
                  {d.status}
                </span>
              </div>
              <div className="mt-1 text-[11px] leading-snug text-ink-muted">{d.note}</div>
            </div>
          ))}
        </div>
      </div>

      <ResearchTimelineDialog open={open} onClose={() => setOpen(false)} />
    </Card>
  );
}

function artifactHref(url?: string) {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE}${url}`;
}

function summarizeResults(results: unknown): { label: string; value: string }[] {
  if (!results || typeof results !== "object") return [];
  const rows: { label: string; value: string }[] = [];
  const visit = (prefix: string, value: unknown, depth: number) => {
    if (rows.length >= 10 || depth > 2) return;
    if (value == null) return;
    if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
      rows.push({ label: prefix, value: String(value) });
      return;
    }
    if (Array.isArray(value)) {
      rows.push({ label: prefix, value: `${value.length} item${value.length === 1 ? "" : "s"}` });
      return;
    }
    if (typeof value === "object") {
      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
        visit(prefix ? `${prefix}.${key}` : key, nested, depth + 1);
      }
    }
  };
  visit("", results, 0);
  return rows;
}

export function CodeArtifactsCard({ step }: { step?: Step }) {
  const artifacts = step?.artifacts;
  const resultsRows = summarizeResults(artifacts?.results);
  const primaryCode = artifacts?.codeFiles?.find((file) => file.path.endsWith("run_experiment.py")) ?? artifacts?.codeFiles?.[0];

  return (
    <Card
      title="Code artifacts"
      subtitle={
        artifacts?.found
          ? `${artifacts.projectId ?? "workspace"} · ${artifacts.resultsPath ?? "runtime artifacts"}`
          : "No executed experiment artifacts found yet"
      }
      headerRight={
        <span className="rounded-full bg-[var(--color-surface-2)] px-2.5 py-0.5 text-[10.5px] text-foreground">
          {artifacts?.found ? "real workspace data" : "blueprint only"}
        </span>
      }
    >
      {!artifacts?.found ? (
        <div className="rounded-lg border border-border bg-[var(--color-surface)] p-3 text-[12px] leading-relaxed text-ink-muted">
          {artifacts?.message ?? "The ML Agent has prepared an implementation blueprint, but no executed code, results.json, figures, or PDF were discovered in the Research Claw workspace."}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <ArtifactMetric label="Code files" value={artifacts.codeFiles.length} />
            <ArtifactMetric label="Figures" value={artifacts.figures.length} />
            <ArtifactMetric label="PDFs" value={artifacts.pdfs.length} />
          </div>

          {resultsRows.length > 0 && (
            <div className="rounded-lg border border-border bg-[var(--color-surface)] p-3">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <Braces className="h-3.5 w-3.5" />
                results.json
              </div>
              <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                {resultsRows.map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-3 rounded-md bg-card px-2 py-1.5 text-[11.5px]">
                    <span className="min-w-0 truncate text-ink-muted">{row.label || "result"}</span>
                    <span className="font-medium text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {primaryCode && (
            <div className="rounded-lg border border-border bg-[var(--color-surface)] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  <Code2 className="h-3.5 w-3.5" />
                  <span className="truncate">{primaryCode.path}</span>
                </div>
                {primaryCode.url && (
                  <a
                    href={artifactHref(primaryCode.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10.5px] hover:bg-[var(--color-surface-2)]"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <pre className="max-h-[220px] overflow-auto rounded-md bg-[#111827] p-3 text-[10.5px] leading-relaxed text-slate-100">
                {primaryCode.snippet ?? "No preview available."}
              </pre>
            </div>
          )}

          {(artifacts.figures.length > 0 || artifacts.pdfs.length > 0) && (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {[...artifacts.figures, ...artifacts.pdfs].slice(0, 8).map((file) => (
                <a
                  key={file.path}
                  href={artifactHref(file.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[11.5px] hover:bg-[var(--color-surface)]"
                >
                  <span className="min-w-0 truncate">{file.path}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function ArtifactMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-[var(--color-surface)] p-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">{label}</div>
      <div className="mt-1 text-[18px] font-semibold text-foreground">{value}</div>
    </div>
  );
}

type WritingDraftOutput = {
  title?: string;
  abstract?: string;
  outline?: string[];
  claims?: string[];
  limitations?: string[];
  next_writing_actions?: string[];
  rationale?: string;
};

function parseWritingDraft(output?: string): WritingDraftOutput | undefined {
  if (!output) return undefined;
  try {
    const parsed: unknown = JSON.parse(output);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    const raw = parsed as Record<string, unknown>;
    return {
      title: typeof raw.title === "string" ? raw.title : undefined,
      abstract: typeof raw.abstract === "string" ? raw.abstract : undefined,
      outline: stringArray(raw.outline),
      claims: stringArray(raw.claims),
      limitations: stringArray(raw.limitations),
      next_writing_actions: stringArray(raw.next_writing_actions),
      rationale: typeof raw.rationale === "string" ? raw.rationale : undefined,
    };
  } catch {
    return undefined;
  }
}

function MiniBar({ label, v, color }: { label: string; v: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-9 text-[9px] uppercase tracking-wider text-ink-muted">{label}</span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        <div className="h-full rounded-full" style={{ width: `${v}%`, background: color }} />
      </div>
      <span className="w-6 text-right text-[9.5px] tabular-nums text-ink-muted">{v}</span>
    </div>
  );
}

function ResearchTimelineDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const milestones = [
    { t: "Day 0", stage: 0, title: "Goal parsed", note: "XAI-vision objective committed" },
    { t: "Day 1", stage: 1, title: "Survey complete", note: "184 → 4 anchor papers" },
    { t: "Day 2", stage: 0, title: "Opportunity locked", note: "Evaluation-first benchmark" },
    { t: "Day 3", stage: 2, title: "Plan v1 + risks", note: "3 design variants compared" },
    { t: "Day 5", stage: 3, title: "Exp 2 → AI feedback", note: "λ raised to 0.6" },
    { t: "Day 7", stage: 3, title: "Exp 4 → human revision", note: "Faith@K 0.74" },
    { t: "Day 9", stage: 4, title: "Abstract v1 drafted", note: "178 words · concise" },
    { t: "Day 10", stage: 5, title: "ICLR'25 packaged", note: "OpenReview + Overleaf ready" },
  ];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-xl border border-border bg-card p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[14px] font-semibold">Research timeline · Faithful-CBM</div>
            <div className="text-[11.5px] text-ink-muted">Live evolution of the project, stage by stage</div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-ink-muted hover:bg-[var(--color-surface)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Horizontal timeline */}
        <div className="relative mt-5 overflow-x-auto scrollbar-thin pb-2">
          <div className="relative flex min-w-[720px] items-stretch gap-3">
            <div className="absolute left-0 right-0 top-[18px] h-px bg-border" />
            {milestones.map((m, i) => (
              <div key={i} className="relative flex-1 min-w-[120px]">
                <div className="relative z-10 grid h-9 w-9 place-items-center rounded-full border-2 bg-card"
                  style={{ borderColor: `var(--stage-${m.stage}-ring)` }}>
                  <span className="text-[10px] font-semibold" style={{ color: `var(--stage-${m.stage}-ink)` }}>
                    {i + 1}
                  </span>
                </div>
                <div
                  className="mt-2 rounded-lg border p-2"
                  style={{
                    background: `var(--stage-${m.stage}-bg)`,
                    borderColor: `color-mix(in oklab, var(--stage-${m.stage}-ring) 30%, transparent)`,
                  }}
                >
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: `var(--stage-${m.stage}-ink)` }}>
                    {m.t}
                  </div>
                  <div className="mt-0.5 text-[11.5px] font-medium leading-snug">{m.title}</div>
                  <div className="text-[10.5px] text-ink-muted">{m.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini progress curve */}
        <div className="mt-4 rounded-lg border border-border bg-[var(--color-surface)] p-3">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Objective progress over iterations
          </div>
          <svg viewBox="0 0 600 110" className="h-[110px] w-full">
            <defs>
              <linearGradient id="prog" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--stage-3-ring)" stopOpacity="0.45" />
                <stop offset="100%" stopColor="var(--stage-3-ring)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {ITERATIONS.map((p, i) => {
              const x = 30 + (i / (ITERATIONS.length - 1)) * 540;
              const y = 95 - p.y * 80;
              const nx = i < ITERATIONS.length - 1 ? 30 + ((i + 1) / (ITERATIONS.length - 1)) * 540 : x;
              const ny = i < ITERATIONS.length - 1 ? 95 - ITERATIONS[i + 1].y * 80 : y;
              return (
                <g key={i}>
                  {i < ITERATIONS.length - 1 && (
                    <line x1={x} y1={y} x2={nx} y2={ny} stroke="var(--stage-3-ring)" strokeWidth={2} />
                  )}
                  <circle cx={x} cy={y} r={5} fill="var(--stage-3-ring)" />
                  <text x={x} y={y - 8} textAnchor="middle" fontSize="9.5" fill="var(--color-ink)">{p.label}</text>
                  <text x={x} y={108} textAnchor="middle" fontSize="9" fill="var(--color-ink-muted)">{p.note}</text>
                </g>
              );
            })}
            <path
              d={`M 30 95 ${ITERATIONS.map((p, i) => `L ${30 + (i / (ITERATIONS.length - 1)) * 540} ${95 - p.y * 80}`).join(" ")} L 570 95 Z`}
              fill="url(#prog)"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}


type JudgeFeedbackOutput = {
  verdict?: string;
  strengths?: string[];
  issues?: string[];
  required_fixes?: string[];
  approval_recommendation?: string;
  risk_level?: string;
  checked_against?: string[];
};

function parseJudgeFeedback(output?: string): JudgeFeedbackOutput | undefined {
  if (!output) return undefined;
  try {
    const parsed: unknown = JSON.parse(output);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    const raw = parsed as Record<string, unknown>;
    return {
      verdict: typeof raw.verdict === "string" ? raw.verdict : undefined,
      strengths: stringArray(raw.strengths),
      issues: stringArray(raw.issues),
      required_fixes: stringArray(raw.required_fixes),
      approval_recommendation: typeof raw.approval_recommendation === "string" ? raw.approval_recommendation : undefined,
      risk_level: typeof raw.risk_level === "string" ? raw.risk_level : undefined,
      checked_against: stringArray(raw.checked_against),
    };
  } catch {
    return undefined;
  }
}

export function IterationCard({ step }: { step?: Step }) {
  const feedback = parseJudgeFeedback(step?.tool?.output);
  const artifacts = step?.artifacts;

  return (
    <Card
      title={feedback ? "Judge feedback" : "AutoResearch progress"}
      subtitle={feedback?.approval_recommendation ?? "Iterations toward research objective"}
      headerRight={
        <span
          className="rounded-full px-2.5 py-0.5 text-[10.5px] font-medium text-foreground"
          style={{
            background: "color-mix(in srgb, var(--brand-blue) 26%, white)",
            fontFamily: "var(--font-ui)",
          }}
        >
          {feedback ? `${feedback.verdict ?? "needs_review"} · ${feedback.risk_level ?? "risk unknown"}` : "objective progress +34%"}
        </span>
      }
    >
      {artifacts?.found ? (
        <div className="rounded-lg border border-border bg-[var(--color-surface)] p-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Runtime artifacts
          </div>
          <div className="mt-1 text-[12px] leading-relaxed text-foreground">
            Loaded real workspace artifacts from {artifacts.projectId}
            {artifacts.resultsPath ? ` (${artifacts.resultsPath})` : ""}. Metric plotting for this JSON schema is not mapped yet, so no synthetic curve is shown.
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-[var(--color-surface)] p-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Blueprint review only
          </div>
          <div className="mt-1 text-[12px] leading-relaxed text-foreground">
            No executed experiment metrics were discovered. The judge feedback below reviews the ML blueprint and readiness risks, not completed experimental evidence.
          </div>
        </div>
      )}

      <div className="mt-3 space-y-1.5">
        <div className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
          {feedback ? "Judge review of ML blueprint" : "AI feedback on Version 1"}
        </div>
        <div className="rounded-xl border border-border bg-[var(--color-surface)] p-3 text-[12px]">
          {feedback ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <ListPanel title="Strengths" items={feedback.strengths} fallback="No strengths returned." />
              <ListPanel title="Issues" items={feedback.issues} fallback="No issues returned." />
              <ListPanel title="Required fixes" items={feedback.required_fixes} fallback="No required fixes returned." />
              <ListPanel title="Checked against" items={feedback.checked_against} fallback="No check scope returned." />
            </div>
          ) : (
            <>
              <div className="text-foreground">
                Faithfulness loss weight is too low; perturbation schedule clips at shift severity 0.4.
              </div>
              <div className="mt-1 text-[11px] text-ink-muted">
                Suggested change: raise λ to 0.6 and extend schedule to 0.7 · expected Faithfulness@K +0.12 · confidence 0.78
              </div>
            </>
          )}
          <div className="mt-2 flex gap-1.5">
            <Btn primary onClick={() => toast.success("Applied: λ=0.6, schedule→0.7")}>Accept</Btn>
            <Btn onClick={() => toast("Rejected AI suggestion.")}>Reject</Btn>
            <Btn onClick={() => toast("Asked agent for revised suggestion.")}>Ask for revision</Btn>
            <Btn onClick={() => toast("Opened discussion thread.")}>
              <MessageSquare className="h-3 w-3" /> Discuss
            </Btn>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function AbstractCard({ step }: { step?: Step }) {
  const [style, setStyle] = useState("Concise conference");
  const [exported, setExported] = useState<string | null>(null);
  const draft = parseWritingDraft(step?.tool?.output);
  const abstract = draft?.abstract ?? ABSTRACT_DRAFT;
  const wordCount = abstract.trim().split(/\s+/).filter(Boolean).length;
  const pdfArtifact = step?.artifacts?.pdfs?.find((item) => item.path.endsWith("main.pdf")) ?? step?.artifacts?.pdfs?.[0];
  const exportPdf = () => {
    const href = artifactHref(pdfArtifact?.url);
    if (href) {
      window.open(href, "_blank", "noopener,noreferrer");
      setExported(`Opened compiled PDF: ${pdfArtifact?.path}`);
      return;
    }
    setExported("No compiled PDF artifact found yet.");
  };

  return (
    <Card title="Writing studio · abstract" subtitle={draft?.title ?? "Draft from notes + experiment results"}>
      <div className="mb-2 flex flex-wrap gap-1">
        {ABSTRACT_STYLES.map((s) => (
          <button
            key={s}
            onClick={() => setStyle(s)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
              style === s
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-ink-muted hover:text-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-[var(--color-surface)]">
        <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-[11px] text-ink-muted">
          <span>Abstract · v1 · {style}</span>
          <span>{wordCount} words</span>
        </div>
        <div className="space-y-2 p-3 text-[12.5px] leading-relaxed text-foreground">
          <p className="rounded border border-transparent p-1.5 hover:border-border">
            {abstract}
          </p>
          <div className="flex flex-wrap gap-1">
            {["Approve paragraph", "Rewrite more academic", "Make clearer", "Add stronger hook", "Shorten"].map(
              (a) => (
                <Btn key={a} onClick={() => toast(`${a} · applied to paragraph`)}>{a}</Btn>
              ),
            )}
          </div>
        </div>
      </div>

      {draft && (
        <div className="mt-3 grid grid-cols-1 gap-1.5 md:grid-cols-2">
          <ListPanel title="Claims" items={draft.claims} fallback="No claims returned yet." />
          <ListPanel title="Limitations" items={draft.limitations} fallback="No limitations returned yet." />
          <ListPanel title="Outline" items={draft.outline} fallback="No outline returned yet." />
          <ListPanel title="Next actions" items={draft.next_writing_actions} fallback="No writing actions returned yet." />
        </div>
      )}

      {draft?.rationale && (
        <div className="mt-3 rounded-lg border border-border bg-[var(--color-surface)] p-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            Agent rationale
          </div>
          <div className="mt-1 text-[11.5px] leading-snug text-foreground">{draft.rationale}</div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Btn primary onClick={exportPdf}>
          <Download className="h-3 w-3" /> Export PDF
        </Btn>
        <Btn onClick={() => setExported("Overleaf handoff prepared · open in Overleaf.")}>
          <ExternalLink className="h-3 w-3" /> Open in Overleaf
        </Btn>
        <Btn onClick={() => setExported("LaTeX source copied to clipboard.")}>
          <FileText className="h-3 w-3" /> LaTeX source
        </Btn>
      </div>
      {exported && (
        <div className="mt-2 rounded-md border border-border bg-[var(--color-surface)] px-2.5 py-1.5 text-[11.5px] text-ink-muted">
          <Check className="mr-1 inline h-3 w-3 text-[var(--color-success)]" />
          {exported}
        </div>
      )}
    </Card>
  );
}

function ListPanel({ title, items, fallback }: { title: string; items?: string[]; fallback: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">{title}</div>
      <ul className="mt-1.5 space-y-1 text-[11.5px] leading-snug text-foreground">
        {(items && items.length > 0 ? items : [fallback]).map((item) => (
          <li key={item} className="flex gap-1.5">
            <span className="mt-[0.45em] h-1 w-1 shrink-0 rounded-full bg-ink-muted" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PublishCard() {
  return (
    <Card title="Publish & influence" subtitle="Research launchpad">
      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-5">
        {PLATFORMS.map((p) => (
          <div
            key={p.name}
            className="rounded-lg border border-border bg-[var(--color-surface)] p-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium">{p.name}</span>
              <GitBranch className="h-3 w-3 text-ink-muted" />
            </div>
            <div className="mt-1 text-[10.5px] leading-snug text-ink-muted">{p.action}</div>
            <button
              onClick={() => toast.success(`${p.name} · ${p.action} — handoff prepared`)}
              className="mt-2 inline-flex items-center gap-1 text-[10.5px] text-foreground hover:underline"
            >
              Prepare <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ConferencesCard() {
  return (
    <Card title="Incoming conferences" subtitle="Matched against your draft">
      <div className="space-y-2">
        {CONFERENCES.map((c) => (
          <div key={c.name} className="rounded-lg border border-border bg-[var(--color-surface)] p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[13px] font-medium">{c.name}</div>
                <div className="text-[11px] text-ink-muted">{c.format} · {c.next}</div>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="tabular-nums text-ink-muted">fit {c.fit}</span>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-foreground hover:underline"
                >
                  site <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-5 gap-1 text-[10.5px]">
              {[
                ["Abstract", c.abstract],
                ["Full paper", c.full],
                ["Notify", c.notify],
                ["Camera ready", c.cameraReady],
                ["Submission", c.deadline],
              ].map(([k, v]) => (
                <div key={k} className="rounded border border-border bg-card px-1.5 py-1">
                  <div className="text-ink-muted">{k}</div>
                  <div className="tabular-nums text-foreground">{v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

type MemorySummaryOutput = {
  run_id?: string;
  task?: string;
  completed_steps?: string[];
  draft_title?: string;
  remaining_work?: string[];
};

function parseMemorySummary(output?: string): MemorySummaryOutput | undefined {
  if (!output) return undefined;
  try {
    const parsed: unknown = JSON.parse(output);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    const raw = parsed as Record<string, unknown>;
    return {
      run_id: typeof raw.run_id === "string" ? raw.run_id : undefined,
      task: typeof raw.task === "string" ? raw.task : undefined,
      completed_steps: stringArray(raw.completed_steps),
      draft_title: typeof raw.draft_title === "string" ? raw.draft_title : undefined,
      remaining_work: stringArray(raw.remaining_work),
    };
  } catch {
    return undefined;
  }
}

export function MemoryCard({ step }: { step?: Step }) {
  const [sent, setSent] = useState(false);
  const memory = parseMemorySummary(step?.tool?.output);
  const notifications = memory
    ? [
        {
          id: "draft",
          text: `Draft tracked: ${memory.draft_title ?? "untitled research narrative"}.`,
        },
        {
          id: "steps",
          text: `Completed steps recorded: ${memory.completed_steps?.join(", ") ?? "none"}.`,
        },
        ...(memory.remaining_work ?? []).map((item, index) => ({
          id: `remaining-${index}`,
          text: `Remaining work: ${item}`,
        })),
      ]
    : MEMORY_NOTIFICATIONS;
  return (
    <Card title="Memory & Growing" subtitle={memory?.task ?? "Researcher signals queued for you"}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_240px]">
        <div className="space-y-1.5">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-2 rounded-lg border border-border bg-[var(--color-surface)] px-3 py-2"
            >
              <Bell className="mt-0.5 h-3.5 w-3.5 text-ink-muted" />
              <div className="text-[12px] leading-snug">{n.text}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-[var(--color-surface)] p-3">
            <div className="mx-auto max-w-[180px] rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-quiet)]">
              <div className="flex items-center gap-1.5 text-[10px] text-ink-muted">
                <FileText className="h-3 w-3" /> Nobli
              </div>
              <div className="mt-1 text-[11px] font-medium">
                {memory ? "Run memory snapshot" : "Weekly research digest"}
              </div>
            <div className="mt-0.5 text-[10.5px] leading-snug text-ink-muted">
              {memory
                ? `${memory.completed_steps?.length ?? 0} steps · ${memory.remaining_work?.length ?? 0} actions left.`
                : "5 signals waiting. Tap to review."}
            </div>
          </div>
          <button
            onClick={() => setSent(true)}
            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-[12px] font-medium text-background hover:opacity-90"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            <Smartphone className="h-3 w-3" /> Send to phone
          </button>
          {sent && (
            <div className="mt-1.5 text-center text-[10.5px] text-[var(--color-success)]">
              <Check className="mr-1 inline h-3 w-3" />
              Reminder sent to mobile.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ---------- shared primitives ---------- */

function Card({
  title,
  subtitle,
  headerRight,
  children,
}: {
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[24px] border border-border bg-card p-4"
      style={{ boxShadow: "var(--shadow-quiet)", backdropFilter: "blur(10px)" }}
    >
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div>
          <div
            className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            <BookOpen className="h-3 w-3 text-ink-muted" />
            {title}
          </div>
          {subtitle && <div className="text-[11px] text-ink-muted">{subtitle}</div>}
        </div>
        {headerRight}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-[var(--color-surface)] p-2.5">
      <div
        className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-muted"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        {label}
      </div>
      <div className="mt-0.5 text-[12px] leading-snug text-foreground">{value}</div>
    </div>
  );
}

function SourceChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[10.5px] text-ink-muted">
      <span className="h-1 w-1 rounded-full bg-ink-muted" />
      {children}
    </span>
  );
}

function Btn({
  children,
  primary,
  onClick,
}: {
  children: React.ReactNode;
  primary?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] transition-colors",
        primary
          ? "bg-foreground text-background hover:opacity-90"
          : "border border-border bg-card text-foreground hover:bg-[var(--color-surface)]",
      )}
      style={{ fontFamily: "var(--font-ui)" }}
    >
      {children}
    </button>
  );
}

export { Card as OutputCard };

/* Re-export Send icon use to silence unused import if any */
export const _icons = { Send };
