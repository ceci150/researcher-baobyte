import type { ModeConfig, ResearchMode } from '../types/workflow';

interface ModeStepSelectorProps {
  modes: ModeConfig[];
  selectedMode: ResearchMode;
  onSelect: (mode: ResearchMode) => void;
}

export function ModeStepSelector({
  modes,
  selectedMode,
  onSelect,
}: ModeStepSelectorProps) {
  return (
    <section className="mode-selector-panel">
      <div className="eyebrow">Choose research mode</div>
      <div className="mode-selector-track" role="tablist" aria-label="Choose research mode">
        {modes.map((mode, index) => {
          const isActive = mode.id === selectedMode;

          return (
            <button
              aria-selected={isActive}
              className={`mode-step ${isActive ? 'is-active' : ''}`}
              key={mode.id}
              onClick={() => onSelect(mode.id)}
              role="tab"
              type="button"
            >
              <span className="mode-step-node" />
              <span className="mode-step-copy">
                <strong>{mode.label}</strong>
              </span>
              {index < modes.length - 1 ? <span className="mode-step-connector" /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
