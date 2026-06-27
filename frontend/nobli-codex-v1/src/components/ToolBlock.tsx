import type { ToolBlock as ToolBlockType } from '../types/tools';

interface ToolBlockProps {
  block: ToolBlockType;
  isSelected: boolean;
  onSelect: (block: ToolBlockType) => void;
}

export function ToolBlock({ block, isSelected, onSelect }: ToolBlockProps) {
  return (
    <button
      className={`tool-block ${isSelected ? 'is-selected' : ''}`}
      onClick={() => onSelect(block)}
      type="button"
    >
      <div className="tool-block-header">
        <strong>{block.label}</strong>
        <span className={`status-pill is-${block.status}`}>{block.status}</span>
      </div>
      <p>{block.summary}</p>
      <span className="tool-block-time">{block.timeUsedLabel}</span>
    </button>
  );
}
