import { mockCitations } from './mockPapers';
import type { ToolBlock, ToolDetail } from '../types/tools';
import type { SourceChip } from '../types/workflow';

const baseSources: SourceChip[] = [
  { id: 'arxiv', label: 'arXiv', kind: 'database' },
  { id: 'semantic-scholar', label: 'Semantic Scholar', kind: 'database' },
  { id: 'papers-with-code', label: 'Papers with Code', kind: 'database' },
];

export const toolDetails: Record<string, ToolDetail> = {
  'opportunity-ranker': {
    id: 'opportunity-ranker',
    name: 'Opportunity Ranker',
    status: 'done',
    timeUsedLabel: '18s',
    inputPreview: {
      topic: 'Explainable AI in computer vision',
      objective: 'Find high-upside paper directions with strong venue fit',
      filters: ['evaluation benchmarks', 'human factors', 'reproducibility'],
    },
    outputPreview: {
      topDirection: 'Evaluation-first explainability benchmarks',
      rankedOpportunities: 4,
      strategicFit: 'High for NeurIPS / ICLR style positioning',
    },
    sources: baseSources,
    citations: mockCitations.slice(0, 3),
  },
  'gap-extractor': {
    id: 'gap-extractor',
    name: 'Gap Extractor',
    status: 'done',
    timeUsedLabel: '14s',
    inputPreview: {
      abstractsScanned: 28,
      clustering: 'evaluation, robustness, concept methods',
    },
    outputPreview: {
      keyGap: 'Few papers combine explanation faithfulness with distribution shift stress tests.',
      blindSpot: 'Reader-facing guidance for benchmark selection is missing.',
    },
    sources: baseSources,
    citations: mockCitations.slice(1, 4),
  },
  'literature-scraper': {
    id: 'literature-scraper',
    name: 'Literature Scraper',
    status: 'done',
    timeUsedLabel: '26s',
    inputPreview: {
      query: 'explainable AI computer vision faithfulness benchmark',
      limit: 40,
    },
    outputPreview: {
      retrievedPapers: 24,
      highSignalPapers: 8,
      schoolsOfThought: ['concept bottlenecks', 'prototype explanations', 'attribution evaluation'],
    },
    sources: baseSources,
    citations: mockCitations,
  },
  'paper-clusterer': {
    id: 'paper-clusterer',
    name: 'Paper Clusterer',
    status: 'done',
    timeUsedLabel: '11s',
    inputPreview: {
      embeddings: 'title + abstract',
      objective: 'Map competing explanation schools',
    },
    outputPreview: {
      clusters: ['faithfulness metrics', 'prototype reasoning', 'human-centered preferences'],
    },
    sources: baseSources,
    citations: mockCitations.slice(0, 3),
  },
  'experiment-designer': {
    id: 'experiment-designer',
    name: 'Experiment Designer',
    status: 'done',
    timeUsedLabel: '22s',
    inputPreview: {
      constraints: ['cv benchmarks', 'reproducibility', 'strong venue fit'],
      outputs: ['hypotheses', 'datasets', 'metrics'],
    },
    outputPreview: {
      hypothesisCount: 3,
      leadDataset: 'ImageNet-A + CUB',
      reviewRisk: 'Need a stronger human evaluation justification.',
    },
    sources: baseSources,
    citations: mockCitations.slice(2, 4),
  },
  'situation-diagnoser': {
    id: 'situation-diagnoser',
    name: 'Situation Diagnoser',
    status: 'waiting',
    timeUsedLabel: '9s',
    inputPreview: {
      currentNarrative: 'Benchmark-first XAI study for vision',
      detectedRisks: ['scope creep', 'weak human study angle'],
    },
    outputPreview: {
      recommendation: 'Lock the contribution around faithfulness under shift before drafting.',
      nextDecision: 'Approve benchmark framing or ask for revision.',
    },
    sources: baseSources,
    citations: mockCitations.slice(2, 4),
  },
  'abstract-writer': {
    id: 'abstract-writer',
    name: 'Abstract Writer',
    status: 'running',
    timeUsedLabel: '17s',
    inputPreview: {
      paperGoal: 'Benchmark-centered explainability study',
      targetVenues: ['NeurIPS', 'ICLR', 'CVPR'],
      tone: 'precise, reviewer-ready',
    },
    outputPreview: {
      draftVersion: 'v0.2',
      length: 184,
      emphasis: 'faithfulness evaluation under distribution shift',
    },
    sources: baseSources,
    citations: mockCitations.slice(0, 2),
  },
  'conference-monitor': {
    id: 'conference-monitor',
    name: 'Conference Monitor',
    status: 'done',
    timeUsedLabel: '8s',
    inputPreview: {
      venuesTracked: ['NeurIPS', 'ICML', 'ICLR', 'CVPR', 'ICCV', 'CHI', 'FAccT'],
    },
    outputPreview: {
      topRecommendation: 'NeurIPS',
      backupRecommendation: 'CVPR',
    },
    sources: [
      { id: 'neurips', label: 'NeurIPS', kind: 'venue' },
      { id: 'cvpr', label: 'CVPR', kind: 'venue' },
      { id: 'iclr', label: 'ICLR', kind: 'venue' },
    ],
    citations: [],
  },
  'memory-tracker': {
    id: 'memory-tracker',
    name: 'Memory Tracker',
    status: 'done',
    timeUsedLabel: '6s',
    inputPreview: {
      memoryScope: 'research heuristics + venue deadlines + follow-up requests',
    },
    outputPreview: {
      savedReminders: 3,
      savedHeuristics: 2,
    },
    sources: [{ id: 'workspace', label: 'Workspace Memory', kind: 'tool' }],
    citations: [],
  },
};

export function buildToolBlock(
  toolId: string,
  overrides: Partial<Omit<ToolBlock, 'toolId'>> = {},
): ToolBlock {
  const detail = toolDetails[toolId];

  return {
    id: `${toolId}-${overrides.timeUsedLabel ?? detail.timeUsedLabel}`,
    toolId,
    label: detail.name,
    summary:
      overrides.summary ??
      (typeof detail.outputPreview === 'object'
        ? 'Inspect structured tool output and supporting sources.'
        : 'Inspect tool output.'),
    status: overrides.status ?? detail.status,
    timeUsedLabel: overrides.timeUsedLabel ?? detail.timeUsedLabel,
  };
}
