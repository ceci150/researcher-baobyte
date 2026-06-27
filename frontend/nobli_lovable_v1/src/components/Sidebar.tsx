import {
  Home,
  Plus,
  List,
  FileText,
  FlaskConical,
  PenLine,
  CalendarClock,
  Brain,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type NavItem = { label: string; icon: React.ElementType; key: string };

const NAV: NavItem[] = [
  { label: "Home", icon: Home, key: "home" },
  { label: "New task", icon: Plus, key: "new" },
  { label: "All tasks", icon: List, key: "all" },
  { label: "My Papers", icon: FileText, key: "papers" },
  { label: "Experiments", icon: FlaskConical, key: "experiments" },
  { label: "Writing Drafts", icon: PenLine, key: "drafts" },
  { label: "Conference Watch", icon: CalendarClock, key: "conf" },
  { label: "Memory & Growing", icon: Brain, key: "memory" },
  { label: "Settings", icon: Settings, key: "settings" },
];

export function Sidebar({
  active,
  currentTaskTitle,
  onHome,
}: {
  active: string;
  currentTaskTitle?: string;
  onHome: () => void;
}) {
  return (
    <aside className="flex h-full w-[232px] shrink-0 flex-col border-r border-border bg-[var(--color-sidebar)]">
      <div className="flex items-center gap-2 px-4 pt-5 pb-4">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-[10px] font-semibold text-background">
          RC
        </div>
        <div className="text-[13px] font-medium tracking-tight">Research Compass</div>
      </div>

      <nav className="flex flex-col gap-0.5 px-2">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              onClick={() => {
                if (item.key === "home") onHome();
                else if (item.key === "new") onHome();
                else toast(`${item.label} · coming soon in this demo`);
              }}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12.5px] text-ink-muted hover:bg-[var(--color-sidebar-accent)] hover:text-foreground transition-colors text-left",
                isActive && "bg-[var(--color-sidebar-accent)] text-foreground font-medium",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {currentTaskTitle && (
        <div className="mt-5 px-3">
          <div className="px-1 pb-1.5 text-[10.5px] font-medium uppercase tracking-wider text-ink-muted">
            Current task
          </div>
          <div className="rounded-md border border-border bg-card px-2.5 py-2 text-[12px] leading-snug">
            <div className="line-clamp-3 text-foreground">{currentTaskTitle}</div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-ink-muted">
              <span className="relative inline-flex h-1.5 w-1.5 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-running)] opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-running)]" />
              </span>
              Agent running
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 px-3">
        <div className="px-1 pb-1.5 text-[10.5px] font-medium uppercase tracking-wider text-ink-muted">
          Task history
        </div>
        <div className="space-y-0.5 px-1 text-[12px] text-ink-muted">
          <div className="truncate">Survey: prototype-based vision XAI</div>
          <div className="truncate">Experiment: faithfulness under shift</div>
          <div className="truncate">Draft: ICLR rebuttal letter</div>
        </div>
      </div>

      <div className="mt-auto border-t border-border px-3 py-3">
        <div className="mb-2 flex items-center justify-between text-[11px] text-ink-muted">
          <span>Credits</span>
          <span className="tabular-nums text-foreground">3,240 / 5,000</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
          <div className="h-full w-[64%] rounded-full bg-foreground/80" />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-surface-2)] text-[11px] font-medium">
            YK
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[12px] font-medium">Yuki Kano</span>
            <span className="text-[10.5px] text-ink-muted">Researcher</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
