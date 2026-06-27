import type { AgentRunStatus, WorkflowStage } from '../types/workflow';

interface ProcessBarProps {
  stages: WorkflowStage[];
  currentStageId: string;
  runStatus: AgentRunStatus;
  elapsedLabel: string;
  onStageSelect: (stageId: string) => void;
}

export function ProcessBar({
  stages,
  currentStageId,
  runStatus,
  elapsedLabel,
  onStageSelect,
}: ProcessBarProps) {
  const activeIndex = Math.max(
    0,
    stages.findIndex((stage) => stage.id === currentStageId),
  );
  const progress = stages.length > 1 ? (activeIndex / (stages.length - 1)) * 100 : 0;

  return (
    <section className="process-card glass-surface">
      <div className="process-meta">
        <div>
          <span className="eyebrow">Process bar</span>
          <strong>{stages[activeIndex]?.label ?? 'Preparing run'}</strong>
        </div>
        <div className="process-status-stack">
          <span>{elapsedLabel}</span>
          <span className={`status-pill is-${runStatus.replace(/\s/g, '-')}`}>{runStatus}</span>
        </div>
      </div>

      <div className="process-track">
        <span className="process-track-base" />
        <span className="process-track-fill" style={{ width: `${progress}%` }} />
        <div className="process-stage-row">
          {stages.map((stage) => (
            <button
              className={`process-stage is-${stage.status} ${
                stage.id === currentStageId ? 'is-current' : ''
              }`}
              key={stage.id}
              onClick={() => onStageSelect(stage.id)}
              type="button"
            >
              <span className="process-stage-dot" />
              <span className="process-stage-copy">
                <strong>{stage.label}</strong>
                <small>{stage.description}</small>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
