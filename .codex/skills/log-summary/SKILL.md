---
name: log-summary
description: Extract metadata from experiment logs and maintain a persistent summary registry (log_summary.md). Use when user says "update log summary", "summarize logs", "log registry", after /lab-babysitter finds completed runs, or when user wants to record experiment metadata.
---

# Log Summary

Post-run bookkeeping: extract key metadata from completed experiment logs and append/update entries in `log_summary.md`.

**Only process DONE experiments** (not active/running). Pair with `/lab-babysitter` to identify which logs are complete.

## Schema

Each experiment entry must capture:

| Field | Source | Required |
|-------|--------|----------|
| Run ID / name | wandb line or output dir name (e.g., `profuse-Neeley`) | Yes |
| Timestamp | From run ID suffix or first log timestamp | Yes |
| Model | `prepare_for_exp` log line or config.yaml `model.name` | Yes |
| Method | `prepare_for_exp` log line or config.yaml `method` | Yes |
| Task/Dataset | `data.train_dataset` from config or log | Yes |
| Log file | Path relative to repo root (e.g., `logs/deployment_...log`) | Yes |
| Output dir | Path relative to repo root | Yes |
| Status | DONE / FAILED | Yes |
| Wandb URL | From `View run at:` line | Optional |
| Notes | Free text — key results, errors, anything notable | Optional |

## Markdown Format

```markdown
## {model_short_name} / {method} / {task}

| Field | Value |
|-------|-------|
| Run ID | `{run_id}` |
| Timestamp | {YYYY-MM-DD HH:MM} |
| Model | {full_model_name} |
| Method | {method} |
| Task | {task_or_dataset} |
| Log | `{log_path}` |
| Output | `{output_dir}` |
| Status | {DONE/FAILED} |
| Wandb | {url_or_N/A} |

**Notes:** {free text — key metrics, observations, errors}

---
```

## Workflow

### Step 1: Identify new completed logs

Compare `./logs/*.log` against entries already in `log_summary.md`. A log is "new" if its filename does not appear in the summary file.

```bash
# List all log files (exclude checkpoint-*.log)
ls ./logs/*.log | grep -v checkpoint

# Check which are already recorded
grep -l 'log_filename' log_summary.md
```

### Step 2: Extract metadata from each new log

For each unrecorded log:

1. **Read the first ~30 lines** (stripped of ANSI) to find:
   - `wandb: Syncing run {run_id}` → Run ID
   - `wandb: 🚀 View run at: {url}` → Wandb URL
   - `prepare_for_exp:57 - Model: {model} | Method: {method}` → Model + Method
   - `prepare_for_exp:58 - Output directory: {path}` → Output dir

2. **Read `{output_dir}/config.yaml`** for structured fields:
   - `model.name` → Model
   - `method` → Method
   - `data.train_dataset` → Task/Dataset
   - `seed` → Seed (for notes)

3. **Read the last ~10 lines** to determine status:
   - Contains `eval_diff.json` or `Evaluation complete` → DONE
   - Contains traceback or error → FAILED
   - Stopped without completion message → FAILED (likely OOM-killed)

4. **For eval-only runs**, extract key results from the summary table near end of log.

### Step 3: Append to log_summary.md

- Append new entries at the **end** of the file (before any trailing blank lines)
- Group by model if adding multiple entries from the same model batch
- Never overwrite existing entries — only append or update the Notes field
- **Only add entries whose output dir exists** — skip logs with missing/removed output folders

### Step 4: Update Table of Contents

After any add/remove/update, regenerate the TOC table at the top of `log_summary.md`:

```markdown
## Table of Contents

| # | Model | Method | Task | Run ID | Timestamp | Status |
|---|-------|--------|------|--------|-----------|--------|
| 1 | Model-Name | method | task | `run-id` | YYYY-MM-DD HH:MM | DONE |
...
```

The TOC must always reflect the current set of entries in the file. Re-number rows sequentially.

### Step 5: Update existing entries (if needed)

If user asks to update notes on an existing entry, find it by Run ID or log filename and edit in-place.

## Decision Logic

- **Append**: Log filename not found in `log_summary.md`
- **Update**: User explicitly asks to update notes/status on an existing entry
- **Skip**: Log is still ACTIVE (modified < 5 min ago) or already recorded

## Tips

- Strip ANSI codes when reading: `sed 's/\x1b\[[0-9;]*m//g'`
- For batch runs (same model, multiple tasks), add all entries in one pass
- If output dir doesn't exist (deleted/moved), **remove the entry** from log_summary.md entirely
- The helper script `scripts/parse_log_metadata.py` can extract fields programmatically
