import { useEffect, useMemo, useState } from "react";
import {
  BookText,
  Check,
  MessageSquareQuote,
} from "lucide-react";
import { toast } from "sonner";
import { ABSTRACT_DRAFT, EXPERIMENT, ITERATIONS, LITERATURE, type Step } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Tab = "Paper" | "PDF Preview" | "LaTeX";
type PassageId = "abstract" | "intro" | "related" | "method" | "experiments" | "discussion" | "conclusion";

type Reference = {
  id: number;
  text: string;
};

type Passage = {
  id: PassageId;
  heading: string;
  body: string;
};

type VenueCheck = {
  label: string;
  done: boolean;
};

type MutationItem = {
  id: string;
  title: string;
  note: string;
  status: "done" | "live" | "pending";
};

type LaureateInsight = {
  label: string;
  body: string;
};

type ReviewerGhost = {
  id: string;
  reviewer: string;
  angle: string;
  tone: "method" | "novelty" | "harsh";
  comment: string;
  citation: string;
  rewrite: string;
};

type AcceptedGhost = {
  passageId: PassageId;
  reviewer: string;
  citation: string;
  rewrite: string;
};

type Paper = {
  title: string;
  authors: { name: string; aff: number }[];
  affiliations: string[];
  abstract: Passage;
  abstractVersion: string;
  keywords: string[];
  sections: Passage[];
  references: Reference[];
  artifacts: {
    figure1: boolean;
    figure2: boolean;
    table1: boolean;
    venueChecks: VenueCheck[];
    mutationFeed: MutationItem[];
    packageState: string;
  };
};

type PaperProgress = {
  hasExperimentPlan: boolean;
  hasIterationResults: boolean;
  hasAbstractDraft: boolean;
  hasLaunchpad: boolean;
  hasConferenceMatch: boolean;
  hasMemorySync: boolean;
};

type WritingDraftOutput = {
  title?: string;
  abstract?: string;
  outline?: string[];
  claims?: string[];
  limitations?: string[];
  next_writing_actions?: string[];
  rationale?: string;
};

const PASSAGE_LABEL: Record<PassageId, string> = {
  abstract: "Abstract",
  intro: "Introduction",
  related: "Related Work",
  method: "Method",
  experiments: "Experiments",
  discussion: "Discussion",
  conclusion: "Conclusion",
};

export function FinalPaperViewer({
  task,
  currentStage,
  steps,
}: {
  task: string;
  currentStage: number;
  steps: Step[];
}) {
  const [tab, setTab] = useState<Tab>("PDF Preview");
  const [copied, setCopied] = useState(false);
  const [lensOpen, setLensOpen] = useState(false);
  const [selectedPassageId, setSelectedPassageId] = useState<PassageId | null>(null);
  const [acceptedGhosts, setAcceptedGhosts] = useState<Partial<Record<PassageId, AcceptedGhost>>>({});

  useEffect(() => {
    setAcceptedGhosts({});
    setSelectedPassageId(null);
    setLensOpen(false);
    setTab("PDF Preview");
  }, [task]);

  const progress = useMemo(() => derivePaperProgress(steps, currentStage), [steps, currentStage]);
  const writingDraft = useMemo(() => getWritingDraft(steps), [steps]);
  const basePaper = useMemo(() => buildPaper(task, progress, writingDraft), [task, progress, writingDraft]);
  const paper = useMemo(() => applyAcceptedGhosts(basePaper, acceptedGhosts), [basePaper, acceptedGhosts]);
  const completeness = useMemo(() => {
    const base = Math.min(100, Math.round(((currentStage + 1) / 7) * 100));
    const acceptedBonus = Math.min(10, Object.keys(acceptedGhosts).length * 3);
    return Math.min(100, base + acceptedBonus);
  }, [acceptedGhosts, currentStage]);
  const latex = useMemo(() => buildLatex(paper), [paper]);
  const laureateLens = useMemo(
    () => buildLaureateLens(task, paper, progress),
    [task, paper, progress],
  );
  const selectedPassage = useMemo(() => getPassageById(paper, selectedPassageId), [paper, selectedPassageId]);
  const reviewerGhosts = useMemo(
    () => (selectedPassage ? buildReviewerGhosts(selectedPassage, progress) : []),
    [selectedPassage, progress],
  );

  const copyLatex = async () => {
    try {
      await navigator.clipboard.writeText(latex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const acceptGhost = (ghost: ReviewerGhost) => {
    if (!selectedPassage) return;
    setAcceptedGhosts((prev) => ({
      ...prev,
      [selectedPassage.id]: {
        passageId: selectedPassage.id,
        reviewer: ghost.reviewer,
        citation: ghost.citation,
        rewrite: ghost.rewrite,
      },
    }));
    toast.success(`${ghost.reviewer} accepted - paper updated.`);
  };

  return (
    <aside
      className="hidden h-full w-[392px] shrink-0 flex-col border-l border-border bg-[var(--color-sidebar)] min-[1101px]:flex"
      style={{ boxShadow: "inset 1px 0 0 rgba(255,255,255,0.48)" }}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div
            className="text-[12px] font-semibold tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            Final Paper
          </div>
          <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-ink-muted tabular-nums">
            {completeness}% drafted
          </span>
        </div>
        <div className="flex items-center gap-1">
          <ActionBtn label="Laureate Lens" onClick={() => setLensOpen((v) => !v)} />
          <ActionBtn label="Download PDF" onClick={() => toast.success("PDF prepared")} />
          <ActionBtn label="Overleaf" onClick={() => toast.success("Overleaf handoff prepared")} />
          <ActionBtn label={copied ? "Copied" : "Copy LaTeX"} onClick={copyLatex} />
        </div>
      </div>

      <div className="flex items-center gap-0 border-b border-border bg-[var(--color-sidebar)] px-3">
        {(["Paper", "PDF Preview", "LaTeX"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative rounded-full px-3 py-2 text-[11.5px] transition-colors",
              tab === t ? "text-foreground" : "text-ink-muted hover:text-foreground",
            )}
            style={
              tab === t
                ? {
                    background: "color-mix(in srgb, var(--brand-blue) 18%, transparent)",
                    fontFamily: "var(--font-ui)",
                  }
                : { fontFamily: "var(--font-ui)" }
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin bg-[var(--color-surface-2)] p-4">
        <div className="space-y-3">
          <MutationPanel
            feed={paper.artifacts.mutationFeed}
            venueChecks={paper.artifacts.venueChecks}
            packageState={paper.artifacts.packageState}
          />

          {lensOpen && <LaureateLensPanel insights={laureateLens} />}

          {tab === "Paper" && !selectedPassage && (
            <div className="rounded-[18px] border border-border bg-card px-3 py-2.5 text-[11.5px] text-ink-muted">
              Click any paragraph in the paper to summon Reviewer Ghosts and apply a rewrite.
            </div>
          )}

          {tab === "Paper" && selectedPassage && (
            <ReviewerGhostsPanel
              ghosts={reviewerGhosts}
              selectedPassageLabel={selectedPassage.heading}
              acceptedReviewer={acceptedGhosts[selectedPassage.id]?.reviewer}
              onAccept={acceptGhost}
            />
          )}

          {tab === "Paper" && (
            <PaperPage
              paper={paper}
              selectedPassageId={selectedPassageId}
              onSelectPassage={setSelectedPassageId}
            />
          )}

          {tab === "PDF Preview" && (
            <div className="space-y-3">
              <PaperPage
                paper={paper}
                pageNumber={1}
                selectedPassageId={selectedPassageId}
                onSelectPassage={setSelectedPassageId}
              />
              <PaperPage
                paper={paper}
                pageNumber={2}
                continuation
                selectedPassageId={selectedPassageId}
                onSelectPassage={setSelectedPassageId}
              />
            </div>
          )}

          {tab === "LaTeX" && <LatexView source={latex} />}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border px-3 py-1.5 text-[10.5px] text-ink-muted">
        <span>Auto-synced with workflow</span>
        <span className="tabular-nums">{paper.references.length} refs · {paper.abstractVersion}</span>
      </div>
    </aside>
  );
}

function ActionBtn({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-border bg-card px-2.5 py-1 text-[10.5px] text-foreground transition-colors hover:bg-[var(--color-accent)]"
      style={{ fontFamily: "var(--font-ui)" }}
    >
      {label}
    </button>
  );
}

function MutationPanel({
  feed,
  venueChecks,
  packageState,
}: {
  feed: MutationItem[];
  venueChecks: VenueCheck[];
  packageState: string;
}) {
  return (
    <section
      className="rounded-[22px] border border-border bg-card p-3"
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div
            className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-ink-muted"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            Live Paper Mutation
          </div>
          <div className="mt-1 text-[13px] leading-[1.55] text-foreground">
            The paper updates as the writing workflow lands new artifacts.
          </div>
        </div>
        <div className="rounded-full border border-border bg-[var(--color-surface)] px-2 py-1 text-[10.5px] text-foreground">
          {packageState}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {feed.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-2 rounded-2xl border border-border bg-[var(--color-surface)] px-3 py-2.5"
          >
            <span
              className={cn(
                "mt-0.5 inline-flex h-2 w-2 rounded-full",
                item.status === "done" && "bg-[var(--color-success)]",
                item.status === "live" && "bg-[var(--stage-0-ring)]",
                item.status === "pending" && "bg-border",
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-medium text-foreground">{item.title}</div>
              <div className="text-[11px] leading-[1.55] text-ink-muted">{item.note}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {venueChecks.map((check) => (
          <div
            key={check.label}
            className="flex items-center gap-2 rounded-2xl border border-border bg-card px-2.5 py-2 text-[11px]"
          >
            <span
              className={cn(
                "grid h-4 w-4 place-items-center rounded-full border",
                check.done
                  ? "border-transparent bg-[var(--success-bg)] text-[var(--success-text)]"
                  : "border-border text-ink-muted",
              )}
            >
              {check.done ? <Check className="h-2.5 w-2.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-border" />}
            </span>
            <span className={check.done ? "text-foreground" : "text-ink-muted"}>{check.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function LaureateLensPanel({ insights }: { insights: LaureateInsight[] }) {
  return (
    <section
      className="rounded-[22px] border border-border bg-card p-3"
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <div className="flex items-center gap-2">
        <BookText className="h-4 w-4 text-foreground" />
        <div
          className="text-[12px] font-semibold text-foreground"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          Laureate Lens
        </div>
      </div>
      <div className="mt-1 text-[11.5px] leading-[1.6] text-ink-muted">
        How would a top scientist think through this paper right now?
      </div>

      <div className="mt-3 space-y-2">
        {insights.map((insight) => (
          <div
            key={insight.label}
            className="rounded-[18px] border border-border bg-[var(--color-surface)] px-3 py-2.5"
          >
            <div
              className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-muted"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {insight.label}
            </div>
            <div className="mt-1 text-[12px] leading-[1.6] text-foreground">{insight.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewerGhostsPanel({
  ghosts,
  selectedPassageLabel,
  acceptedReviewer,
  onAccept,
}: {
  ghosts: ReviewerGhost[];
  selectedPassageLabel: string;
  acceptedReviewer?: string;
  onAccept: (ghost: ReviewerGhost) => void;
}) {
  return (
    <section
      className="rounded-[22px] border border-border bg-card p-3"
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div
            className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-ink-muted"
            style={{ fontFamily: "var(--font-ui)" }}
          >
            Reviewer Ghosts
          </div>
          <div className="mt-1 text-[13px] text-foreground">
            Clicked passage: <span className="font-medium">{selectedPassageLabel}</span>
          </div>
        </div>
        {acceptedReviewer && (
          <div className="rounded-full border border-border bg-[var(--success-bg)] px-2 py-1 text-[10.5px] text-[var(--success-text)]">
            Applied {acceptedReviewer}
          </div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {ghosts.map((ghost) => (
          <div
            key={ghost.id}
            className="rounded-[18px] border border-border bg-[var(--color-surface)] px-3 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px]"
                    style={{
                      background:
                        ghost.tone === "method"
                          ? "color-mix(in srgb, var(--brand-blue) 22%, white)"
                          : ghost.tone === "novelty"
                            ? "color-mix(in srgb, var(--brand-mint) 34%, white)"
                            : "color-mix(in srgb, var(--brand-orange) 20%, white)",
                      color:
                        ghost.tone === "method"
                          ? "var(--stage-1-ink)"
                          : ghost.tone === "novelty"
                            ? "var(--stage-3-ink)"
                            : "var(--stage-4-ink)",
                      fontFamily: "var(--font-ui)",
                    }}
                  >
                    {ghost.reviewer}
                  </span>
                  <span className="text-[10.5px] text-ink-muted">{ghost.angle}</span>
                </div>
                <div className="mt-2 text-[12px] leading-[1.6] text-foreground">{ghost.comment}</div>
              </div>
              <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
            </div>

            <div className="mt-2 rounded-2xl border border-border bg-card px-2.5 py-2">
              <div
                className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-muted"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                Suggested citation
              </div>
              <div className="mt-1 text-[11.5px] leading-[1.55] text-foreground">{ghost.citation}</div>
            </div>

            <div className="mt-2 rounded-2xl border border-border bg-card px-2.5 py-2">
              <div
                className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-muted"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                Rewrite suggestion
              </div>
              <div className="mt-1 text-[11.5px] leading-[1.6] text-foreground">{ghost.rewrite}</div>
            </div>

            <div className="mt-2.5 flex items-center gap-1.5">
              <button
                onClick={() => onAccept(ghost)}
                className="rounded-full bg-foreground px-3 py-1.5 text-[11px] font-medium text-background hover:opacity-90"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                Accept
              </button>
              <button
                onClick={() => toast("Kept as note only - no rewrite applied.")}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-foreground hover:bg-[var(--color-surface-2)]"
              >
                Keep as note
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PaperPage({
  paper,
  pageNumber = 1,
  continuation = false,
  selectedPassageId,
  onSelectPassage,
}: {
  paper: Paper;
  pageNumber?: number;
  continuation?: boolean;
  selectedPassageId: PassageId | null;
  onSelectPassage: (id: PassageId) => void;
}) {
  const visibleSections = continuation ? paper.sections.slice(3) : paper.sections.slice(0, 4);

  return (
    <div
      className="relative mx-auto border border-[rgba(17,24,39,0.08)] bg-white text-[#111] shadow-[0_6px_24px_rgba(15,23,42,0.08)]"
      style={{ width: "100%", aspectRatio: "8.5 / 11", padding: "28px 26px 36px" }}
    >
      {!continuation ? (
        <>
          <h1
            className="text-center font-serif leading-tight text-[#111]"
            style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 16, fontWeight: 700 }}
          >
            {paper.title}
          </h1>

          <div
            className="mt-2 text-center"
            style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 10 }}
          >
            {paper.authors.map((a, i) => (
              <span key={a.name}>
                {a.name}
                <sup>{a.aff}</sup>
                {i < paper.authors.length - 1 && <span>, </span>}
              </span>
            ))}
          </div>

          <div
            className="mt-1 text-center italic text-[#444]"
            style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 8.5 }}
          >
            {paper.affiliations.map((aff, i) => (
              <div key={aff}>
                <sup>{i + 1}</sup> {aff}
              </div>
            ))}
          </div>

          <div className="mx-6 mt-3">
            <div
              className="text-center font-bold"
              style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 10 }}
            >
              Abstract
            </div>
            <PassageButton
              selected={selectedPassageId === "abstract"}
              onClick={() => onSelectPassage("abstract")}
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 8.5,
                lineHeight: 1.35,
                textAlign: "justify",
              }}
            >
              {paper.abstract.body}
            </PassageButton>
            <p
              className="mt-1.5 text-justify"
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 8.5,
                lineHeight: 1.35,
              }}
            >
              <span className="italic font-semibold">Keywords - </span>
              {paper.keywords.join(", ")}
            </p>
          </div>
        </>
      ) : (
        <div
          className="text-right text-[#666]"
          style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 8 }}
        >
          {paper.title.split(":")[0]} - continued
        </div>
      )}

      <div
        className="mt-3"
        style={{
          columnCount: 2,
          columnGap: 14,
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: 8,
          lineHeight: 1.35,
          textAlign: "justify",
          color: "#111",
        }}
      >
        {visibleSections.map((section, idx) => (
          <div key={section.id} className="mb-2" style={{ breakInside: "avoid-column" }}>
            <div className="font-bold" style={{ fontSize: 9 }}>
              {section.heading}
            </div>
            <PassageButton
              selected={selectedPassageId === section.id}
              onClick={() => onSelectPassage(section.id)}
              className="mt-0.5"
              style={{ fontSize: 8, lineHeight: 1.35, textAlign: "justify" }}
            >
              {section.body}
            </PassageButton>

            {!continuation && idx === 1 && paper.artifacts.figure1 && (
              <div
                className="my-1.5 flex flex-col items-center"
                style={{ breakInside: "avoid-column" }}
              >
                <svg viewBox="0 0 220 70" className="w-full border border-[#bbb] bg-[#fafafa]" style={{ height: 70 }}>
                  <rect x="4" y="26" width="28" height="18" fill="#e8efff" stroke="#3b5bdb" strokeWidth="0.6" />
                  <text x="18" y="38" textAnchor="middle" fontSize="5.5" fill="#1f2937">x</text>
                  <rect x="40" y="20" width="38" height="30" fill="#fff" stroke="#111" strokeWidth="0.6" />
                  <text x="59" y="37" textAnchor="middle" fontSize="5.5" fill="#111">Encoder f</text>
                  <rect x="88" y="14" width="42" height="42" fill="#fef3c7" stroke="#b45309" strokeWidth="0.6" />
                  <text x="109" y="30" textAnchor="middle" fontSize="5.5" fill="#111">Concept</text>
                  <text x="109" y="38" textAnchor="middle" fontSize="5.5" fill="#111">bottleneck</text>
                  <text x="109" y="46" textAnchor="middle" fontSize="5" fill="#666">c(x)</text>
                  <rect x="140" y="20" width="34" height="30" fill="#fff" stroke="#111" strokeWidth="0.6" />
                  <text x="157" y="37" textAnchor="middle" fontSize="5.5" fill="#111">g(c)</text>
                  <rect x="184" y="26" width="28" height="18" fill="#dcfce7" stroke="#16a34a" strokeWidth="0.6" />
                  <text x="198" y="38" textAnchor="middle" fontSize="5.5" fill="#1f2937">y-hat</text>
                  {[[32, 35, 40, 35], [78, 35, 88, 35], [130, 35, 140, 35], [174, 35, 184, 35]].map((a, i) => (
                    <line key={i} x1={a[0]} y1={a[1]} x2={a[2]} y2={a[3]} stroke="#111" strokeWidth="0.5" markerEnd="url(#arr)" />
                  ))}
                  <path d="M 18 26 Q 18 6 109 6 Q 200 6 200 26" fill="none" stroke="#b91c1c" strokeWidth="0.6" strokeDasharray="2 1.5" />
                  <text x="109" y="10" textAnchor="middle" fontSize="5" fill="#b91c1c">perturbation-consistency loss L_f</text>
                  <defs>
                    <marker id="arr" markerWidth="3" markerHeight="3" refX="2.5" refY="1.5" orient="auto">
                      <path d="M0,0 L3,1.5 L0,3 Z" fill="#111" />
                    </marker>
                  </defs>
                </svg>
                <div className="mt-0.5 text-center" style={{ fontSize: 7, color: "#444" }}>
                  Figure 1: Faithful-CBM architecture with perturbation-consistency loss.
                </div>
              </div>
            )}

            {continuation && idx === 0 && paper.artifacts.figure2 && (
              <div className="my-1.5" style={{ breakInside: "avoid-column" }}>
                <svg viewBox="0 0 220 90" className="w-full border border-[#bbb] bg-[#fafafa]" style={{ height: 80 }}>
                  {[
                    ["Grad-CAM", 0.32, "#94a3b8"],
                    ["IG", 0.36, "#94a3b8"],
                    ["CBM", 0.41, "#94a3b8"],
                    ["Faithful-CBM", 0.74, "#16a34a"],
                  ].map((row, i) => {
                    const x = 14 + i * 50;
                    const h = (row[1] as number) * 70;
                    return (
                      <g key={i}>
                        <rect x={x} y={78 - h} width="34" height={h} fill={row[2] as string} opacity="0.85" />
                        <text x={x + 17} y={86} textAnchor="middle" fontSize="5.5" fill="#111">{row[0]}</text>
                        <text x={x + 17} y={76 - h} textAnchor="middle" fontSize="5.5" fill="#111">{(row[1] as number).toFixed(2)}</text>
                      </g>
                    );
                  })}
                  <line x1="10" y1="78" x2="210" y2="78" stroke="#111" strokeWidth="0.4" />
                  <text x="6" y="14" fontSize="5.5" fill="#666">Faith@K</text>
                </svg>
                <div className="mt-0.5 text-center" style={{ fontSize: 7, color: "#444" }}>
                  Figure 2: Faithfulness@K across baselines; Faithful-CBM achieves a 2.3x relative gain.
                </div>
              </div>
            )}

            {!continuation && idx === 2 && paper.artifacts.table1 && (
              <div className="my-1.5" style={{ breakInside: "avoid-column" }}>
                <table className="w-full border-collapse" style={{ fontSize: 7 }}>
                  <thead>
                    <tr className="border-y border-[#222]">
                      <th className="py-0.5 text-left font-bold">Method</th>
                      <th className="py-0.5 text-right font-bold">Faith@K</th>
                      <th className="py-0.5 text-right font-bold">Acc</th>
                      <th className="py-0.5 text-right font-bold">Dshift</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Grad-CAM", "0.32", "84.1", "-0.18"],
                      ["IG", "0.36", "84.1", "-0.15"],
                      ["CBM", "0.41", "82.7", "-0.09"],
                      ["Faithful-CBM", "0.74", "83.9", "-0.03"],
                    ].map((row) => (
                      <tr key={row[0]} className="border-b border-[#ddd]">
                        {row.map((cell, i) => (
                          <td
                            key={i}
                            className={cn(
                              "py-0.5",
                              i === 0 ? "text-left" : "text-right tabular-nums",
                              row[0] === "Faithful-CBM" && "font-semibold",
                            )}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-0.5 text-center" style={{ fontSize: 7, color: "#444" }}>
                  Table 1: Main results on Waterbirds + ImageNet-XAI.
                </div>
              </div>
            )}
          </div>
        ))}

        {continuation && (
          <div className="mb-2" style={{ breakInside: "avoid-column" }}>
            <div className="font-bold" style={{ fontSize: 9 }}>
              References
            </div>
            <ol className="mt-0.5 list-decimal pl-3" style={{ fontSize: 7.5 }}>
              {paper.references.map((ref) => (
                <li key={ref.id} className="mb-0.5">
                  {ref.text}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div
        className="absolute inset-x-0 bottom-2 text-center text-[#888]"
        style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 8 }}
      >
        {pageNumber}
      </div>
    </div>
  );
}

function PassageButton({
  selected,
  onClick,
  children,
  className,
  style,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "block w-full rounded-[8px] px-1.5 py-1 text-left transition-colors",
        selected ? "bg-[#eef5fb] ring-1 ring-[#acccea]" : "hover:bg-[#f8fafc]",
        className,
      )}
      style={style}
    >
      {children}
    </button>
  );
}

function derivePaperProgress(steps: Step[], currentStage: number): PaperProgress {
  const ids = new Set(steps.map((step) => step.id));
  return {
    hasExperimentPlan: ids.has("experiment-plan") || ids.has("s6") || currentStage >= 2,
    hasIterationResults: ids.has("judge-feedback") || ids.has("s7") || currentStage >= 3,
    hasAbstractDraft: ids.has("writing-studio") || ids.has("s8") || currentStage >= 4,
    hasLaunchpad: ids.has("writing-studio") || ids.has("s9") || currentStage >= 5,
    hasConferenceMatch: ids.has("writing-studio") || ids.has("s10") || currentStage >= 5,
    hasMemorySync: ids.has("memory-update") || ids.has("s11") || currentStage >= 6,
  };
}

function getWritingDraft(steps: Step[]): WritingDraftOutput | undefined {
  const step = [...steps].reverse().find((item) => item.id === "writing-studio");
  const output = step?.tool?.output;
  if (!output) return undefined;
  try {
    const parsed: unknown = JSON.parse(output);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    const raw = parsed as Record<string, unknown>;
    const strings = (value: unknown) =>
      Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        : undefined;
    return {
      title: typeof raw.title === "string" ? raw.title : undefined,
      abstract: typeof raw.abstract === "string" ? raw.abstract : undefined,
      outline: strings(raw.outline),
      claims: strings(raw.claims),
      limitations: strings(raw.limitations),
      next_writing_actions: strings(raw.next_writing_actions),
      rationale: typeof raw.rationale === "string" ? raw.rationale : undefined,
    };
  } catch {
    return undefined;
  }
}

function buildPaper(task: string, progress: PaperProgress, draft?: WritingDraftOutput): Paper {
  const lower = task.toLowerCase();
  const inferred = draft?.title ?? (
    lower.includes("interpret") || lower.includes("xai") || lower.includes("explain")
      ? "Faithful-CBM: Optimizing, Not Only Measuring, Faithfulness in Vision Explainability"
      : lower.includes("reasoning")
        ? "Probing Latent Reasoning Pathways in Large Language Models"
        : lower.includes("conference") || lower.includes("openreview")
          ? "A Submission-Ready Framework for Reproducible Vision Research"
          : lower.includes("paper") && task.length < 60
            ? "Toward an Agentic Research Workspace: From Idea to Publication"
            : task.length > 80
              ? task.slice(0, 80) + "..."
              : task || "Faithful-CBM: Optimizing Faithfulness in Vision Explainability"
  );

  const abstractText = draft?.abstract ?? (progress.hasLaunchpad
    ? "We introduce Faithful-CBM, a concept bottleneck model trained with an explicit perturbation-consistency objective. Across three vision benchmarks spanning concept recognition, distribution shift, and explanation faithfulness, Faithful-CBM improves Faithfulness@K by 34% over Grad-CAM and 19% over vanilla CBM while preserving classification accuracy. We further release a venue-ready evaluation suite, a reproducibility checklist, and submission artifacts that make the benchmark directly reusable by future XAI work."
    : ABSTRACT_DRAFT);
  const claimText = draft?.claims?.length
    ? `Writing Studio claims: ${draft.claims.join(" ")}`
    : undefined;
  const limitationText = draft?.limitations?.length
    ? `Limitations: ${draft.limitations.join(" ")}`
    : undefined;
  const nextActionText = draft?.next_writing_actions?.length
    ? `Next writing actions: ${draft.next_writing_actions.join(" ")}`
    : undefined;

  const references: Reference[] = LITERATURE.slice(0, progress.hasLaunchpad ? 4 : 3).map((item, index) => ({
    id: index + 1,
    text: `${item.title}. ${item.venue} ${item.year}. ${item.contribution}`,
  }));

  if (progress.hasConferenceMatch) {
    references.push({
      id: references.length + 1,
      text: "OpenReview submission checklist. OpenReview 2025. Venue requirements for rebuttal-ready machine learning submissions.",
    });
  }

  return {
    title: inferred,
    authors: [{ name: "BaoByte", aff: 1 }],
    affiliations: ["Ludwig-Maximilians-Universitat Munchen (LMU Munich), Germany"],
    abstract: {
      id: "abstract",
      heading: "Abstract",
      body: abstractText,
    },
    abstractVersion: progress.hasLaunchpad ? "abstract v2" : "abstract v1",
    keywords: [
      "interpretability",
      "concept bottleneck",
      "faithfulness",
      "distribution shift",
      "computer vision",
    ],
    sections: [
      {
        id: "intro",
        heading: "1  Introduction",
        body: "Modern vision systems achieve high accuracy yet remain opaque to the practitioners who deploy them. Post-hoc attribution methods promise transparency but often fail silently under distribution shift, producing visually plausible heatmaps that bear little relation to the model's true decision process. We argue that faithfulness should not merely be evaluated after the fact, but optimized jointly with the predictive objective.",
      },
      {
        id: "related",
        heading: "2  Related Work",
        body: "Concept bottleneck models route predictions through human-readable concepts. Prototype methods learn class exemplars as visual explanations. Faithfulness evaluations rely on input perturbation, while robustness analyses show that attributions degrade sharply under shift. Our framing connects these threads under a single training and evaluation protocol.",
      },
      {
        id: "method",
        heading: "3  Method",
        body: `We extend a concept bottleneck classifier with a perturbation-consistency loss. Given an input x and a perturbation x-tilde, the model is penalized when concept activations diverge in regions the explanation deems unimportant. Hypothesis: ${EXPERIMENT.hypothesis} Variables: ${EXPERIMENT.variables.join(", ")}. We optimize the joint objective with lambda = 0.3 and keep the training recipe reproducible enough for direct submission packaging.`,
      },
      {
        id: "experiments",
        heading: "4  Experiments",
        body: progress.hasIterationResults
          ? `We evaluate on ${EXPERIMENT.dataset}. Baselines: ${EXPERIMENT.baseline}. Metrics: ${EXPERIMENT.metric}. Across four iteration rounds, Faithfulness@K improved from ${ITERATIONS[0].y.toFixed(2)} to ${ITERATIONS[ITERATIONS.length - 1].y.toFixed(2)} after AI feedback and human revision, yielding a 2.3x relative gain with stable accuracy under shift.`
          : `We evaluate on ${EXPERIMENT.dataset}. Baselines: ${EXPERIMENT.baseline}. Metrics: ${EXPERIMENT.metric}. The current draft reserves space for the final iteration table and ablation sweep once the writing stage consolidates the last results.`,
      },
      {
        id: "discussion",
        heading: "5  Discussion",
        body: claimText ?? (progress.hasLaunchpad
          ? "Our results suggest that explicit faithfulness regularization yields explanations that remain stable under distribution shift without sacrificing classification accuracy. The paper now frames this as an evaluation-first benchmark contribution, which better matches top-tier venue expectations around rigorous, reusable evidence."
          : "Our results suggest that explicit faithfulness regularization yields explanations that remain stable under distribution shift, without sacrificing classification accuracy. The gap between Grad-CAM and Faithful-CBM widens precisely where post-hoc methods are weakest, namely on Waterbirds-style spurious-correlation regimes."),
      },
      {
        id: "conclusion",
        heading: "6  Conclusion",
        body: [limitationText, nextActionText].filter(Boolean).join(" ") || (progress.hasConferenceMatch
          ? "We presented Faithful-CBM together with a reproducibility protocol, venue packaging checklist, and reusable evaluation harness. The artifact now reads less like an isolated experiment and more like a submission-ready research contribution."
          : "We presented Faithful-CBM, the first concept bottleneck model trained with an explicit perturbation-consistency objective, together with a reproducibility protocol grounded in an audit of forty XAI papers. We release code, datasets, and the evaluation harness."),
      },
    ],
    references,
    artifacts: {
      figure1: progress.hasExperimentPlan,
      figure2: progress.hasIterationResults,
      table1: progress.hasIterationResults,
      venueChecks: [
        { label: "Abstract locked", done: progress.hasAbstractDraft },
        { label: "Figures inserted", done: progress.hasIterationResults },
        { label: "Venue fit checked", done: progress.hasConferenceMatch },
        { label: "Submission package", done: progress.hasLaunchpad },
      ],
      mutationFeed: buildMutationFeed(progress, draft),
      packageState: progress.hasLaunchpad ? "submission package live" : "draft still mutating",
    },
  };
}

function buildMutationFeed(progress: PaperProgress, draft?: WritingDraftOutput): MutationItem[] {
  return [
    {
      id: "m1",
      title: "Abstract rewritten",
      note: draft?.abstract
        ? "Writing Studio inserted a backend-generated title and abstract into the paper preview."
        : progress.hasAbstractDraft
        ? "The writing stage inserted a first abstract draft and marked it ready for line-level review."
        : "Waiting for the writing stage to materialize a full abstract.",
      status: progress.hasAbstractDraft ? "done" : "pending",
    },
    {
      id: "m2",
      title: "Figure and table insertion",
      note: progress.hasIterationResults
        ? "Experiment deltas were converted into Figure 2 and Table 1 inside the paper preview."
        : "The paper is still waiting for stabilized iteration results before inserting result artifacts.",
      status: progress.hasIterationResults ? "done" : "pending",
    },
    {
      id: "m3",
      title: "Citation refresh",
      note: progress.hasConferenceMatch
        ? "Venue-facing references and checklist language were merged into the draft."
        : "References are still in research mode and will update again at publish handoff.",
      status: progress.hasConferenceMatch ? "done" : progress.hasAbstractDraft ? "live" : "pending",
    },
  ];
}

function buildLaureateLens(task: string, paper: Paper, progress: PaperProgress): LaureateInsight[] {
  const taskFrame =
    task.length > 88 ? `${task.slice(0, 88)}...` : task;

  return [
    {
      label: "Frame the problem",
      body: `A top scientist would frame this less as "${taskFrame}" and more as a reliability bottleneck for evidence-driven vision research. The contribution becomes a field-shaping evaluation protocol, not just a model tweak.`,
    },
    {
      label: "Challenge an assumption",
      body: progress.hasIterationResults
        ? "The obvious assumption to challenge is that better-looking explanations imply better causal faithfulness. The strongest version of the paper should separate plausibility from perturbation-grounded evidence."
        : "Before the results settle, the biggest assumption to challenge is whether the benchmark really captures faithfulness rather than annotation artifacts.",
    },
    {
      label: "Design the killer experiment",
      body: "The decisive experiment is a shift-sensitive comparison where post-hoc attributions remain visually persuasive but fail the perturbation protocol, while Faithful-CBM stays stable. That is the graph reviewers remember.",
    },
    {
      label: "Tell the contribution",
      body: `The paper should claim three things in one sentence: a trainable faithfulness objective, a benchmark that exposes failure modes, and a submission-ready reproducibility package. ${paper.artifacts.packageState}.`,
    },
  ];
}

function getPassageById(paper: Paper, id: PassageId | null): Passage | null {
  if (!id) return null;
  if (id === "abstract") return paper.abstract;
  return paper.sections.find((section) => section.id === id) ?? null;
}

function buildReviewerGhosts(passage: Passage, progress: PaperProgress): ReviewerGhost[] {
  const target = PASSAGE_LABEL[passage.id];

  return [
    {
      id: `${passage.id}-method`,
      reviewer: "Method Reviewer",
      angle: "causal grounding and experimental rigor",
      tone: "method",
      comment: `The ${target} still underspecifies what evidence makes the faithfulness claim convincing. Tighten the chain from perturbation protocol to measurable robustness benefit.`,
      citation: "Adebayo et al. 2024, Faithfulness Evaluation in Vision Explainability (NeurIPS 2024).",
      rewrite: rewriteForReviewer(passage.id, "method", progress),
    },
    {
      id: `${passage.id}-novelty`,
      reviewer: "Novelty Reviewer",
      angle: "what is genuinely new here",
      tone: "novelty",
      comment: `The ${target} should more sharply separate 'measuring faithfulness' from 'optimizing faithfulness'. Right now the conceptual jump is present, but not framed as the main research move.`,
      citation: "Koh et al. 2022, Concept Bottleneck Models for Interpretable Vision (ICML 2022).",
      rewrite: rewriteForReviewer(passage.id, "novelty", progress),
    },
    {
      id: `${passage.id}-harsh`,
      reviewer: "Harsh Reviewer",
      angle: "where a skeptical program chair pushes back",
      tone: "harsh",
      comment: `A skeptical reviewer will say this reads like an incremental benchmark plus a nicer training loss. The ${target} needs a stronger sentence on failure cases and why baseline explanations actually break.`,
      citation: "Hooker et al. 2019, A Benchmark for Interpretability Methods in Deep Neural Networks.",
      rewrite: rewriteForReviewer(passage.id, "harsh", progress),
    },
  ];
}

function rewriteForReviewer(
  passageId: PassageId,
  tone: ReviewerGhost["tone"],
  progress: PaperProgress,
): string {
  const methodTail = progress.hasConferenceMatch
    ? "We make this operational through a venue-ready perturbation protocol that can be audited by future work."
    : "We make this operational through a perturbation protocol that directly tests whether explanations survive shift.";

  if (passageId === "abstract") {
    if (tone === "method") {
      return `We introduce Faithful-CBM, a concept bottleneck model trained with an explicit perturbation-consistency objective that ties explanation faithfulness to measurable robustness under shift. Across three vision benchmarks, the method improves Faithfulness@K while preserving accuracy, showing that explanation quality can be optimized rather than audited only after training. ${methodTail}`;
    }
    if (tone === "novelty") {
      return "We argue that the real novelty is not another explanation metric, but a training objective that optimizes faithfulness itself. Faithful-CBM turns a post-hoc evaluation problem into a model-design problem, then validates that shift-sensitive benchmark behavior changes accordingly.";
    }
    return "We introduce Faithful-CBM in a setting where visually plausible explanations often fail exactly when distribution shift matters most. The paper now foregrounds that failure mode, then shows that a faithfulness-aware bottleneck objective closes it with reproducible gains on benchmarked perturbation tests.";
  }

  if (passageId === "method") {
    if (tone === "method") {
      return "We formalize Faithful-CBM as a concept bottleneck classifier trained with a perturbation-consistency loss that penalizes instability in regions deemed explanation-irrelevant. This makes the optimization target legible to both causal faithfulness evaluation and reproducibility auditing.";
    }
    if (tone === "novelty") {
      return "The methodological novelty is not the bottleneck alone, but the fact that faithfulness enters the training loop as a first-class optimization target. This distinguishes our approach from prior work that only measures explanation quality after the model is already fixed.";
    }
    return "Without a stronger statement, the method can be mistaken for a lightweight regularizer on top of a standard CBM. We therefore emphasize that the loss is designed to separate explanation plausibility from explanation stability under structured perturbations.";
  }

  if (passageId === "experiments") {
    if (tone === "method") {
      return "We evaluate on benchmark settings that intentionally separate visual plausibility from perturbation-grounded faithfulness. The key result is not only the gain in Faithfulness@K, but the persistence of that gain under distribution shift where post-hoc baselines degrade.";
    }
    if (tone === "novelty") {
      return "The experimental novelty comes from showing that a trainable faithfulness objective changes which systems remain stable under shift, rather than merely re-ranking explanations on a single clean split.";
    }
    return "A harsh reviewer will ask whether these are just benchmark-specific wins. We therefore foreground the cross-benchmark pattern: methods that look reasonable on clean data fail to preserve explanation faithfulness once the data distribution moves.";
  }

  if (tone === "method") {
    return `${PASSAGE_LABEL[passageId]} now explicitly links the narrative claim to the benchmark evidence and causal interpretation target. ${methodTail}`;
  }
  if (tone === "novelty") {
    return `${PASSAGE_LABEL[passageId]} now frames the paper as a shift from evaluating explanations after the fact to engineering models that optimize explanation faithfulness during training.`;
  }
  return `${PASSAGE_LABEL[passageId]} now foregrounds the skeptical counterargument and answers it directly with a stronger failure-mode claim, so the contribution reads less incremental.`;
}

function applyAcceptedGhosts(
  basePaper: Paper,
  acceptedGhosts: Record<PassageId, AcceptedGhost>,
): Paper {
  const next: Paper = {
    ...basePaper,
    abstract: { ...basePaper.abstract },
    sections: basePaper.sections.map((section) => ({ ...section })),
    references: [...basePaper.references],
    artifacts: {
      ...basePaper.artifacts,
      mutationFeed: [...basePaper.artifacts.mutationFeed],
    },
  };

  const acceptedList = Object.values(acceptedGhosts);

  acceptedList.forEach((accepted) => {
    if (accepted.passageId === "abstract") {
      next.abstract.body = accepted.rewrite;
    } else {
      next.sections = next.sections.map((section) =>
        section.id === accepted.passageId ? { ...section, body: accepted.rewrite } : section,
      );
    }

    if (!next.references.some((ref) => ref.text === accepted.citation)) {
      next.references.push({
        id: next.references.length + 1,
        text: accepted.citation,
      });
    }
  });

  if (acceptedList.length > 0) {
    next.abstractVersion = `abstract v${2 + acceptedList.length}`;
    next.artifacts.mutationFeed = [
      {
        id: "accepted-reviewers",
        title: "Reviewer patches applied",
        note: acceptedList.map((accepted) => `${accepted.reviewer} updated ${PASSAGE_LABEL[accepted.passageId]}`).join(" · "),
        status: "live",
      },
      ...next.artifacts.mutationFeed,
    ];
  }

  return next;
}

function buildLatex(paper: Paper): string {
  const authors = paper.authors.map((author) => `${author.name}\\thanks{Affiliation ${author.aff}}`).join(" \\and ");
  const sections = paper.sections
    .map((section) => `\\section{${section.heading.replace(/^\d+\s+/, "")}}\n${section.body}`)
    .join("\n\n");
  const refs = paper.references.map((ref) => `\\bibitem{ref${ref.id}} ${ref.text}`).join("\n");

  return `\\documentclass[10pt,twocolumn]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath,amssymb,graphicx,booktabs,hyperref}

\\title{${paper.title}}
\\author{${authors}}
\\date{}

\\begin{document}
\\maketitle

\\begin{abstract}
${paper.abstract.body}
\\end{abstract}

\\noindent\\textbf{Keywords:} ${paper.keywords.join(", ")}.

${sections}

\\begin{thebibliography}{99}
${refs}
\\end{thebibliography}

\\end{document}`;
}

function LatexView({ source }: { source: string }) {
  return (
    <pre
      className="overflow-x-auto rounded-[18px] border p-3 scrollbar-thin code-surface"
      style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, lineHeight: 1.55 }}
    >
      {source.split("\n").map((line, i) => (
        <div key={i} className="flex">
          <span
            className="select-none pr-3 text-right tabular-nums text-white/30"
            style={{ minWidth: 28 }}
          >
            {i + 1}
          </span>
          <span style={{ whiteSpace: "pre-wrap" }}>{colorizeLatex(line)}</span>
        </div>
      ))}
    </pre>
  );
}

function colorizeLatex(line: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\\[a-zA-Z]+|\{[^{}]*\}|%[^\n]*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(line))) {
    if (match.index > last) parts.push(line.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("\\")) {
      parts.push(
        <span key={key++} style={{ color: "#9db8d4" }}>
          {token}
        </span>,
      );
    } else if (token.startsWith("%")) {
      parts.push(
        <span key={key++} style={{ color: "#8aa59d" }}>
          {token}
        </span>,
      );
    } else {
      parts.push(
        <span key={key++} style={{ color: "#f0cfa5" }}>
          {token}
        </span>,
      );
    }
    last = match.index + token.length;
  }

  if (last < line.length) parts.push(line.slice(last));
  return parts;
}
