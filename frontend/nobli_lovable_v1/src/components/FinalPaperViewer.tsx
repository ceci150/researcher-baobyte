import { useMemo, useState } from "react";
import { ABSTRACT_DRAFT, EXPERIMENT, ITERATIONS, LITERATURE } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Tab = "Paper" | "PDF Preview" | "LaTeX";

export function FinalPaperViewer({
  task,
  currentStage,
}: {
  task: string;
  currentStage: number;
}) {
  const [tab, setTab] = useState<Tab>("Paper");
  const [copied, setCopied] = useState(false);

  const paper = useMemo(() => buildPaper(task), [task]);
  const completeness = Math.min(100, Math.round(((currentStage + 1) / 7) * 100));

  const latex = useMemo(() => buildLatex(paper), [paper]);

  const copyLatex = async () => {
    try {
      await navigator.clipboard.writeText(latex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <aside className="flex h-full w-[380px] shrink-0 flex-col border-l border-border bg-[var(--color-sidebar)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="text-[12px] font-semibold tracking-tight">Final Paper</div>
          <span className="rounded-full border border-border bg-card px-1.5 py-px text-[10px] text-ink-muted tabular-nums">
            {completeness}% drafted
          </span>
        </div>
        <div className="flex items-center gap-1">
          <ActionBtn label="Download PDF" />
          <ActionBtn label="Overleaf" />
          <ActionBtn label={copied ? "Copied" : "Copy LaTeX"} onClick={copyLatex} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-border bg-[var(--color-sidebar)] px-3">
        {(["Paper", "PDF Preview", "LaTeX"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative px-2.5 py-2 text-[11.5px] transition-colors",
              tab === t ? "text-foreground" : "text-ink-muted hover:text-foreground",
            )}
          >
            {t}
            {tab === t && (
              <span className="absolute inset-x-2 -bottom-px h-px bg-foreground" />
            )}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollbar-thin bg-[var(--color-surface-2)] p-4">
        {tab === "Paper" && <PaperPage paper={paper} />}
        {tab === "PDF Preview" && (
          <div className="space-y-3">
            <PaperPage paper={paper} pageNumber={1} />
            <PaperPage paper={paper} pageNumber={2} continuation />
          </div>
        )}
        {tab === "LaTeX" && <LatexView source={latex} />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-3 py-1.5 text-[10.5px] text-ink-muted">
        <span>Auto-synced with workflow</span>
        <span className="tabular-nums">9 pages · refs {LITERATURE.length}</span>
      </div>
    </aside>
  );
}

function ActionBtn({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md border border-border bg-card px-2 py-1 text-[10.5px] text-foreground transition-colors hover:bg-[var(--color-accent)]"
    >
      {label}
    </button>
  );
}

type Paper = {
  title: string;
  authors: { name: string; aff: number }[];
  affiliations: string[];
  abstract: string;
  keywords: string[];
  sections: { heading: string; body: string }[];
  references: { id: number; text: string }[];
};

function buildPaper(task: string): Paper {
  const lower = task.toLowerCase();
  const inferred =
    lower.includes("interpret") || lower.includes("xai") || lower.includes("explain")
      ? "Faithful-CBM: Optimizing, Not Only Measuring, Faithfulness in Vision Explainability"
      : lower.includes("reasoning")
        ? "Probing Latent Reasoning Pathways in Large Language Models"
        : lower.includes("conference") || lower.includes("openreview")
          ? "A Submission-Ready Framework for Reproducible Vision Research"
          : lower.includes("paper") && task.length < 60
            ? "Toward an Agentic Research Workspace: From Idea to Publication"
            : task.length > 80
              ? task.slice(0, 80) + "…"
              : task || "Faithful-CBM: Optimizing Faithfulness in Vision Explainability";

  return {
    title: inferred,
    authors: [{ name: "BaoByte", aff: 1 }],
    affiliations: [
      "Ludwig-Maximilians-Universität München (LMU Munich), Germany",
    ],
    abstract: ABSTRACT_DRAFT,
    keywords: [
      "interpretability",
      "concept bottleneck",
      "faithfulness",
      "distribution shift",
      "computer vision",
    ],
    sections: [
      {
        heading: "1  Introduction",
        body: "Modern vision systems achieve high accuracy yet remain opaque to the practitioners who deploy them. Post-hoc attribution methods promise transparency but often fail silently under distribution shift, producing visually plausible heatmaps that bear little relation to the model's true decision process [1, 3]. We argue that faithfulness should not merely be evaluated after the fact, but optimized jointly with the predictive objective.",
      },
      {
        heading: "2  Related Work",
        body: "Concept bottleneck models route predictions through human-readable concepts [1]. Prototype methods learn class exemplars as visual explanations [2]. Faithfulness evaluations rely on input perturbation [3]. Robustness analyses show attributions degrade under shift [4]. Our work unifies these threads under a single training objective.",
      },
      {
        heading: "3  Method",
        body: `We extend a concept bottleneck classifier with a perturbation-consistency loss $\\mathcal{L}_f$. Given an input $x$ and a perturbation $\\tilde{x}$, the model is penalized when concept activations diverge in regions the explanation deems unimportant. Hypothesis: ${EXPERIMENT.hypothesis} Variables: ${EXPERIMENT.variables.join(", ")}. We optimize the joint objective with $\\lambda = 0.3$.`,
      },
      {
        heading: "4  Experiments",
        body: `We evaluate on ${EXPERIMENT.dataset}. Baselines: ${EXPERIMENT.baseline}. Metrics: ${EXPERIMENT.metric}. Across four iteration rounds, Faithfulness@K improved from ${ITERATIONS[0].y.toFixed(2)} (baseline CBM) to ${ITERATIONS[ITERATIONS.length - 1].y.toFixed(2)} after human revision, a 2.3× relative gain (Table 1, Figure 2).`,
      },
      {
        heading: "5  Discussion",
        body: "Our results suggest that explicit faithfulness regularization yields explanations that remain stable under distribution shift, without sacrificing classification accuracy. The gap between Grad-CAM and Faithful-CBM widens precisely where post-hoc methods are weakest — namely on Waterbirds-style spurious-correlation regimes.",
      },
      {
        heading: "6  Conclusion",
        body: "We presented Faithful-CBM, the first concept bottleneck model trained with an explicit perturbation-consistency objective, together with a reproducibility protocol grounded in an audit of forty XAI papers. We release code, datasets, and the evaluation harness.",
      },
    ],
    references: LITERATURE.map((l, i) => ({
      id: i + 1,
      text: `${l.title}. ${l.venue} ${l.year}. ${l.contribution}`,
    })),
  };
}

function PaperPage({
  paper,
  pageNumber = 1,
  continuation = false,
}: {
  paper: Paper;
  pageNumber?: number;
  continuation?: boolean;
}) {
  return (
    <div
      className="relative mx-auto bg-white text-[#111] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_-12px_rgba(0,0,0,0.18)]"
      style={{ width: "100%", aspectRatio: "8.5 / 11", padding: "28px 26px 36px" }}
    >
      {!continuation ? (
        <>
          {/* Title */}
          <h1
            className="text-center font-serif leading-tight text-[#111]"
            style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 16, fontWeight: 700 }}
          >
            {paper.title}
          </h1>

          {/* Authors */}
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

          {/* Affiliations */}
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

          {/* Abstract */}
          <div className="mx-6 mt-3">
            <div
              className="text-center font-bold"
              style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 10 }}
            >
              Abstract
            </div>
            <p
              className="mt-1 text-justify"
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 8.5,
                lineHeight: 1.35,
              }}
            >
              {paper.abstract}
            </p>
            <p
              className="mt-1.5 text-justify"
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 8.5,
                lineHeight: 1.35,
              }}
            >
              <span className="italic font-semibold">Keywords — </span>
              {paper.keywords.join(", ")}
            </p>
          </div>
        </>
      ) : (
        <div
          className="text-right text-[#666]"
          style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 8 }}
        >
          {paper.title.split(":")[0]} — continued
        </div>
      )}

      {/* Two-column body */}
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
        {(continuation ? paper.sections.slice(3) : paper.sections.slice(0, 4)).map(
          (s, idx) => (
            <div key={s.heading} className="mb-2" style={{ breakInside: "avoid-column" }}>
              <div className="font-bold" style={{ fontSize: 9 }}>
                {s.heading}
              </div>
              <p className="mt-0.5">{s.body}</p>

              {/* Figure 1 — architecture diagram (real SVG) */}
              {!continuation && idx === 1 && (
                <div
                  className="my-1.5 flex flex-col items-center"
                  style={{ breakInside: "avoid-column" }}
                >
                  <svg viewBox="0 0 220 70" className="w-full border border-[#bbb] bg-[#fafafa]" style={{ height: 70 }}>
                    {/* input */}
                    <rect x="4" y="26" width="28" height="18" fill="#e8efff" stroke="#3b5bdb" strokeWidth="0.6" />
                    <text x="18" y="38" textAnchor="middle" fontSize="5.5" fill="#1f2937">x</text>
                    {/* encoder */}
                    <rect x="40" y="20" width="38" height="30" fill="#fff" stroke="#111" strokeWidth="0.6" />
                    <text x="59" y="37" textAnchor="middle" fontSize="5.5" fill="#111">Encoder f</text>
                    {/* concepts */}
                    <rect x="88" y="14" width="42" height="42" fill="#fef3c7" stroke="#b45309" strokeWidth="0.6" />
                    <text x="109" y="30" textAnchor="middle" fontSize="5.5" fill="#111">Concept</text>
                    <text x="109" y="38" textAnchor="middle" fontSize="5.5" fill="#111">bottleneck</text>
                    <text x="109" y="46" textAnchor="middle" fontSize="5" fill="#666">c(x)</text>
                    {/* classifier */}
                    <rect x="140" y="20" width="34" height="30" fill="#fff" stroke="#111" strokeWidth="0.6" />
                    <text x="157" y="37" textAnchor="middle" fontSize="5.5" fill="#111">g(c)</text>
                    {/* output */}
                    <rect x="184" y="26" width="28" height="18" fill="#dcfce7" stroke="#16a34a" strokeWidth="0.6" />
                    <text x="198" y="38" textAnchor="middle" fontSize="5.5" fill="#1f2937">ŷ</text>
                    {/* arrows */}
                    {[[32,35,40,35],[78,35,88,35],[130,35,140,35],[174,35,184,35]].map((a,i) => (
                      <line key={i} x1={a[0]} y1={a[1]} x2={a[2]} y2={a[3]} stroke="#111" strokeWidth="0.5" markerEnd="url(#arr)" />
                    ))}
                    {/* perturbation loop */}
                    <path d="M 18 26 Q 18 6 109 6 Q 200 6 200 26" fill="none" stroke="#b91c1c" strokeWidth="0.6" strokeDasharray="2 1.5" />
                    <text x="109" y="10" textAnchor="middle" fontSize="5" fill="#b91c1c">perturbation-consistency loss ℒ_f</text>
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

              {/* Figure 2 — results bar chart on continuation page */}
              {continuation && idx === 0 && (
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
                    Figure 2: Faithfulness@K across baselines; Faithful-CBM achieves a 2.3× relative gain.
                  </div>
                </div>
              )}

              {/* Table after section 3 */}
              {!continuation && idx === 2 && (
                <div className="my-1.5" style={{ breakInside: "avoid-column" }}>
                  <table className="w-full border-collapse" style={{ fontSize: 7 }}>
                    <thead>
                      <tr className="border-y border-[#222]">
                        <th className="py-0.5 text-left font-bold">Method</th>
                        <th className="py-0.5 text-right font-bold">Faith@K</th>
                        <th className="py-0.5 text-right font-bold">Acc</th>
                        <th className="py-0.5 text-right font-bold">Δshift</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Grad-CAM", "0.32", "84.1", "−0.18"],
                        ["IG", "0.36", "84.1", "−0.15"],
                        ["CBM", "0.41", "82.7", "−0.09"],
                        ["Faithful-CBM", "0.74", "83.9", "−0.03"],
                      ].map((row) => (
                        <tr key={row[0]} className="border-b border-[#ddd]">
                          {row.map((c, i) => (
                            <td
                              key={i}
                              className={cn(
                                "py-0.5",
                                i === 0 ? "text-left" : "text-right tabular-nums",
                                row[0] === "Faithful-CBM" && "font-semibold",
                              )}
                            >
                              {c}
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
          ),
        )}

        {/* References on continuation page */}
        {continuation && (
          <div className="mb-2" style={{ breakInside: "avoid-column" }}>
            <div className="font-bold" style={{ fontSize: 9 }}>
              References
            </div>
            <ol className="mt-0.5 list-decimal pl-3" style={{ fontSize: 7.5 }}>
              {paper.references.map((r) => (
                <li key={r.id} className="mb-0.5">
                  {r.text}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Footer page number */}
      <div
        className="absolute inset-x-0 bottom-2 text-center text-[#888]"
        style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 8 }}
      >
        {pageNumber}
      </div>
    </div>
  );
}

function buildLatex(paper: Paper): string {
  const authors = paper.authors.map((a) => `${a.name}\\thanks{Affiliation ${a.aff}}`).join(" \\and ");
  const sections = paper.sections
    .map(
      (s) =>
        `\\section{${s.heading.replace(/^\d+\s+/, "")}}\n${s.body.replace(/\$/g, "$")}`,
    )
    .join("\n\n");
  const refs = paper.references
    .map((r) => `\\bibitem{ref${r.id}} ${r.text}`)
    .join("\n");

  return `\\documentclass[10pt,twocolumn]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath,amssymb,graphicx,booktabs,hyperref}

\\title{${paper.title}}
\\author{${authors}}
\\date{}

\\begin{document}
\\maketitle

\\begin{abstract}
${paper.abstract}
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
      className="overflow-x-auto rounded-md border border-border bg-[#0b0e14] p-3 text-[#d4d4d4] scrollbar-thin"
      style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, lineHeight: 1.55 }}
    >
      {source.split("\n").map((line, i) => (
        <div key={i} className="flex">
          <span
            className="select-none pr-3 text-right text-[#4b5566] tabular-nums"
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
  // Lightweight tokenizer for visual flair only.
  const parts: React.ReactNode[] = [];
  const regex = /(\\[a-zA-Z]+|\{[^{}]*\}|%[^\n]*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(line))) {
    if (m.index > last) parts.push(line.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("\\"))
      parts.push(
        <span key={key++} style={{ color: "#c586c0" }}>
          {tok}
        </span>,
      );
    else if (tok.startsWith("%"))
      parts.push(
        <span key={key++} style={{ color: "#6a9955" }}>
          {tok}
        </span>,
      );
    else
      parts.push(
        <span key={key++} style={{ color: "#ce9178" }}>
          {tok}
        </span>,
      );
    last = m.index + tok.length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts;
}
