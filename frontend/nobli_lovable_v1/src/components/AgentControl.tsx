import { useState } from "react";
import { ArrowUp, Mic, Paperclip, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type AgentMode = "Full Automation" | "Discuss";

export function AgentControl({
  mode,
  setMode,
}: {
  mode: AgentMode;
  setMode: (m: AgentMode) => void;
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
          ? "color-mix(in srgb, var(--brand-yellow) 10%, rgba(255,255,255,0.92))"
          : "rgba(255,255,255,0.82)",
      }}
    >
      <div className="mx-auto max-w-[980px]">
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
            <span
              className="text-foreground"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              Research agent · {isDiscuss ? "discuss mode" : "live"}
            </span>
            <span className="text-ink-muted">
              · {isDiscuss
                ? "agent pauses before every step and waits for your call"
                : "runs end-to-end, pausing only at critical approval gates"}
            </span>
          </div>
          <div
            className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5"
            style={{ boxShadow: "var(--shadow-quiet)" }}
          >
            {(["Full Automation", "Discuss"] as AgentMode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  toast(m === "Discuss" ? "Discuss mode — I'll pause at every step." : "Full automation — I'll run end-to-end.");
                }}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] transition-colors",
                  mode === m
                    ? "text-foreground"
                    : "text-ink-muted hover:text-foreground",
                )}
                style={
                  mode === m
                    ? {
                        background:
                          m === "Discuss"
                            ? "color-mix(in srgb, var(--brand-yellow) 38%, white)"
                            : "color-mix(in srgb, var(--brand-blue) 30%, white)",
                        fontFamily: "var(--font-ui)",
                        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.42)",
                      }
                    : { fontFamily: "var(--font-ui)" }
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
            "flex items-center gap-1.5 rounded-[22px] border bg-card px-2.5 py-2 transition-colors",
            drop ? "bg-[var(--color-surface)]" : "border-border",
          )}
          style={{
            borderColor: drop ? "var(--brand-blue)" : undefined,
            boxShadow: "var(--shadow-soft)",
          }}
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
            className="flex-1 bg-transparent px-1 text-[13px] text-foreground placeholder:text-ink-muted focus:outline-none"
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
              toast.success("Sent to agent: " + (msg.length > 50 ? msg.slice(0, 50) + "…" : msg));
              setText("");
              setListening(false);
            }}
            className="grid h-8 w-8 place-items-center rounded-full bg-foreground text-background transition-all hover:-translate-y-px hover:opacity-92"
            style={{ boxShadow: "var(--shadow-quiet)" }}
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
        "grid h-8 w-8 place-items-center rounded-full text-ink-muted transition-colors hover:bg-[var(--color-surface-2)] hover:text-foreground",
        active && "text-foreground shadow-[inset_0_0_0_1px_rgba(172,206,234,0.24)]",
      )}
      style={
        active
          ? {
              background: "color-mix(in srgb, var(--brand-blue) 22%, white)",
              boxShadow: "0 0 0 1px rgba(172,206,234,0.22)",
            }
          : undefined
      }
    >
      {children}
    </button>
  );
}
