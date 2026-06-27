import { useState } from 'react';
import type { ControlMode, UploadedFile } from '../types/workflow';
import { Icon } from './Icon';

interface AgentControlProps {
  controlMode: ControlMode;
  uploadedFiles: UploadedFile[];
  onModeChange: (mode: ControlMode) => void;
  onSimulateUpload: () => Promise<void>;
}

export function AgentControl({
  controlMode,
  uploadedFiles,
  onModeChange,
  onSimulateUpload,
}: AgentControlProps) {
  const [isListening, setIsListening] = useState(false);
  const [input, setInput] = useState('');
  const [showDropState, setShowDropState] = useState(false);
  const [localNotice, setLocalNotice] = useState<string | null>(null);

  function handleVoiceCapture() {
    if (isListening) {
      return;
    }

    setIsListening(true);
    setLocalNotice('Listening…');

    window.setTimeout(() => {
      setInput('Can you tighten the benchmark framing before we draft the introduction?');
      setLocalNotice('Voice note transcribed.');
      setIsListening(false);
    }, 1400);
  }

  async function handleUpload() {
    setShowDropState(true);
    setLocalNotice('Drag and drop paper into the control lane.');
    await onSimulateUpload();
    window.setTimeout(() => setShowDropState(false), 2500);
  }

  function handleSend() {
    setLocalNotice('Follow-up queued for the research agent.');
    setInput('');
  }

  return (
    <section className={`agent-control glass-surface ${isListening ? 'is-listening' : ''}`}>
      <div className="agent-control-top">
        <div>
          <span className="eyebrow">Research Agent status</span>
          <strong>live</strong>
          <p>
            {controlMode === 'automation'
              ? 'Full Automation: continues until approval gates.'
              : 'Discuss: asks for clarification before major steps.'}
          </p>
        </div>

        <div className="toggle-group" role="tablist" aria-label="Agent mode">
          <button
            className={controlMode === 'automation' ? 'is-active' : ''}
            onClick={() => onModeChange('automation')}
            type="button"
          >
            Full Automation
          </button>
          <button
            className={controlMode === 'discuss' ? 'is-active' : ''}
            onClick={() => onModeChange('discuss')}
            type="button"
          >
            Discuss
          </button>
        </div>
      </div>

      <div className="agent-input-row">
        <button className="icon-button" onClick={handleVoiceCapture} type="button">
          <Icon className="icon" name="mic" />
        </button>
        <button className="icon-button" onClick={handleUpload} type="button">
          <Icon className="icon" name="upload" />
        </button>
        <input
          onChange={(event) => setInput(event.target.value)}
          placeholder="Discover more / Ask follow-up…"
          value={input}
        />
        <button className="button-primary" onClick={handleSend} type="button">
          <Icon className="icon" name="send" />
          <span>Send</span>
        </button>
      </div>

      {showDropState ? (
        <div className="dropzone-card compact-drop">
          <Icon className="icon" name="drag" />
          <div>
            <strong>Drag and drop paper</strong>
            <p>Simulated upload state for follow-up files and notes.</p>
          </div>
        </div>
      ) : null}

      {uploadedFiles.length ? (
        <div className="file-chip-row">
          {uploadedFiles.slice(-2).map((file) => (
            <div className="file-chip" key={file.id}>
              <strong>{file.name}</strong>
              <span>{file.status}</span>
            </div>
          ))}
        </div>
      ) : null}

      {localNotice ? <div className="inline-notice">{localNotice}</div> : null}
    </section>
  );
}
