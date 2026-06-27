import type { Paper } from '../types/papers';
import type { Citation } from '../types/workflow';

export const mockPapers: Paper[] = [
  {
    id: 'concept-bottleneck',
    title: 'Concept Bottleneck Models for Interpretable Vision',
    authors: 'Koh et al.',
    venue: 'ICML',
    year: 2020,
    summary: 'Introduces concept-mediated prediction layers that expose interpretable variables before final classification.',
    finding: 'Useful for human-editable reasoning, but concept taxonomies become brittle under distribution shift.',
  },
  {
    id: 'prototype-explanations',
    title: 'Prototype-based Explanations for Visual Recognition',
    authors: 'Chen et al.',
    venue: 'NeurIPS',
    year: 2019,
    summary: 'Uses prototype similarity to ground visual decisions in representative examples.',
    finding: 'Human legibility is strong, but benchmark choice shapes whether explanations remain faithful.',
  },
  {
    id: 'faithfulness-shift',
    title: 'Faithfulness Evaluation in Vision Explainability',
    authors: 'Agarwal et al.',
    venue: 'ICLR',
    year: 2023,
    summary: 'Benchmarks faithfulness metrics for saliency and concept-based methods across curated tasks.',
    finding: 'Faithfulness metrics disagree under covariate shift, leaving evaluation pipelines unstable.',
  },
  {
    id: 'attribution-shift',
    title: 'Attribution Methods under Distribution Shift',
    authors: 'Singh et al.',
    venue: 'CVPR',
    year: 2024,
    summary: 'Tracks how attribution methods degrade when visual priors move away from training conditions.',
    finding: 'Shift-aware stress tests reveal a gap between explanation quality and model robustness.',
  },
];

export const mockCitations: Citation[] = mockPapers.map((paper) => ({
  id: paper.id,
  title: paper.title,
  authors: paper.authors,
  venue: paper.venue,
  year: paper.year,
}));
