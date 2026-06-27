import { useEffect, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { HomeInput } from './components/HomeInput';
import { RunningWorkspace } from './components/RunningWorkspace';
import { homeExampleTasks, modeConfigs } from './data/mockWorkflow';
import {
  getToolDetail,
  prepareOverleafHandoff,
  preparePdfExport,
  sendReminderToPhone,
  startAgentRun,
  submitApproval,
  subscribeToAgentRun,
  uploadResearchFile,
} from './services/agentService';
import { getWorkflowStages } from './services/workflowService';
import type { ToolBlock, ToolDetail } from './types/tools';
import type {
  AgentRun,
  ControlMode,
  ResearchMode,
  StreamEvent,
  UploadedFile,
  WorkflowStage,
} from './types/workflow';

function cloneAndSortEvents(events: StreamEvent[]): StreamEvent[] {
  return [...events].sort((left, right) => left.elapsedMs - right.elapsedMs);
}

export default function App() {
  const [view, setView] = useState<'home' | 'running'>('home');
  const [selectedMode, setSelectedMode] = useState<ResearchMode>('write');
  const [run, setRun] = useState<AgentRun | null>(null);
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [selectedToolDetail, setSelectedToolDetail] = useState<ToolDetail | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [controlMode, setControlMode] = useState<ControlMode>('automation');
  const [actionMessages, setActionMessages] = useState<{
    pdf?: string;
    overleaf?: string;
    phone?: string;
  }>({});
  const approvalTimers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      approvalTimers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (!run) {
      return;
    }

    const unsubscribe = subscribeToAgentRun(run.id, applyStreamEvent);
    return () => unsubscribe();
  }, [run?.id]);

  function updateRunFromEvent(event: StreamEvent) {
    setRun((current) => {
      if (!current) {
        return current;
      }

      const currentStageId =
        event.stageTransitions?.find((transition) => transition.status !== 'completed')?.stageId ??
        event.stageTransitions?.at(-1)?.stageId ??
        event.stageId;

      return {
        ...current,
        currentStageId,
        status: event.runStatus ?? current.status,
        usedCredits: current.usedCredits + (event.creditDelta ?? 0),
      };
    });
  }

  function updateStagesFromEvent(event: StreamEvent) {
    if (!event.stageTransitions?.length) {
      return;
    }

    setStages((current) =>
      current.map((stage) => {
        const update = event.stageTransitions?.find((transition) => transition.stageId === stage.id);
        return update ? { ...stage, status: update.status } : stage;
      }),
    );
  }

  function applyStreamEvent(event: StreamEvent) {
    setEvents((current) => cloneAndSortEvents([...current, event]));
    updateRunFromEvent(event);
    updateStagesFromEvent(event);
  }

  async function handleStartTask(taskInput: string) {
    approvalTimers.current.forEach((timer) => window.clearTimeout(timer));
    approvalTimers.current = [];

    const nextRun = await startAgentRun({ mode: selectedMode, taskInput });
    const nextStages = await getWorkflowStages(nextRun.id);

    setRun(nextRun);
    setStages(nextStages);
    setEvents([]);
    setSelectedToolId(null);
    setSelectedToolDetail(null);
    setActionMessages({});
    setView('running');
  }

  async function handleSelectTool(block: ToolBlock) {
    const detail = await getToolDetail(block.toolId);
    setSelectedToolId(block.toolId);
    setSelectedToolDetail(detail);
  }

  async function handleSimulatedUpload() {
    const uploadedFile = await uploadResearchFile();
    setUploadedFiles((current) => [...current, uploadedFile]);
    setUploadNotice(`${uploadedFile.name} uploaded and linked as context.`);
  }

  async function handleApprovalAction(
    action: 'accept' | 'reject' | 'ask-revision',
    gateId: string,
  ) {
    if (!run) {
      return;
    }

    setEvents((current) =>
      current.map((event) => {
        if (event.outputCard?.kind !== 'approval' || event.outputCard.gate.id !== gateId) {
          return event;
        }

        const nextStatus =
          action === 'accept'
            ? 'accepted'
            : action === 'ask-revision'
              ? 'revision-requested'
              : 'rejected';

        return {
          ...event,
          outputCard: {
            ...event.outputCard,
            gate: {
              ...event.outputCard.gate,
              status: nextStatus,
            },
          },
        };
      }),
    );

    const response = await submitApproval({
      runId: run.id,
      eventId: gateId,
      action,
    });

    response.events.forEach((event, index) => {
      const timer = window.setTimeout(() => applyStreamEvent(event), 400 + index * 650);
      approvalTimers.current.push(timer);
    });
  }

  async function handlePreparePdf() {
    if (!run) {
      return;
    }
    const response = await preparePdfExport(run.id);
    setActionMessages((current) => ({ ...current, pdf: response.message }));
  }

  async function handlePrepareOverleaf() {
    if (!run) {
      return;
    }
    const response = await prepareOverleafHandoff(run.id);
    setActionMessages((current) => ({ ...current, overleaf: response.message }));
  }

  async function handleSendToPhone() {
    if (!run) {
      return;
    }
    const response = await sendReminderToPhone(run.id);
    setActionMessages((current) => ({ ...current, phone: response.message }));
  }

  function handleGoHome() {
    setView('home');
  }

  const modeSpecificExamples = modeConfigs.find((mode) => mode.id === selectedMode)?.exampleTasks ?? [];
  const exampleTasks = Array.from(new Set([...modeSpecificExamples, ...homeExampleTasks])).slice(0, 5);

  return (
    <div className={`app-shell ${view === 'running' ? 'is-running' : 'is-home'}`}>
      <Sidebar currentTask={run?.taskInput} onGoHome={handleGoHome} view={view} />

      {view === 'home' ? (
        <HomeInput
          exampleTasks={exampleTasks}
          modes={modeConfigs}
          onModeChange={setSelectedMode}
          onSimulateUpload={handleSimulatedUpload}
          onSubmit={handleStartTask}
          selectedMode={selectedMode}
          uploadNotice={uploadNotice}
          uploadedFiles={uploadedFiles}
        />
      ) : run ? (
        <RunningWorkspace
          actionMessages={actionMessages}
          controlMode={controlMode}
          events={events}
          onApprovalAction={handleApprovalAction}
          onControlModeChange={setControlMode}
          onPrepareOverleaf={handlePrepareOverleaf}
          onPreparePdf={handlePreparePdf}
          onSelectTool={handleSelectTool}
          onSendToPhone={handleSendToPhone}
          onSimulateUpload={handleSimulatedUpload}
          run={run}
          selectedToolDetail={selectedToolDetail}
          selectedToolId={selectedToolId}
          stages={stages}
          uploadedFiles={uploadedFiles}
        />
      ) : null}
    </div>
  );
}
