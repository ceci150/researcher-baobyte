import {
  Home,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { label: string; icon: React.ElementType; key: string };
export type SidebarVariant = "expanded" | "collapsed" | "expanded-hover";

const NAV: NavItem[] = [
  { label: "New task", icon: Home, key: "new" },
  { label: "All tasks", icon: List, key: "all" },
];

export function Sidebar({
  active,
  currentTaskTitle,
  currentTaskStatus = "idle",
  onHome,
  onAllTasks,
  variant = "expanded",
  onMouseEnter,
  onMouseLeave,
}: {
  active: string;
  currentTaskTitle?: string;
  currentTaskStatus?: "idle" | "running" | "waiting" | "complete" | "failed";
  onHome: () => void;
  onAllTasks?: () => void;
  variant?: SidebarVariant;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const isCollapsed = variant === "collapsed";
  const showExpandedContent = !isCollapsed;
  const currentTaskLabel = {
    idle: "Idle",
    running: "Agent running",
    waiting: "Awaiting approval",
    complete: "Run complete",
    failed: "Connection failed",
  }[currentTaskStatus];
  const currentTaskDot = currentTaskStatus === "running"
    ? "bg-[var(--color-running)]"
    : currentTaskStatus === "waiting"
      ? "bg-foreground"
      : currentTaskStatus === "failed"
        ? "bg-destructive"
        : "bg-ink-muted";

  return (
    <aside
      className="relative hidden h-full shrink-0 min-[861px]:flex"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        width: isCollapsed ? 68 : 232,
        transition: "width 180ms ease",
      }}
    >
      <div
        className="flex h-full flex-1 flex-col border-r border-border bg-[var(--color-sidebar)]"
        style={{ boxShadow: "inset -1px 0 0 rgba(255,255,255,0.42)" }}
      >
        <div
          className={cn(
            "flex items-center pt-5 pb-4",
            isCollapsed ? "justify-center px-2.5" : "gap-2 px-4",
          )}
        >
          <div className="grid h-8 w-8 place-items-center rounded-2xl border border-border bg-card text-[10px] font-semibold text-foreground shadow-[var(--shadow-quiet)]">
            N
          </div>
          {showExpandedContent && (
            <div
              className="text-[13px] font-medium tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              Nobli
            </div>
          )}
        </div>

        <nav className={cn("flex flex-col gap-0.5", isCollapsed ? "px-2.5" : "px-2")}>
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === active;
            return (
              <button
                key={item.key}
                title={item.label}
                onClick={() => {
                  if (item.key === "new") onHome();
                  else onAllTasks?.();
                }}
                className={cn(
                  "rounded-xl text-[12.5px] text-ink-muted transition-colors",
                  isCollapsed
                    ? "flex h-10 items-center justify-center hover:bg-[var(--color-sidebar-accent)] hover:text-foreground"
                    : "flex items-center gap-2.5 px-2.5 py-2 text-left hover:bg-[var(--color-sidebar-accent)] hover:text-foreground",
                  isActive &&
                    "bg-[var(--color-sidebar-accent)] text-foreground font-medium shadow-[inset_0_0_0_1px_rgba(172,206,234,0.28)]",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {showExpandedContent && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {showExpandedContent && currentTaskTitle && (
          <div className="mt-5 px-3">
            <div
              className="px-1 pb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-ink-muted"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              Current task
            </div>
            <div
              className="rounded-2xl border border-border bg-card px-3 py-2.5 text-[12px] leading-snug"
              style={{ boxShadow: "var(--shadow-quiet)" }}
            >
              <div className="line-clamp-3 text-foreground">{currentTaskTitle}</div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-ink-muted">
                <span className="relative inline-flex h-1.5 w-1.5 items-center justify-center">
                  {currentTaskStatus === "running" && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-running)] opacity-60" />
                  )}
                  <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", currentTaskDot)} />
                </span>
                {currentTaskLabel}
              </div>
            </div>
          </div>
        )}

        {showExpandedContent && (
          <div className="mt-5 px-3">
            <div
              className="px-1 pb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-ink-muted"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              Task history
            </div>
            <div className="space-y-1 px-1 text-[12px] text-ink-muted">
              <div className="truncate">Survey: prototype-based vision XAI</div>
              <div className="truncate">Experiment: faithfulness under shift</div>
              <div className="truncate">Draft: ICLR rebuttal letter</div>
            </div>
          </div>
        )}
        <div
          className={cn(
            "mt-auto border-t border-border py-3",
            isCollapsed ? "px-2.5" : "px-3",
          )}
        >
          {showExpandedContent ? (
            <>
              <div className="mb-2 flex items-center justify-between text-[11px] text-ink-muted">
                <span>Credits</span>
                <span className="tabular-nums text-foreground">3,240 / 5,000</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                <div
                  className="h-full w-[64%] rounded-full"
                  style={{
                    background: "linear-gradient(90deg, var(--brand-blue), var(--brand-mint))",
                  }}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full border border-border bg-[var(--color-surface-2)] text-[11px] font-medium">
                  YK
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[12px] font-medium">Yuki Kano</span>
                  <span className="text-[10.5px] text-ink-muted">Researcher</span>
                </div>
              </div>
            </>
          ) : (
            <div className="grid place-items-center">
              <div
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-[var(--color-surface-2)] text-[11px] font-medium"
                title="Yuki Kano · Researcher"
              >
                YK
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
