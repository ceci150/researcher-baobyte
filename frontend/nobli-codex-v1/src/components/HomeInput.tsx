import { useEffect, useState } from 'react';
import { demoTaskInput } from '../data/mockWorkflow';
import type { ModeConfig, ResearchMode, UploadedFile } from '../types/workflow';
import { Icon } from './Icon';
import { ModeStepSelector } from './ModeStepSelector';

interface HomeInputProps {
  modes: ModeConfig[];
  selectedMode: ResearchMode;
  exampleTasks: string[];
  uploadedFiles: UploadedFile[];
  uploadNotice: string | null;
  onModeChange: (mode: ResearchMode) => void;
  onSubmit: (taskInput: string) => void;
  onSimulateUpload: () => Promise<void>;
}

export function HomeInput({
  modes,
  selectedMode,
  exampleTasks,
  uploadedFiles,
  uploadNotice,
  onModeChange,
  onSubmit,
  onSimulateUpload,
}: HomeInputProps) {
  const activeMode = modes.find((mode) => mode.id === selectedMode) ?? modes[0];
  const [taskInput, setTaskInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showDropZone, setShowDropZone] = useState(false);
  const [helperMessage, setHelperMessage] = useState<string | null>(null);

  useEffect(() => {
    if (uploadNotice) {
      setHelperMessage(uploadNotice);
    }
  }, [uploadNotice]);

  function handleVoiceCapture() {
    if (isListening) {
      return;
    }

    setIsListening(true);
    setHelperMessage('Listening…');

    window.setTimeout(() => {
      setTaskInput((current) => current || activeMode.voiceTranscript);
      setHelperMessage('Voice note transcribed into the task box.');
      setIsListening(false);
    }, 1400);
  }

  async function handleUpload() {
    setShowDropZone(true);
    setHelperMessage('Drop paper PDFs, notes, BibTeX, or draft files here.');
    await onSimulateUpload();
    window.setTimeout(() => setShowDropZone(false), 2600);
  }

  function handleSubmit() {
    onSubmit(taskInput || demoTaskInput);
  }

  return (
    <main className="home-main">
      <div className="home-content">
        <div className="home-intro">
          <div className="eyebrow">Agentic workspace for serious research</div>
          <h1>Stay in the flow. Let research move.</h1>
          <p className="home-subtitle">
            Nobli turns a research goal into a live workspace with visible agent reasoning,
            approvals, drafting, and venue preparation.
          </p>
        </div>

        <div className="home-workbench">
          <div className="home-mode-column">
            <ModeStepSelector modes={modes} onSelect={onModeChange} selectedMode={selectedMode} />
            <section className="mode-context-card glass-surface">
              <span className="eyebrow">Selected intent</span>
              <strong>{activeMode.label}</strong>
              <p>{activeMode.promptHint}</p>
            </section>
          </div>

          <div className="home-input-column">
            <section className={`home-input-card glass-surface ${isListening ? 'is-listening' : ''}`}>
              <div className="input-card-header">
                <div>
                  <span className="eyebrow">New task</span>
                  <strong>{activeMode.label} mode selected</strong>
                </div>
                <button className="tertiary-action" onClick={() => setTaskInput(demoTaskInput)} type="button">
                  Load demo command
                </button>
              </div>

              <textarea
                aria-label="Task input"
                className="home-textarea"
                onChange={(event) => setTaskInput(event.target.value)}
                placeholder="Ask Nobli to explore, design, write, or publish your research…"
                rows={4}
                value={taskInput}
              />

              <div className="input-card-footer">
                <div className="input-actions">
                  <button className="icon-button" onClick={handleVoiceCapture} type="button">
                    <Icon className="icon" name="mic" />
                  </button>
                  <button className="icon-button" onClick={handleUpload} type="button">
                    <Icon className="icon" name="upload" />
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => {
                      setTaskInput(demoTaskInput);
                      setHelperMessage('Sample task inserted.');
                    }}
                    type="button"
                  >
                    <Icon className="icon" name="plus" />
                  </button>
                </div>
                <button className="button-primary send-button" onClick={handleSubmit} type="button">
                  <Icon className="icon" name="send" />
                  <span>Send</span>
                </button>
              </div>

              {helperMessage ? <div className="inline-notice">{helperMessage}</div> : null}

              {showDropZone ? (
                <div className="dropzone-card">
                  <Icon className="icon" name="drag" />
                  <div>
                    <strong>Drag and drop paper</strong>
                    <p>Simulated upload zone for PDFs, notes, datasets, and BibTeX.</p>
                  </div>
                </div>
              ) : null}

              {uploadedFiles.length ? (
                <div className="file-chip-row">
                  {uploadedFiles.map((file) => (
                    <div className="file-chip" key={file.id}>
                      <strong>{file.name}</strong>
                      <span>{file.status}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="example-task-section">
              {exampleTasks.map((task) => (
                <button
                  className="example-task-card"
                  key={task}
                  onClick={() => setTaskInput(task)}
                  type="button"
                >
                  {task}
                </button>
              ))}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
