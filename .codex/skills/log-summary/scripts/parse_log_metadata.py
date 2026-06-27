"""Parse experiment log files and extract structured metadata.

Usage:
    python .claude/skills/log-summary/scripts/parse_log_metadata.py logs/deployment_*.log
    python .claude/skills/log-summary/scripts/parse_log_metadata.py logs/deployment_*.log --json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ANSI_RE = re.compile(r"\x1b\[[0-9;]*m")


def strip_ansi(text: str) -> str:
    return ANSI_RE.sub("", text)


def parse_log(log_path: Path) -> dict[str, str | None]:
    """Extract metadata fields from a single log file."""
    meta: dict[str, str | None] = {
        "log_file": str(log_path),
        "run_id": None,
        "timestamp": None,
        "model": None,
        "method": None,
        "output_dir": None,
        "wandb_url": None,
        "status": None,
        "task": None,
    }

    text = log_path.read_text(errors="replace")
    lines = text.splitlines()

    # Parse first ~50 lines for setup info
    head = [strip_ansi(l) for l in lines[:50]]
    for line in head:
        if "Syncing run " in line:
            m = re.search(r"Syncing run (\S+)", line)
            if m:
                meta["run_id"] = m.group(1)

        if "View run at:" in line or ("View run" in line and "runs/" in line):
            m = re.search(r"(https://wandb\.ai/\S+)", line)
            if m:
                meta["wandb_url"] = m.group(1)

        if "prepare_for_exp" in line and "Model:" in line:
            m = re.search(r"Model:\s*(\S+)\s*\|\s*Method:\s*(\S+)", line)
            if m:
                meta["model"] = m.group(1)
                meta["method"] = m.group(2)

        if "prepare_for_exp" in line and "Output directory:" in line:
            m = re.search(r"Output directory:\s*(\S+)", line)
            if m:
                meta["output_dir"] = m.group(1)

    # Extract timestamp from output_dir (has full run_id with timestamp) or first log line
    ts_source = meta["output_dir"] or meta["run_id"] or ""
    m = re.search(r"(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})", ts_source)
    if m:
        meta["timestamp"] = f"{m.group(1)} {m.group(2)}:{m.group(3)}"
    else:
        # Fallback: first timestamp in log
        for line in head:
            m2 = re.search(r"(\d{4}-\d{2}-\d{2} \d{2}:\d{2})", line)
            if m2:
                meta["timestamp"] = m2.group(1)
                break

    # Parse last ~20 lines for status
    tail = [strip_ansi(l) for l in lines[-20:]]
    tail_text = "\n".join(tail)

    if "eval_diff.json" in tail_text or "Evaluation complete" in tail_text:
        meta["status"] = "DONE"
    elif "View run" in tail_text and ("wandb" in tail_text):
        # Wandb finalization at end typically means success
        meta["status"] = "DONE"
    elif "Traceback" in text[-5000:] or "Error" in tail_text:
        meta["status"] = "FAILED"
    else:
        meta["status"] = "UNKNOWN"

    # Try to get task from config.yaml in output_dir
    if meta["output_dir"]:
        config_path = Path(meta["output_dir"]) / "config.yaml"
        if config_path.exists():
            config_text = config_path.read_text()
            m = re.search(r"train_dataset:\s*(\S+)", config_text)
            if m:
                meta["task"] = m.group(1)

    # For eval runs, task is "utility_eval"
    if meta["method"] == "direct_eval":
        meta["task"] = "utility_eval"

    # Fallback: infer task from log filename
    if not meta["task"]:
        fname = log_path.stem
        # Pattern: deployment_original_llm_{type}_{task}-{model}.log
        m = re.search(r"(?:harmful_ft|benign_ft|normal_ft)_(.+?)(?:-qwen|-llama|-gemma|-ministral)", fname)
        if m:
            meta["task"] = m.group(1)

    return meta


def format_markdown(meta: dict[str, str | None]) -> str:
    """Format metadata as a markdown section."""
    model_short = meta["model"] or "unknown"
    if "/" in model_short:
        model_short = model_short.split("/")[-1].lower()
        model_short = re.sub(r"[_\.]", "-", model_short)

    method = meta["method"] or "unknown"
    task = meta["task"] or "unknown"

    lines = [
        f"## {model_short} / {method} / {task}",
        "",
        "| Field | Value |",
        "|-------|-------|",
        f"| Run ID | `{meta['run_id'] or 'N/A'}` |",
        f"| Timestamp | {meta['timestamp'] or 'N/A'} |",
        f"| Model | {meta['model'] or 'N/A'} |",
        f"| Method | {method} |",
        f"| Task | {task} |",
        f"| Log | `{meta['log_file']}` |",
        f"| Output | `{meta['output_dir'] or 'N/A'}` |",
        f"| Status | {meta['status'] or 'UNKNOWN'} |",
        f"| Wandb | {meta['wandb_url'] or 'N/A'} |",
        "",
        "**Notes:** ",
        "",
        "---",
        "",
    ]
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Parse experiment log metadata")
    parser.add_argument("logs", nargs="+", help="Log file paths")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()

    results = []
    for log_path in args.logs:
        p = Path(log_path)
        if not p.exists():
            print(f"WARNING: {log_path} not found, skipping", file=sys.stderr)
            continue
        results.append(parse_log(p))

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        for meta in results:
            print(format_markdown(meta))


if __name__ == "__main__":
    main()
