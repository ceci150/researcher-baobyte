import type { ToolBlock as ToolBlockType } from '../types/tools';
import type { StreamEvent } from '../types/workflow';
import { formatDuration } from '../utils/format';
import { OutputCardRenderer } from './OutputCards';
import { ToolBlock } from './ToolBlock';

interface StreamItemProps {
  event: StreamEvent;
  selectedToolId: string | null;
  actionMessages: {
    pdf?: string;
    overleaf?: string;
    phone?: string;
  };
  onToolSelect: (block: ToolBlockType) => void;
  onApprovalAction: (action: 'accept' | 'reject' | 'ask-revision', gateId: string) => void;
  onPreparePdf: () => void;
  onPrepareOverleaf: () => void;
  onSendToPhone: () => void;
}

export function StreamItem({
  event,
  selectedToolId,
  actionMessages,
  onToolSelect,
  onApprovalAction,
  onPreparePdf,
  onPrepareOverleaf,
  onSendToPhone,
}: StreamItemProps) {
  return (
    <article className="stream-item glass-surface">
      <div className="stream-item-meta">
        <span className="stream-item-time">Worked for {formatDuration(event.elapsedMs)}</span>
        <span className={`status-pill is-${event.status.replace(/\s/g, '-')}`}>{event.status}</span>
      </div>
      <div className="stream-item-body">
        <h3>{event.title}</h3>
        <p>{event.summary}</p>

        {event.sourceChips?.length ? (
          <div className="chip-row">
            {event.sourceChips.map((chip) => (
              <span className="source-chip" key={chip.id}>
                {chip.label}
              </span>
            ))}
          </div>
        ) : null}

        {event.toolBlocks?.length ? (
          <div className="tool-grid">
            {event.toolBlocks.map((block) => (
              <ToolBlock
                block={block}
                isSelected={selectedToolId === block.toolId}
                key={block.id}
                onSelect={onToolSelect}
              />
            ))}
          </div>
        ) : null}

        {event.citations?.length ? (
          <div className="citation-row">
            {event.citations.map((citation) => (
              <span className="citation-chip" key={citation.id}>
                {citation.title} ({citation.year})
              </span>
            ))}
          </div>
        ) : null}

        {event.outputCard ? (
          <OutputCardRenderer
            actionMessages={actionMessages}
            card={event.outputCard}
            onApprovalAction={onApprovalAction}
            onPrepareOverleaf={onPrepareOverleaf}
            onPreparePdf={onPreparePdf}
            onSendToPhone={onSendToPhone}
          />
        ) : null}
      </div>
    </article>
  );
}
