import { useEffect, useRef, useState } from 'react';
import type { ToolBlock, ToolDetail } from '../types/tools';
import type {
  AgentRun,
  ControlMode,
  StreamEvent,
  UploadedFile,
  WorkflowStage,
} from '../types/workflow';
import { formatDuration } from '../utils/format';
import { AgentControl } from './AgentControl';
import { AgentStream } from './AgentStream';
import { DetailPanel } from './DetailPanel';
import { ProcessBar } from './ProcessBar';

interface RunningWorkspaceProps {
  run: AgentRun;
  stages: WorkflowStage[];
  events: StreamEvent[];
  selectedToolId: string | null;
  selectedToolDetail: ToolDetail | null;
  uploadedFiles: UploadedFile[];
  controlMode: ControlMode;
  actionMessages: {
    pdf?: string;
    overleaf?: string;
    phone?: string;
  };
  onSelectTool: (block: ToolBlock) => void;
  onApprovalAction: (action: 'accept' | 'reject' | 'ask-revision', gateId: string) => void;
  onControlModeChange: (mode: ControlMode) => void;
  onSimulateUpload: () => Promise<void>;
  onPreparePdf: () => void;
  onPrepareOverleaf: () => void;
  onSendToPhone: () => void;
}

export function RunningWorkspace({
  run,
  stages,
  events,
  selectedToolId,
  selectedToolDetail,
  uploadedFiles,
  controlMode,
  actionMessages,
  onSelectTool,
  onApprovalAction,
  onControlModeChange,
  onSimulateUpload,
  onPreparePdf,
  onPrepareOverleaf,
  onSendToPhone,
}: RunningWorkspaceProps) {
  const [elapsedMs, setElapsedMs] = useState(Date.now() - new Date(run.startedAt).getTime());
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - new Date(run.startedAt).getTime());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [run.startedAt]);

  function handleStageSelect(stageId: string) {
    sectionRefs.current[stageId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleRegisterSection(stageId: string, element: HTMLElement | null) {
    sectionRefs.current[stageId] = element;
  }

  const currentStage = stages.find((stage) => stage.id === run.currentStageId) ?? stages[0];

  return (
    <section className="workspace-shell">
      <div className="workspace-main-column">
        <header className="workspace-header">
          <div className="workspace-meta glass-surface">
            <div>
              <span className="eyebrow">Current mode</span>
              <strong>{run.mode}</strong>
            </div>
            <div>
              <span className="eyebrow">Used credits</span>
              <strong>{run.usedCredits}</strong>
            </div>
            <div>
              <span className="eyebrow">Time elapsed</span>
              <strong>{formatDuration(elapsedMs)}</strong>
            </div>
            <div>
              <span className="eyebrow">Task status</span>
              <strong>{run.status}</strong>
            </div>
          </div>

          <div className="workspace-heading">
            <div>
              <span className="eyebrow">Current task</span>
              <h1>{run.taskInput}</h1>
              <p>{currentStage?.description}</p>
            </div>
          </div>

          <ProcessBar
            currentStageId={run.currentStageId}
            elapsedLabel={formatDuration(elapsedMs)}
            onStageSelect={handleStageSelect}
            runStatus={run.status}
            stages={stages}
          />
        </header>

        <AgentStream
          actionMessages={actionMessages}
          events={events}
          onApprovalAction={onApprovalAction}
          onPrepareOverleaf={onPrepareOverleaf}
          onPreparePdf={onPreparePdf}
          onRegisterSection={handleRegisterSection}
          onSendToPhone={onSendToPhone}
          onToolSelect={onSelectTool}
          selectedToolId={selectedToolId}
          stages={stages}
        />
      </div>

      <div className="workspace-side-column">
        <DetailPanel detail={selectedToolDetail} />
      </div>

      <AgentControl
        controlMode={controlMode}
        onModeChange={onControlModeChange}
        onSimulateUpload={onSimulateUpload}
        uploadedFiles={uploadedFiles}
      />
    </section>
  );
}
