import type { Conference } from '../types/conferences';

export const mockConferences: Conference[] = [
  {
    id: 'neurips',
    name: 'NeurIPS',
    deadline: 'May 14',
    fit: 'strong',
    note: 'Strong fit for benchmark-driven explainability with broad ML relevance.',
  },
  {
    id: 'icml',
    name: 'ICML',
    deadline: 'January 30',
    fit: 'strong',
    note: 'Good venue if the evaluation protocol generalizes beyond computer vision.',
  },
  {
    id: 'iclr',
    name: 'ICLR',
    deadline: 'September 26',
    fit: 'strong',
    note: 'Works well if the narrative centers on method novelty and reproducibility.',
  },
  {
    id: 'cvpr',
    name: 'CVPR',
    deadline: 'November 14',
    fit: 'good',
    note: 'Best if the experiments emphasize concrete vision datasets and practitioner use.',
  },
  {
    id: 'iccv',
    name: 'ICCV',
    deadline: 'March 6',
    fit: 'good',
    note: 'Useful fallback for a vision-specific framing with applied benchmarks.',
  },
  {
    id: 'chi',
    name: 'CHI',
    deadline: 'September 11',
    fit: 'reach',
    note: 'Relevant if the story evolves toward explanation preference modeling.',
  },
  {
    id: 'facct',
    name: 'FAccT',
    deadline: 'October 7',
    fit: 'good',
    note: 'A strong option when the fairness and accountability angle becomes primary.',
  },
];
