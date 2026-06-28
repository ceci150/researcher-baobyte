export const STAGES = [
  "Idea Discovery",
  "Literature Survey",
  "Experiment Design",
  "Iteration & Feedback",
  "Writing Studio",
  "Publish & Influence",
  "Memory & Growing",
] as const;

export type Stage = (typeof STAGES)[number];

export type StepStatus = "running" | "done" | "waiting" | "review";

export type ToolBlock = {
  name: string;
  input: Record<string, unknown>;
  output: string;
  sources: string[];
  citations: string[];
  timeMs: number;
  status: StepStatus;
};

export type OutputKind =
  | "literature"
  | "opportunities"
  | "approval-opportunities"
  | "experiment"
  | "artifacts"
  | "iteration"
  | "abstract"
  | "publish"
  | "conferences"
  | "memory";

export type ArtifactFile = {
  path: string;
  size?: number;
  url?: string;
  snippet?: string;
};

export type ExperimentArtifacts = {
  found: boolean;
  projectId?: string;
  root?: string;
  lastModified?: number;
  resultsPath?: string;
  results?: unknown;
  archiveUrl?: string;
  codeFiles: ArtifactFile[];
  figures: ArtifactFile[];
  pdfs: ArtifactFile[];
  message?: string;
};

export type Step = {
  id: string;
  stageIndex: number;
  title: string;
  summary: string;
  duration: string;
  status: StepStatus;
  tool?: ToolBlock;
  output?: { kind: OutputKind };
  sources?: string[];
  artifacts?: ExperimentArtifacts;
};

export const EXAMPLE_TASKS = [
  "Find emerging research opportunities in interpretable AI for computer vision.",
  "Design an experiment for testing reasoning models.",
  "Draft an abstract from my notes and experiment results.",
  "Find upcoming conferences for this paper.",
  "Prepare an OpenReview submission package.",
];

export const MODES = ["Explore", "Survey", "Experiment", "Write", "Publish"] as const;

export const OPPORTUNITIES = [
  {
    id: "o1",
    title: "Evaluation-first explainability benchmarks",
    rationale:
      "Current XAI methods lack standardized faithfulness evaluation. A benchmark suite would anchor the field.",
    whyNow: "ICLR'25 workshops are explicitly calling for evaluation protocols.",
    novelty: 86,
    feasibility: 78,
    momentum: 71,
    fit: 92,
    band: "High potential",
    question: "Can a unified faithfulness benchmark predict downstream trust in vision models?",
    method: "Curated 6-task suite + perturbation-based faithfulness scoring.",
    dataset: "ImageNet-XAI, CUB-Parts, Waterbirds.",
    contribution: "First reproducible XAI-Vision benchmark with held-out evaluation set.",
  },
  {
    id: "o2",
    title: "Citation lineage and controversy maps",
    rationale: "Conflicting attribution results are hidden inside citation chains.",
    whyNow: "New Semantic Scholar APIs expose disputed-citation signals.",
    novelty: 74,
    feasibility: 82,
    momentum: 64,
    fit: 81,
    band: "Promising",
    question: "Can we automatically detect conflicting evidence in attribution literature?",
    method: "Graph clustering over citation polarity embeddings.",
    dataset: "S2ORC + manual controversy labels.",
    contribution: "Open dataset of disputed XAI claims.",
  },
  {
    id: "o3",
    title: "Human-centered explanation preference modeling",
    rationale: "Practitioners prefer specific explanation styles; current methods ignore this.",
    whyNow: "CHI'25 special track on AI explanations is open.",
    novelty: 69,
    feasibility: 73,
    momentum: 58,
    fit: 77,
    band: "Promising",
    question: "Do domain experts prefer prototype-based over saliency-based explanations?",
    method: "Mixed-method study + preference model.",
    dataset: "Radiology + autonomous driving practitioners (n=120).",
    contribution: "Preference-aligned XAI selector.",
  },
  {
    id: "o4",
    title: "Reproducibility-first XAI experiment protocols",
    rationale: "Most XAI papers cannot be reproduced from released artifacts.",
    whyNow: "NeurIPS reproducibility checklist now mandatory.",
    novelty: 61,
    feasibility: 88,
    momentum: 55,
    fit: 70,
    band: "Niche",
    question: "What minimum artifact set guarantees reproducibility of vision XAI claims?",
    method: "Replication audit of 40 papers + protocol synthesis.",
    dataset: "Public XAI repos sampled from 2022–2025.",
    contribution: "Open protocol + audit results.",
  },
];

export const LITERATURE = [
  {
    title: "Concept Bottleneck Models for Interpretable Vision",
    year: 2022,
    venue: "ICML",
    contribution: "Forces predictions to route through human-readable concepts.",
    why: "Anchor work for concept-based XAI in vision.",
    citations: 1284,
    relevance: 0.94,
  },
  {
    title: "Prototype-based Explanations for Visual Recognition",
    year: 2023,
    venue: "CVPR",
    contribution: "Learns class prototypes that double as visual explanations.",
    why: "Strongest non-saliency baseline.",
    citations: 612,
    relevance: 0.91,
  },
  {
    title: "Faithfulness Evaluation in Vision Explainability",
    year: 2024,
    venue: "NeurIPS",
    contribution: "Proposes perturbation-based faithfulness metrics.",
    why: "Defines the evaluation gap your work targets.",
    citations: 188,
    relevance: 0.97,
  },
  {
    title: "Attribution Methods under Distribution Shift",
    year: 2024,
    venue: "ICLR",
    contribution: "Shows attributions degrade sharply under shift.",
    why: "Motivates robustness-aware XAI.",
    citations: 142,
    relevance: 0.88,
  },
];

export const EXPERIMENT = {
  hypothesis:
    "A faithfulness-regularized concept bottleneck model yields more reliable explanations than post-hoc attribution under distribution shift.",
  variables: ["explanation method", "faithfulness regularization weight", "shift severity"],
  dataset: "Waterbirds (shift), CUB-Parts (concepts), ImageNet-XAI (faithfulness)",
  baseline: "Grad-CAM, Integrated Gradients, vanilla CBM",
  method: "CBM + faithfulness-aware loss (λ-perturbation consistency)",
  metric: "Faithfulness@K, Concept Accuracy, Shift Robustness Δ",
  contribution: "First CBM variant with explicit faithfulness regularization.",
  resources: "1x A100, ~36 GPU-hours, 4 weeks calendar.",
};

export const DIAGNOSIS = [
  { label: "Data", status: "OK", note: "Three datasets licensed and downloaded." },
  { label: "Method", status: "OK", note: "Loss formulation derived and unit-tested." },
  { label: "Reproducibility", status: "Watch", note: "Seed sweep not yet recorded; add seed log." },
  { label: "Compute", status: "OK", note: "Budget fits within allocated A100 hours." },
  { label: "Ethics", status: "OK", note: "No human subjects; public datasets only." },
  { label: "Publication", status: "Watch", note: "Strong fit for ICLR'25; CVPR'25 deadline tight." },
];

export const ITERATIONS = [
  { x: 1, label: "Exp 1", y: 0.32, note: "Baseline CBM" },
  { x: 2, label: "Exp 2", y: 0.41, note: "+ faithfulness loss" },
  { x: 3, label: "Exp 3", y: 0.58, note: "AI feedback applied" },
  { x: 4, label: "Exp 4", y: 0.74, note: "Human revision" },
];

export const ABSTRACT_DRAFT = `We introduce Faithful-CBM, a concept bottleneck model trained with an explicit perturbation-consistency objective. Across three vision benchmarks spanning concept recognition, distribution shift, and explanation faithfulness, Faithful-CBM improves Faithfulness@K by 34% over Grad-CAM and 19% over vanilla CBM while preserving classification accuracy. We further release an evaluation suite that surfaces when post-hoc attributions silently fail under shift, and we provide a reproducibility protocol grounded in our audit of forty recent XAI papers. Our results suggest that faithfulness should be optimized, not only measured.`;

export const ABSTRACT_STYLES = [
  "Concise conference",
  "Nature-style",
  "Technical",
  "Storytelling",
  "Grant-style",
];

export const PLATFORMS = [
  { name: "arXiv", action: "Prepare arXiv package" },
  { name: "OpenReview", action: "Prepare OpenReview submission" },
  { name: "GitHub", action: "Generate GitHub README" },
  { name: "Overleaf", action: "Handoff LaTeX project" },
  { name: "Academic site", action: "Generate project page" },
];

export const CONFERENCES = [
  {
    name: "ICLR 2025",
    deadline: "Oct 1, 2025",
    abstract: "Sep 24, 2025",
    full: "Oct 1, 2025",
    notify: "Jan 22, 2026",
    cameraReady: "Mar 5, 2026",
    fit: 94,
    format: "9 pages + refs",
    next: "Lock the faithfulness experiments by Sep 20.",
    url: "https://iclr.cc",
  },
  {
    name: "CVPR 2025",
    deadline: "Nov 14, 2025",
    abstract: "Nov 7, 2025",
    full: "Nov 14, 2025",
    notify: "Feb 26, 2026",
    cameraReady: "Apr 4, 2026",
    fit: 81,
    format: "8 pages + refs",
    next: "Add a vision-specific ablation table.",
    url: "https://cvpr.thecvf.com",
  },
  {
    name: "FAccT 2026",
    deadline: "Jan 30, 2026",
    abstract: "Jan 23, 2026",
    full: "Jan 30, 2026",
    notify: "Apr 10, 2026",
    cameraReady: "May 1, 2026",
    fit: 72,
    format: "10 pages",
    next: "Frame contribution around evaluation accountability.",
    url: "https://facctconference.org",
  },
];

export const MEMORY_NOTIFICATIONS = [
  {
    id: "m1",
    text: "Connect with Dr. Lee — working on highly related interpretable AI methods.",
    kind: "people",
  },
  { id: "m2", text: "ICLR workshop deadline in 12 days.", kind: "deadline" },
  { id: "m3", text: "A new paper strongly overlaps with your faithfulness method.", kind: "paper" },
  { id: "m4", text: "Your experiment still has one unresolved reproducibility issue.", kind: "audit" },
  { id: "m5", text: "Three researchers cited adjacent work but missed your CBM result.", kind: "citation" },
];
