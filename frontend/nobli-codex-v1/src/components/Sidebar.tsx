import { sidebarItems, taskHistory } from '../data/mockWorkflow';

interface SidebarProps {
  view: 'home' | 'running';
  currentTask?: string;
  onGoHome: () => void;
}

export function Sidebar({ view, currentTask, onGoHome }: SidebarProps) {
  return (
    <aside className={`sidebar-panel glass-surface sidebar-${view}`}>
      <button className="sidebar-brand" onClick={onGoHome} type="button">
        <span className="sidebar-brand-mark">N</span>
        <span className="sidebar-brand-copy">
          <strong>Nobli</strong>
          <span>Research workspace</span>
        </span>
      </button>

      <nav className="sidebar-nav" aria-label="Primary">
        {sidebarItems.map((item) => {
          const isActive =
            (view === 'home' && item === 'New task') ||
            (view === 'running' && item === 'All tasks');

          return (
            <button
              className={`sidebar-nav-item ${isActive ? 'is-active' : ''}`}
              key={item}
              onClick={item === 'Home' || item === 'New task' ? onGoHome : undefined}
              type="button"
            >
              <span className="sidebar-nav-dot" />
              <span>{item}</span>
            </button>
          );
        })}
      </nav>

      {view === 'running' && currentTask ? (
        <section className="sidebar-task-card">
          <div className="eyebrow">Current task</div>
          <p>{currentTask}</p>
        </section>
      ) : null}

      {view === 'running' ? (
        <section className="sidebar-history">
          <div className="eyebrow">Task history</div>
          {taskHistory.map((item) => (
            <div className="sidebar-history-item" key={item}>
              {item}
            </div>
          ))}
        </section>
      ) : null}

      <div className="sidebar-footer">
        <div className="sidebar-credits">
          <span className="eyebrow">Credits</span>
          <strong>184 / 240 used</strong>
          <span>Demo workspace</span>
        </div>
        <div className="sidebar-user">
          <span className="sidebar-avatar">LR</span>
          <div>
            <strong>Lin Researcher</strong>
            <span>Principal investigator</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
