import type { ToolBlock as ToolBlockType } from '../types/tools';
import type { StreamEvent, WorkflowStage } from '../types/workflow';
import { StreamItem } from './StreamItem';

interface AgentStreamProps {
  stages: WorkflowStage[];
  events: StreamEvent[];
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
  onRegisterSection: (stageId: string, element: HTMLElement | null) => void;
}

export function AgentStream({
  stages,
  events,
  selectedToolId,
  actionMessages,
  onToolSelect,
  onApprovalAction,
  onPreparePdf,
  onPrepareOverleaf,
  onSendToPhone,
  onRegisterSection,
}: AgentStreamProps) {
  return (
    <div className="stream-layout">
      {stages.map((stage) => {
        const stageEvents = events.filter((event) => event.stageId === stage.id);

        return (
          <section
            className="stage-section"
            id={`stage-${stage.id}`}
            key={stage.id}
            ref={(element) => onRegisterSection(stage.id, element)}
          >
            <div className="stage-heading">
              <div>
                <span className="eyebrow">{stage.shortLabel}</span>
                <h2>{stage.label}</h2>
              </div>
              <span className={`status-pill is-${stage.status}`}>{stage.status}</span>
            </div>

            {stageEvents.length ? (
              stageEvents.map((event) => (
                <StreamItem
                  actionMessages={actionMessages}
                  event={event}
                  key={event.id}
                  onApprovalAction={onApprovalAction}
                  onPrepareOverleaf={onPrepareOverleaf}
                  onPreparePdf={onPreparePdf}
                  onSendToPhone={onSendToPhone}
                  onToolSelect={onToolSelect}
                  selectedToolId={selectedToolId}
                />
              ))
            ) : (
              <div className="stream-placeholder glass-surface">
                <strong>{stage.description}</strong>
                <p>
                  {stage.status === 'upcoming'
                    ? 'Queued until upstream research steps finish.'
                    : 'This stage is active and waiting for the next agent event.'}
                </p>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
