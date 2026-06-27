import { useState } from "react";
import { ArrowUp, Mic, Paperclip, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type AgentMode = "Full Automation" | "Discuss";

export function AgentControl({
  mode,
  setMode,
  onSendFollowUp,
}: {
  mode: AgentMode;
  setMode: (m: AgentMode) => void;
  onSendFollowUp?: (message: string) => Promise<void> | void;
}) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [drop, setDrop] = useState(false);

  const isDiscuss = mode === "Discuss";
  return (
    <div
      className="border-t border-border px-5 py-3 backdrop-blur-sm transition-colors"
      style={{
        backgroundColor: isDiscuss
          ? "color-mix(in oklab, var(--stage-0-ring) 8%, var(--color-card))"
          : undefined,
      }}
    >
      <div className="mx-auto max-w-[820px]">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11.5px]">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                style={{ background: isDiscuss ? "var(--stage-0-ring)" : "var(--color-running)" }}
              />
              <span
                className="relative inline-flex h-1.5 w-1.5 rounded-full"
                style={{ background: isDiscuss ? "var(--stage-0-ring)" : "var(--color-running)" }}
              />
            </span>
            <span className="text-foreground">Research agent · {isDiscuss ? "discuss mode" : "live"}</span>
            <span className="text-ink-muted">
              · {isDiscuss
                ? "agent pauses before every step and waits for your call"
                : "runs end-to-end, pausing only at critical approval gates"}
            </span>
          </div>
          <div className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5">
            {(["Full Automation", "Discuss"] as AgentMode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  toast(m === "Discuss" ? "Discuss mode — I'll pause at every step." : "Full automation — I'll run end-to-end.");
                }}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] transition-colors",
                  mode === m
                    ? m === "Discuss"
                      ? "text-background"
                      : "bg-foreground text-background"
                    : "text-ink-muted hover:text-foreground",
                )}
                style={
                  mode === m && m === "Discuss"
                    ? { background: "var(--stage-0-ring)" }
                    : undefined
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrop(true);
          }}
          onDragLeave={() => setDrop(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrop(false);
          }}
          className={cn(
            "flex items-center gap-1.5 rounded-xl border bg-card px-2 py-1.5 transition-colors",
            drop ? "border-foreground bg-[var(--color-surface)]" : "border-border",
          )}
        >
          <IconBtn title="Upload" onClick={() => toast("Upload — choose a paper, dataset, or note")}><Upload className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn title="Attach" onClick={() => toast("Attach — link a reference to this run")}><Paperclip className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn
            title="Voice input"
            active={listening}
            onClick={() => setListening((v) => !v)}
          >
            <Mic className="h-3.5 w-3.5" />
          </IconBtn>
          <input
            value={listening ? "Listening… add a faithfulness ablation on Waterbirds" : text}
            onChange={(e) => setText(e.target.value)}
            placeholder={drop ? "Drop paper to attach…" : "Discover more / Ask follow-up…"}
            className="flex-1 bg-transparent px-1 text-[12.5px] text-foreground placeholder:text-ink-muted focus:outline-none"
          />
          <button
            onClick={() => {
              const msg = listening
                ? "Listening… add a faithfulness ablation on Waterbirds"
                : text;
              if (!msg.trim()) {
                toast("Type a follow-up first.");
                return;
              }
              Promise.resolve(onSendFollowUp?.(msg))
                .then(() => {
                  toast.success("Sent to agent: " + (msg.length > 50 ? msg.slice(0, 50) + "…" : msg));
                  setText("");
                  setListening(false);
                })
                .catch((error) => {
                  toast.error(error instanceof Error ? error.message : "Failed to send follow-up.");
                });
            }}
            className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background hover:opacity-90"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  active,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-[var(--color-surface-2)] hover:text-foreground transition-colors",
        active && "bg-[var(--color-surface-2)] text-foreground",
      )}
    >
      {children}
    </button>
  );
}
