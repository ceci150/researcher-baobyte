import { mockConferences } from './mockConferences';
import { buildToolBlock } from './mockTools';
import { mockCitations } from './mockPapers';
import type {
  AgentRun,
  ModeConfig,
  OutputCard,
  ResearchMode,
  StreamEvent,
  WorkflowStage,
} from '../types/workflow';

export const defaultResearchTopic = 'Explainable AI in computer vision';

export const demoTaskInput =
  'I want to write a paper about explainable AI in computer vision and publish it in a strong venue.';

export const modeConfigs: ModeConfig[] = [
  {
    id: 'explore',
    label: 'Explore',
    promptHint: 'Ask Nobli to map fresh opportunities and underexplored gaps…',
    exampleTasks: [
      'Find emerging research opportunities in interpretable AI for computer vision.',
      'Map underexplored benchmark gaps in explainable image models.',
    ],
    voiceTranscript:
      'Explore where vision explainability benchmarks are still weak and where a paper could stand out.',
  },
  {
    id: 'survey',
    label: 'Survey',
    promptHint: 'Ask Nobli to synthesize papers, schools of thought, and missing citations…',
    exampleTasks: [
      'Build a concise literature survey around faithfulness in vision explainability.',
      'Compare prototype-based and attribution-based explanation lines.',
    ],
    voiceTranscript:
      'Survey the recent explainability papers and highlight the gap around faithfulness under shift.',
  },
  {
    id: 'experiment',
    label: 'Experiment',
    promptHint: 'Ask Nobli to shape experiments, metrics, and reviewer-safe protocols…',
    exampleTasks: [
      'Design an experiment for testing reasoning models.',
      'Propose a reproducibility-first evaluation protocol for explainability methods.',
    ],
    voiceTranscript:
      'Design the experiment and tell me which datasets and metrics would make the evaluation publishable.',
  },
  {
    id: 'write',
    label: 'Write',
    promptHint: 'Ask Nobli to draft abstract, outline, and reviewer-ready prose…',
    exampleTasks: [
      'Draft an abstract from my notes and experiment results.',
      'Turn this explainability plan into a venue-ready abstract.',
    ],
    voiceTranscript:
      'Write a sharp abstract for a paper on explainable AI in computer vision with a benchmark focus.',
  },
  {
    id: 'publish',
    label: 'Publish',
    promptHint: 'Ask Nobli to match venues, format deliverables, and prep submission handoff…',
    exampleTasks: [
      'Find upcoming conferences for this paper.',
      'Prepare an OpenReview submission package.',
    ],
    voiceTranscript:
      'Find the strongest venue and prepare the submission package and reminders.',
  },
];

export const sidebarItems = [
  'Home',
  'New task',
  'All tasks',
  'My Papers',
  'Experiments',
  'Writing Drafts',
  'Conference Watch',
  'Memory & Growing',
  'Settings',
];

export const taskHistory = [
  'Benchmarking causal editing in multimodal reasoning',
  'Reviewer simulation for diffusion explainability',
  'OpenReview rebuttal for faithful saliency study',
];

export const homeExampleTasks = [
  'Find emerging research opportunities in interpretable AI for computer vision.',
  'Design an experiment for testing reasoning models.',
  'Draft an abstract from my notes and experiment results.',
  'Find upcoming conferences for this paper.',
  'Prepare an OpenReview submission package.',
];

export const baseWorkflowStages: WorkflowStage[] = [
  {
    id: 'idea-discovery',
    label: 'Idea Discovery',
    shortLabel: 'Idea',
    description: 'Rank emerging research directions and strategic fit.',
    status: 'upcoming',
  },
  {
    id: 'literature-survey',
    label: 'Literature Survey',
    shortLabel: 'Survey',
    description: 'Cluster the field, spot gaps, and find anchor citations.',
    status: 'upcoming',
  },
  {
    id: 'experiment-design',
    label: 'Experiment Design',
    shortLabel: 'Experiment',
    description: 'Propose hypotheses, datasets, and evaluation metrics.',
    status: 'upcoming',
  },
  {
    id: 'iteration-feedback',
    label: 'Iteration & Feedback',
    shortLabel: 'Review',
    description: 'Surface approval gates and diagnose narrative risk.',
    status: 'upcoming',
  },
  {
    id: 'writing-studio',
    label: 'Writing Studio',
    shortLabel: 'Write',
    description: 'Draft the abstract and shape the paper story.',
    status: 'upcoming',
  },
  {
    id: 'publish-influence',
    label: 'Publish & Influence',
    shortLabel: 'Publish',
    description: 'Track venues, exports, and delivery handoffs.',
    status: 'upcoming',
  },
  {
    id: 'memory-growing',
    label: 'Memory & Growing',
    shortLabel: 'Memory',
    description: 'Save reminders, venue timing, and research heuristics.',
    status: 'upcoming',
  },
];

const outputCards: Record<string, OutputCard> = {
  opportunities: {
    kind: 'opportunities',
    title: 'Emerging Research Opportunities',
    subtitle: 'Ranked directions grounded in explainability evaluation momentum.',
    opportunities: [
      {
        id: 'op-1',
        title: 'Evaluation-first explainability benchmarks',
        whyNow: 'Reviewer expectations are shifting toward benchmark rigor and stress tests.',
        noveltyScore: 92,
        feasibilityScore: 81,
        citationMomentum: 'High in robustness and benchmark papers',
        strategicFit: 'Strong match for NeurIPS, ICLR, and CVPR reviewers.',
        fitLabel: 'High potential',
        suggestedQuestion:
          'How stable are vision explainability claims when attribution methods face distribution shift?',
        possibleMethod: 'Construct a benchmark matrix across shift severity and explanation families.',
        possibleDataset: 'ImageNet-A, CUB, and ObjectNet.',
        expectedContribution: 'A reviewer-legible protocol for measuring faithfulness under shift.',
      },
      {
        id: 'op-2',
        title: 'Citation lineage and controversy maps',
        whyNow: 'The literature has fragmented schools of thought that are rarely compared directly.',
        noveltyScore: 84,
        feasibilityScore: 73,
        citationMomentum: 'Growing in survey and meta-science circles',
        strategicFit: 'Good for literature-heavy positioning and workshop expansion.',
        fitLabel: 'Promising',
        suggestedQuestion:
          'Which explanation claims persist across benchmark lineages, and which are citation artifacts?',
        possibleMethod: 'Cluster citation trees and tag benchmark assumptions.',
        possibleDataset: 'OpenAlex metadata + XAI benchmark annotations.',
        expectedContribution: 'A field map that exposes agreement, drift, and conflict.',
      },
      {
        id: 'op-3',
        title: 'Human-centered explanation preference modeling',
        whyNow: 'Preference alignment is underexplored compared with faithfulness metrics.',
        noveltyScore: 79,
        feasibilityScore: 62,
        citationMomentum: 'Early but credible for CHI / FAccT framing',
        strategicFit: 'Better as an extension after the benchmark core is stable.',
        fitLabel: 'Promising',
        suggestedQuestion:
          'What explanation properties do expert users prefer when benchmark faithfulness is held constant?',
        possibleMethod: 'Pairwise explanation preference study with domain users.',
        possibleDataset: 'Medical or safety-critical image subsets.',
        expectedContribution: 'A bridge between trustworthy metrics and actual user preference.',
      },
      {
        id: 'op-4',
        title: 'Reproducibility-first XAI experiment protocols',
        whyNow: 'The community still struggles to replicate explanation findings across labs.',
        noveltyScore: 71,
        feasibilityScore: 89,
        citationMomentum: 'Steady and cross-cutting',
        strategicFit: 'Strong supporting angle for workshop and artifacts tracks.',
        fitLabel: 'Niche',
        suggestedQuestion:
          'Which evaluation choices most destabilize reproducibility in vision explanation claims?',
        possibleMethod: 'Controlled re-runs with protocol ablations.',
        possibleDataset: 'CIFAR-10, CUB, and Places365.',
        expectedContribution: 'A protocol checklist for reproducible explainability studies.',
      },
    ],
  },
  literature: {
    kind: 'literature-survey',
    title: 'Literature Survey',
    subtitle: 'Anchor papers, competing schools of thought, and the gap that matters now.',
    data: {
      papers: [
        'Concept Bottleneck Models for Interpretable Vision',
        'Prototype-based Explanations for Visual Recognition',
        'Faithfulness Evaluation in Vision Explainability',
        'Attribution Methods under Distribution Shift',
      ],
      schoolsOfThought: [
        'Concept-centric interpretability systems prioritize human-editable latent reasoning.',
        'Prototype and exemplar methods optimize legibility through visually grounded exemplars.',
        'Faithfulness evaluation papers focus on whether explanations track real model behavior under stress.',
      ],
      researchGap:
        'The field lacks a benchmark protocol that compares explanation faithfulness under distribution shift without collapsing usability and robustness into a single score.',
      conflictingEvidence:
        'Prototype explanations look persuasive to readers, but attribution stress tests show those same models can fail faithfulness checks under shift.',
      missingCitations: [
        'Recent robustness-style benchmark papers outside classic XAI venues',
        'Human preference work that tests explanation usefulness beyond saliency scores',
      ],
      readingPath: [
        'Start with concept bottleneck and prototype papers for the design space.',
        'Move to faithfulness benchmarks to understand evaluation failure modes.',
        'End with distribution shift work to justify the benchmark-first contribution.',
      ],
    },
  },
  experiment: {
    kind: 'experiment-design',
    title: 'Experiment Design',
    subtitle: 'Compact execution plan for the first benchmarkable study.',
    data: {
      hypotheses: [
        'Faithfulness metrics diverge more sharply under natural distribution shift than under synthetic corruption.',
        'Concept-level explanations degrade more gracefully than raw saliency under moderate shift.',
        'Reviewer confidence improves when benchmark outputs separate faithfulness from human preference.',
      ],
      datasets: ['ImageNet-A', 'CUB-200', 'ObjectNet'],
      metrics: ['Deletion / insertion', 'Counterfactual consistency', 'Human agreement split by expertise'],
      executionNotes: [
        'Keep the first pass focused on reproducible benchmark construction, not a new model.',
        'Add one human study slice only if it supports the benchmark story instead of expanding scope.',
      ],
    },
  },
  diagnosis: {
    kind: 'situation-diagnosis',
    title: 'Situation Diagnosis',
    subtitle: 'Narrative pressure test before drafting begins.',
    data: {
      strengths: [
        'Clear venue fit if the benchmark story remains primary.',
        'Strong alignment between literature gap and proposed evaluation protocol.',
      ],
      risks: [
        'Human-centered angle can dilute the first-pass paper if introduced too early.',
        'Too many metrics will make the paper look exploratory instead of decisive.',
      ],
      decisions: [
        'Approve benchmark-first framing.',
        'Defer broader preference modeling to future work.',
      ],
    },
  },
  approval: {
    kind: 'approval',
    title: 'Iteration & Feedback',
    subtitle: 'The agent is waiting for a narrative decision before drafting.',
    gate: {
      id: 'approval-gate-1',
      title: 'Approve the benchmark-first framing',
      summary:
        'Nobli recommends a paper centered on faithfulness evaluation under distribution shift, with human preference modeling kept as a future-work extension.',
      recommendation:
        'This preserves novelty, keeps scope reviewable, and strengthens the path to a strong venue.',
      actions: [
        { id: 'accept', label: 'Accept' },
        { id: 'ask-revision', label: 'Ask revision' },
        { id: 'reject', label: 'Reject' },
      ],
      status: 'waiting',
    },
  },
  abstract: {
    kind: 'abstract-draft',
    title: 'Writing Studio',
    subtitle: 'Abstract draft prepared from the approved benchmark direction.',
    data: {
      title: 'Benchmarking Faithfulness under Distribution Shift for Explainable Computer Vision',
      abstract:
        'Explainability methods for computer vision are often evaluated in settings that hide how explanations behave once image distributions move away from training data. We introduce a benchmark-first study of faithfulness under distribution shift, comparing concept-based, prototype-based, and attribution-based explanations across natural and synthetic shifts. Our protocol separates explanation faithfulness from reader preference, measures where existing metrics disagree, and highlights which explanation families remain stable under shift. Across ImageNet-A, CUB, and ObjectNet, we find that persuasive explanations are not consistently faithful, and that shift-aware stress tests change method rankings substantially. The resulting benchmark offers a reproducible evaluation template for future explainability work and clarifies how to position trustworthy vision explanations for strong publication venues.',
      contributions: [
        'A reproducible benchmark protocol for explainability faithfulness under shift.',
        'A comparative analysis of concept, prototype, and attribution explanation families.',
        'Reviewer-ready framing that separates faithfulness from human preference.',
      ],
      citations: [
        'Concept Bottleneck Models for Interpretable Vision',
        'Faithfulness Evaluation in Vision Explainability',
      ],
    },
  },
  publish: {
    kind: 'publish-and-influence',
    title: 'Publish & Influence',
    subtitle: 'Compact venue and handoff plan for the draft.',
    data: {
      targetVenues: mockConferences.slice(0, 4),
      deliverables: [
        'Venue shortlist with deadline pressure notes',
        'PDF export package',
        'Overleaf handoff bundle',
      ],
    },
  },
  memory: {
    kind: 'memory-growing',
    title: 'Memory & Growing',
    subtitle: 'What Nobli would keep watching after this run.',
    data: {
      reminders: [
        'Ping two weeks before NeurIPS artifact checklist opens.',
        'Watch for new faithfulness benchmarks in Semantic Scholar alerts.',
        'Save a follow-up task for the human preference extension.',
      ],
      heuristics: [
        'Keep explainability papers benchmark-first when venue fit is the priority.',
        'Treat human preference modeling as a scoped extension unless user intent changes.',
      ],
    },
  },
};

export const initialStreamEvents: StreamEvent[] = [
  {
    id: 'evt-understand-goal',
    stageId: 'idea-discovery',
    elapsedMs: 12000,
    title: 'Understanding research goal',
    summary:
      'Anchoring the task around explainable AI in computer vision, benchmark rigor, and strong venue positioning.',
    status: 'done',
    sourceChips: [{ id: 'goal', label: 'Research goal', kind: 'file' }],
    toolBlocks: [
      buildToolBlock('gap-extractor', {
        summary: 'Pulled the strongest open gap from recent explainability benchmark work.',
      }),
    ],
    stageTransitions: [{ stageId: 'idea-discovery', status: 'running' }],
    runStatus: 'running',
    creditDelta: 8,
  },
  {
    id: 'evt-search-sources',
    stageId: 'idea-discovery',
    elapsedMs: 28000,
    title: 'Searching arXiv, Semantic Scholar, Papers with Code',
    summary:
      'Collecting recent papers and benchmark metadata around faithfulness, concept methods, and attribution stability.',
    status: 'done',
    sourceChips: [
      { id: 'arxiv', label: 'arXiv', kind: 'database' },
      { id: 'semantic-scholar', label: 'Semantic Scholar', kind: 'database' },
      { id: 'papers-with-code', label: 'Papers with Code', kind: 'database' },
    ],
    toolBlocks: [
      buildToolBlock('literature-scraper', {
        summary: 'Retrieved the literature set and ranked high-signal papers for review.',
      }),
    ],
    creditDelta: 9,
  },
  {
    id: 'evt-opportunities',
    stageId: 'idea-discovery',
    elapsedMs: 80000,
    title: 'Generating emerging research opportunities',
    summary:
      'The agent ranked the paper directions with the best combination of novelty, feasibility, and venue fit.',
    status: 'done',
    sourceChips: [
      { id: 'arxiv-op', label: 'arXiv', kind: 'database' },
      { id: 'pwc-op', label: 'Papers with Code', kind: 'database' },
    ],
    citations: mockCitations.slice(0, 2),
    toolBlocks: [
      buildToolBlock('opportunity-ranker', {
        summary: 'Compared candidate directions against novelty and strategic fit signals.',
      }),
    ],
    outputCard: outputCards.opportunities,
    stageTransitions: [
      { stageId: 'idea-discovery', status: 'completed' },
      { stageId: 'literature-survey', status: 'running' },
    ],
    creditDelta: 13,
  },
  {
    id: 'evt-literature-survey',
    stageId: 'literature-survey',
    elapsedMs: 118000,
    title: 'Synthesizing literature survey',
    summary:
      'Clustered core papers, exposed conflicting evidence, and isolated the benchmark gap that matters for this run.',
    status: 'done',
    sourceChips: [
      { id: 'cluster', label: 'Paper clusters', kind: 'tool' },
      { id: 'citations', label: 'Citation anchors', kind: 'paper' },
    ],
    citations: mockCitations,
    toolBlocks: [
      buildToolBlock('paper-clusterer', {
        summary: 'Mapped competing schools of thought and citation drift.',
      }),
      buildToolBlock('literature-scraper', {
        summary: 'Traceable evidence behind the survey synthesis.',
      }),
    ],
    outputCard: outputCards.literature,
    stageTransitions: [
      { stageId: 'literature-survey', status: 'completed' },
      { stageId: 'experiment-design', status: 'running' },
    ],
    creditDelta: 12,
  },
  {
    id: 'evt-experiment-design',
    stageId: 'experiment-design',
    elapsedMs: 146000,
    title: 'Drafting experiment design',
    summary:
      'Prepared a compact benchmark protocol with hypotheses, datasets, and reviewer-legible metrics.',
    status: 'done',
    toolBlocks: [
      buildToolBlock('experiment-designer', {
        summary: 'Generated the benchmark plan and constrained the scope for reviewability.',
      }),
    ],
    outputCard: outputCards.experiment,
    stageTransitions: [
      { stageId: 'experiment-design', status: 'completed' },
      { stageId: 'iteration-feedback', status: 'running' },
    ],
    creditDelta: 10,
  },
  {
    id: 'evt-situation-diagnosis',
    stageId: 'iteration-feedback',
    elapsedMs: 168000,
    title: 'Pressure-testing the narrative',
    summary:
      'Checked the draft plan for scope creep, weak claims, and venue positioning risk before asking for approval.',
    status: 'done',
    toolBlocks: [
      buildToolBlock('situation-diagnoser', {
        summary: 'Flagged the narrative decisions that matter before Writing Studio begins.',
      }),
    ],
    outputCard: outputCards.diagnosis,
    creditDelta: 7,
  },
  {
    id: 'evt-approval-gate',
    stageId: 'iteration-feedback',
    elapsedMs: 182000,
    title: 'Waiting for human approval',
    summary:
      'The agent is paused at the narrative checkpoint before drafting the abstract and venue package.',
    status: 'waiting for human',
    outputCard: outputCards.approval,
    stageTransitions: [{ stageId: 'iteration-feedback', status: 'waiting' }],
    runStatus: 'waiting',
    creditDelta: 4,
  },
];

export const approvalAcceptedEvents: StreamEvent[] = [
  {
    id: 'evt-approval-accepted',
    stageId: 'iteration-feedback',
    elapsedMs: 196000,
    title: 'Approval recorded',
    summary:
      'The benchmark-first framing is locked. Nobli is moving into Writing Studio with the approved narrative.',
    status: 'done',
    stageTransitions: [
      { stageId: 'iteration-feedback', status: 'completed' },
      { stageId: 'writing-studio', status: 'running' },
    ],
    runStatus: 'running',
    creditDelta: 5,
  },
  {
    id: 'evt-abstract-draft',
    stageId: 'writing-studio',
    elapsedMs: 228000,
    title: 'Drafting abstract for a strong venue',
    summary:
      'Prepared a reviewer-ready abstract that emphasizes benchmark rigor, faithfulness under shift, and contribution clarity.',
    status: 'done',
    citations: mockCitations.slice(0, 2),
    toolBlocks: [
      buildToolBlock('abstract-writer', {
        summary: 'Generated the first abstract draft from the approved framing.',
        status: 'done',
        timeUsedLabel: '17s',
      }),
    ],
    outputCard: outputCards.abstract,
    stageTransitions: [
      { stageId: 'writing-studio', status: 'completed' },
      { stageId: 'publish-influence', status: 'running' },
    ],
    creditDelta: 11,
  },
  {
    id: 'evt-publish-plan',
    stageId: 'publish-influence',
    elapsedMs: 247000,
    title: 'Preparing venue handoff',
    summary:
      'Matched the draft to near-term venues and staged export actions for the paper package.',
    status: 'done',
    toolBlocks: [
      buildToolBlock('conference-monitor', {
        summary: 'Tracked the strongest venue shortlist and deadline pressure.',
      }),
    ],
    outputCard: outputCards.publish,
    stageTransitions: [
      { stageId: 'publish-influence', status: 'completed' },
      { stageId: 'memory-growing', status: 'running' },
    ],
    creditDelta: 6,
  },
  {
    id: 'evt-memory-growing',
    stageId: 'memory-growing',
    elapsedMs: 262000,
    title: 'Saving reminders and heuristics',
    summary:
      'Stored follow-up reminders so the workspace can keep tracking venue timing and future experiment expansions.',
    status: 'done',
    toolBlocks: [
      buildToolBlock('memory-tracker', {
        summary: 'Captured venue reminders and reusable heuristics from the run.',
      }),
    ],
    outputCard: outputCards.memory,
    stageTransitions: [{ stageId: 'memory-growing', status: 'completed' }],
    runStatus: 'ready',
    creditDelta: 3,
  },
];

export const approvalRevisionEvents: StreamEvent[] = [
  {
    id: 'evt-revision-requested',
    stageId: 'iteration-feedback',
    elapsedMs: 194000,
    title: 'Revision requested',
    summary:
      'The researcher asked for a tighter benchmark scope. Nobli is revising the framing before drafting.',
    status: 'needs review',
    runStatus: 'needs-review',
    stageTransitions: [{ stageId: 'iteration-feedback', status: 'blocked' }],
    creditDelta: 2,
  },
];

export const approvalRejectedEvents: StreamEvent[] = [
  {
    id: 'evt-approval-rejected',
    stageId: 'iteration-feedback',
    elapsedMs: 194000,
    title: 'Agent paused after rejection',
    summary:
      'The narrative framing was rejected. Nobli is paused until the researcher provides a new direction.',
    status: 'needs review',
    runStatus: 'needs-review',
    stageTransitions: [{ stageId: 'iteration-feedback', status: 'blocked' }],
    creditDelta: 1,
  },
];

export function createAgentRun(mode: ResearchMode, taskInput: string): AgentRun {
  return {
    id: `run-${mode}-${Date.now()}`,
    taskInput,
    topic: defaultResearchTopic,
    mode,
    startedAt: new Date().toISOString(),
    status: 'running',
    currentStageId: 'idea-discovery',
    usedCredits: 24,
  };
}
