import type { ToolDetail } from '../types/tools';

interface DetailPanelProps {
  detail: ToolDetail | null;
}

export function DetailPanel({ detail }: DetailPanelProps) {
  return (
    <aside className="detail-panel glass-surface">
      <div className="detail-header">
        <span className="eyebrow">Detail</span>
        <h2>Detail</h2>
      </div>

      {!detail ? (
        <div className="detail-empty">
          Click a tool block to view the full information.
        </div>
      ) : (
        <div className="detail-content">
          <div className="detail-title-row">
            <strong>{detail.name}</strong>
            <span className={`status-pill is-${detail.status}`}>{detail.status}</span>
          </div>
          <div className="detail-section">
            <span className="eyebrow">Time used</span>
            <p>{detail.timeUsedLabel}</p>
          </div>
          <div className="detail-section">
            <span className="eyebrow">Input</span>
            <pre>{JSON.stringify(detail.inputPreview, null, 2)}</pre>
          </div>
          <div className="detail-section">
            <span className="eyebrow">Output</span>
            <pre>{JSON.stringify(detail.outputPreview, null, 2)}</pre>
          </div>
          <div className="detail-section">
            <span className="eyebrow">Sources</span>
            <div className="chip-row">
              {detail.sources.map((source) => (
                <span className="source-chip" key={source.id}>
                  {source.label}
                </span>
              ))}
            </div>
          </div>
          <div className="detail-section">
            <span className="eyebrow">Citations</span>
            <div className="citation-list">
              {detail.citations.length ? (
                detail.citations.map((citation) => (
                  <div className="citation-list-item" key={citation.id}>
                    {citation.title} ({citation.venue} {citation.year})
                  </div>
                ))
              ) : (
                <p>No linked citations for this tool.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
