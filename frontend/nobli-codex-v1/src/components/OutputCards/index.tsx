import type { OutputCard } from '../../types/workflow';

interface OutputCardRendererProps {
  card: OutputCard;
  actionMessages: {
    pdf?: string;
    overleaf?: string;
    phone?: string;
  };
  onApprovalAction: (action: 'accept' | 'reject' | 'ask-revision', gateId: string) => void;
  onPreparePdf: () => void;
  onPrepareOverleaf: () => void;
  onSendToPhone: () => void;
}

function CompactList({ items }: { items: string[] }) {
  return (
    <ul className="compact-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function OutputCardRenderer({
  card,
  actionMessages,
  onApprovalAction,
  onPreparePdf,
  onPrepareOverleaf,
  onSendToPhone,
}: OutputCardRendererProps) {
  switch (card.kind) {
    case 'opportunities':
      return (
        <section className="output-card glass-surface">
          <div className="output-card-header">
            <div>
              <span className="eyebrow">Idea Discovery</span>
              <h3>{card.title}</h3>
            </div>
            <p>{card.subtitle}</p>
          </div>
          <div className="opportunity-grid">
            {card.opportunities.map((opportunity, index) => (
              <article className="opportunity-card" key={opportunity.id}>
                <div className="opportunity-topline">
                  <span className="rank-chip">#{index + 1}</span>
                  <span className={`fit-pill fit-${opportunity.fitLabel.toLowerCase().replace(/\s/g, '-')}`}>
                    {opportunity.fitLabel}
                  </span>
                </div>
                <h4>{opportunity.title}</h4>
                <p>{opportunity.whyNow}</p>
                <div className="metric-row">
                  <span>Novelty {opportunity.noveltyScore}</span>
                  <span>Feasibility {opportunity.feasibilityScore}</span>
                </div>
                <dl className="detail-grid">
                  <div>
                    <dt>Question</dt>
                    <dd>{opportunity.suggestedQuestion}</dd>
                  </div>
                  <div>
                    <dt>Method</dt>
                    <dd>{opportunity.possibleMethod}</dd>
                  </div>
                  <div>
                    <dt>Dataset</dt>
                    <dd>{opportunity.possibleDataset}</dd>
                  </div>
                  <div>
                    <dt>Contribution</dt>
                    <dd>{opportunity.expectedContribution}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      );
    case 'literature-survey':
      return (
        <section className="output-card glass-surface">
          <div className="output-card-header">
            <div>
              <span className="eyebrow">Literature Survey</span>
              <h3>{card.title}</h3>
            </div>
            <p>{card.subtitle}</p>
          </div>
          <div className="literature-layout">
            <div>
              <h4>Key papers</h4>
              <CompactList items={card.data.papers} />
            </div>
            <div>
              <h4>Schools of thought</h4>
              <CompactList items={card.data.schoolsOfThought} />
            </div>
            <div>
              <h4>Research gap</h4>
              <p>{card.data.researchGap}</p>
            </div>
            <div>
              <h4>Conflicting evidence</h4>
              <p>{card.data.conflictingEvidence}</p>
            </div>
            <div>
              <h4>Missing citations</h4>
              <CompactList items={card.data.missingCitations} />
            </div>
            <div>
              <h4>Recommended reading path</h4>
              <CompactList items={card.data.readingPath} />
            </div>
          </div>
        </section>
      );
    case 'experiment-design':
      return (
        <section className="output-card compact-output glass-surface">
          <div className="output-card-header">
            <div>
              <span className="eyebrow">Experiment Design</span>
              <h3>{card.title}</h3>
            </div>
            <p>{card.subtitle}</p>
          </div>
          <div className="compact-output-grid">
            <div>
              <h4>Hypotheses</h4>
              <CompactList items={card.data.hypotheses} />
            </div>
            <div>
              <h4>Datasets</h4>
              <CompactList items={card.data.datasets} />
            </div>
            <div>
              <h4>Metrics</h4>
              <CompactList items={card.data.metrics} />
            </div>
            <div>
              <h4>Execution notes</h4>
              <CompactList items={card.data.executionNotes} />
            </div>
          </div>
        </section>
      );
    case 'situation-diagnosis':
      return (
        <section className="output-card compact-output glass-surface">
          <div className="output-card-header">
            <div>
              <span className="eyebrow">Situation Diagnosis</span>
              <h3>{card.title}</h3>
            </div>
            <p>{card.subtitle}</p>
          </div>
          <div className="compact-output-grid">
            <div>
              <h4>Strengths</h4>
              <CompactList items={card.data.strengths} />
            </div>
            <div>
              <h4>Risks</h4>
              <CompactList items={card.data.risks} />
            </div>
            <div>
              <h4>Decisions</h4>
              <CompactList items={card.data.decisions} />
            </div>
          </div>
        </section>
      );
    case 'approval':
      return (
        <section className="output-card approval-card glass-surface">
          <div className="output-card-header">
            <div>
              <span className="eyebrow">Iteration &amp; Feedback</span>
              <h3>{card.title}</h3>
            </div>
            <p>{card.subtitle}</p>
          </div>
          <div className="approval-body">
            <h4>{card.gate.title}</h4>
            <p>{card.gate.summary}</p>
            <div className="approval-recommendation">{card.gate.recommendation}</div>
            <div className="approval-actions">
              {card.gate.actions.map((action) => (
                <button
                  className={action.id === 'accept' ? 'button-primary' : 'button-secondary'}
                  key={action.id}
                  onClick={() => onApprovalAction(action.id, card.gate.id)}
                  type="button"
                >
                  {action.label}
                </button>
              ))}
            </div>
            <div className="approval-status">
              <span className="eyebrow">Gate status</span>
              <span className={`status-pill is-${card.gate.status}`}>{card.gate.status}</span>
            </div>
          </div>
        </section>
      );
    case 'abstract-draft':
      return (
        <section className="output-card abstract-card glass-surface">
          <div className="output-card-header">
            <div>
              <span className="eyebrow">Writing Studio</span>
              <h3>{card.title}</h3>
            </div>
            <p>{card.subtitle}</p>
          </div>
          <div className="abstract-title">{card.data.title}</div>
          <p className="abstract-body">{card.data.abstract}</p>
          <div className="compact-output-grid">
            <div>
              <h4>Core contributions</h4>
              <CompactList items={card.data.contributions} />
            </div>
            <div>
              <h4>Anchor citations</h4>
              <CompactList items={card.data.citations} />
            </div>
          </div>
          <div className="draft-actions">
            <button className="button-secondary" onClick={onPreparePdf} type="button">
              Export PDF
            </button>
            <button className="button-secondary" onClick={onPrepareOverleaf} type="button">
              Overleaf
            </button>
            <button className="button-secondary" onClick={onSendToPhone} type="button">
              Send to phone
            </button>
          </div>
          <div className="action-message-row">
            {actionMessages.pdf ? <span className="inline-notice">{actionMessages.pdf}</span> : null}
            {actionMessages.overleaf ? (
              <span className="inline-notice">{actionMessages.overleaf}</span>
            ) : null}
            {actionMessages.phone ? (
              <span className="inline-notice">{actionMessages.phone}</span>
            ) : null}
          </div>
        </section>
      );
    case 'publish-and-influence':
      return (
        <section className="output-card compact-output glass-surface">
          <div className="output-card-header">
            <div>
              <span className="eyebrow">Publish &amp; Influence</span>
              <h3>{card.title}</h3>
            </div>
            <p>{card.subtitle}</p>
          </div>
          <div className="venue-grid">
            {card.data.targetVenues.map((venue) => (
              <article className="venue-card" key={venue.id}>
                <strong>{venue.name}</strong>
                <span className={`fit-pill fit-${venue.fit}`}>{venue.fit}</span>
                <p>{venue.note}</p>
                <small>Deadline {venue.deadline}</small>
              </article>
            ))}
          </div>
          <div>
            <h4>Deliverables</h4>
            <CompactList items={card.data.deliverables} />
          </div>
        </section>
      );
    case 'memory-growing':
      return (
        <section className="output-card compact-output glass-surface">
          <div className="output-card-header">
            <div>
              <span className="eyebrow">Memory &amp; Growing</span>
              <h3>{card.title}</h3>
            </div>
            <p>{card.subtitle}</p>
          </div>
          <div className="compact-output-grid">
            <div>
              <h4>Reminders</h4>
              <CompactList items={card.data.reminders} />
            </div>
            <div>
              <h4>Saved heuristics</h4>
              <CompactList items={card.data.heuristics} />
            </div>
          </div>
        </section>
      );
    default:
      return null;
  }
}
