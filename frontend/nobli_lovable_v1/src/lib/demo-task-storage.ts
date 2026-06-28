export const TASK_HISTORY_KEY = "nobli.taskHistory";

export type DemoTaskHistoryItem = {
  id: string;
  title: string;
  completedAt: string;
  pdfThumbnail?: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isHistoryItem(value: unknown): value is DemoTaskHistoryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.completedAt === "string" &&
    (typeof item.pdfThumbnail === "string" || typeof item.pdfThumbnail === "undefined")
  );
}

function createHistoryId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getTaskHistory(): DemoTaskHistoryItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(TASK_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistoryItem);
  } catch {
    return [];
  }
}

export function saveTaskHistory(items: DemoTaskHistoryItem[]) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(TASK_HISTORY_KEY, JSON.stringify(items));
  } catch {}
}

export function addCompletedTask(title: string, runId?: string) {
  const id = runId ?? createHistoryId();
  const items = getTaskHistory();
  if (items.some((item) => item.id === id)) {
    return items;
  }
  const nextItems = [
    {
      id,
      title,
      completedAt: new Date().toISOString(),
      pdfThumbnail: "demo-pdf-thumbnail",
    },
    ...items,
  ];
  saveTaskHistory(nextItems);
  return nextItems;
}
