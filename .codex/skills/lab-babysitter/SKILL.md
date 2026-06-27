---
name: lab-babysitter
description: Monitor running experiments by scanning ./logs/ for active log files. Detects experiment status (running/finished/failed), parses config/wandb/data info, estimates remaining time, surfaces errors with fix suggestions. Use when user says "check experiments", "what's running", "babysit", "monitor", "experiment status", or invokes /lab-babysitter.
---

# Lab Babysitter

Read-only experiment monitor. Scans `./logs/` to report what's running, what finished, and what broke.

**IMPORTANT: Never modify code or config files. Only read and report.**

**Multi-node context**: Experiments may run on different nodes (not SSH-able from here). The only shared interface is the filesystem — `./logs/`, `outputs/`, `scripts/`, `configs/` are all on a shared mount. You cannot run `nvidia-smi`, check processes, or inspect GPU state on remote nodes. All monitoring must be file-based.

## Workflow

### Step 1: Discover and classify logs

```bash
ls -lt --time-style=full-iso ./logs/*.log 2>/dev/null
```

Classify each log by how recently it was modified:
- **ACTIVE**: modified within last 5 minutes
- **STALE**: modified 5–60 minutes ago (may be stuck or just finished)
- **DONE**: modified >60 minutes ago

### Step 2: Find the launch command for each log

Each log file was created by a shell command that redirects to it, e.g.:
```
CUDA_VISIBLE_DEVICES=0 python scripts/run_sft_benign_ft.py \
    --config configs/deployment/sft_benign_ft_deployment.yaml \
    model.name="Qwen/Qwen3.5-9B" \
    data.train_dataset=gsm8k \
    eval.lm_eval.0.tasks="[gsm8k]" > logs/deployment_original_llm_benign_ft_gsm8k-qwen3.5-9b.log 2>&1 &
```

To find the launch command, search deployment scripts for the log filename:
```bash
grep -rn '<log_filename>' scripts/deployment/ scripts/*.sh
```

Once you find the launch command, extract and report:
- **The full command** — display it verbatim so the user can see exactly what was launched
- **Which script** — the python script being run
- **Which config file** — the `--config` argument (read this file too for base settings)
- **CLI overrides** — any dot-notation overrides on the command line (these override the config file)

Cross-check: the CLI overrides should match what you see in `<output_dir>/config.yaml`. If they don't, flag the discrepancy.

Note: `CUDA_VISIBLE_DEVICES` in the launch command shows which GPU was intended, but experiments may run on a different node than where this babysitter runs. Don't treat GPU info as actionable — it's just context.

If the log filename is not found in any script (e.g., manually launched), note that the launch command was not found in deployment scripts.

### Step 3: Build the actual config from the launch command

The experiment's actual configuration comes from the launch command found in Step 2:
1. **Read the base config file** — the `--config` argument (e.g., `configs/deployment/sft_benign_ft_deployment.yaml`)
2. **Apply CLI overrides on top** — dot-notation args on the command line (e.g., `model.name="Qwen/Qwen3.5-9B"`, `data.train_dataset=gsm8k`) override the base config

Together, these define what the experiment is actually doing. Report details **only from what you read in the base config + CLI overrides**. Do NOT guess from the log filename.

Key fields to report:
- `model.name` — the actual model being used
- `method` — the training method
- `data.train_dataset`, `data.chat_format` — what data and format
- `data.mix_with` — any data mixing config
- `lr`, `num_epochs`, `batch_size`, `max_length` — training hyperparams
- `lora.*` — LoRA settings (r, alpha, target_modules)
- `seed` — random seed
- `eval.*` — what evaluations are configured

If the launch command was not found in scripts, fall back to reading `<output_dir>/config.yaml` (the resolved snapshot saved at runtime). The log will mention the output directory path in its early lines.

If neither source is available, say so — don't fabricate details.

### Step 3b: Read each log for runtime state

For each log, read its content directly — don't rely on fixed grep patterns.

**Read the beginning** (first ~100 lines) to find:
- The experiment's **output directory** path
- Any wandb run URL

**Read the end** (last ~150 lines) to understand current state:
- What was the last thing that happened?
- Is it still making progress, or did it stop?
- Any errors, tracebacks, or warnings?

Logs contain ANSI color codes from console output. Strip them mentally or with `sed 's/\x1b\[[0-9;]*m//g'` when needed for clean reading.

### Step 4: Determine experiment phase

Read the log content and figure out where the experiment is in its lifecycle. The typical pipeline is:

1. Setup (config loading, wandb init, model download)
2. Pre-training evaluation (optional)
3. Training (the longest phase — look for loss values, step counts, epoch progress)
4. Post-training evaluation (optional)
5. Final summary / completion

Look for any signals of progress: timestamps, loss values, step counters, evaluation scores, "complete"/"done"/"finished" messages, saved files. The exact format varies — use your judgment to interpret what you see.

### Step 5: Estimate time remaining (ACTIVE only)

For experiments that are still running:
- Find the first and last timestamps in the log to calculate elapsed time
- Look for any progress indicators (step X/N, epoch X/N, percentage, progress bars)
- If a ratio is available, extrapolate: `remaining ≈ elapsed × (total - current) / current`
- If no ratio, just report elapsed time and describe what phase it's in

### Step 6: Detect errors and diagnose

Scan the log for anything that looks like an error — tracebacks, ERROR-level log lines, exception messages, process crashes, or abrupt endings.

For each error found:
- Read the surrounding context (~10 lines before and after) to understand what triggered it
- Based on the error type and context, suggest a likely fix

**Common patterns and their usual fixes** (suggest only, never apply):

| Symptom | Usual Fix |
|---|---|
| CUDA out of memory / OOM | Reduce batch_size, max_length, or gradient_accumulation_steps |
| Eval subprocess failed | Check subprocess log at `<exp_dir>/{before,after}_sft/log.log` |
| File or path not found | Verify model/dataset path, check HF_TOKEN |
| Dataset column missing | Check data.chat_format matches the dataset |
| dtype / scalar type mismatch | Check quantization config (load_in_4bit/8bit) |
| Network / HTTP error | Retry — transient download failure |
| Log stopped, no error, no completion | Likely OOM-killed by OS — user should check `dmesg` on the node that ran it (not accessible from here) |

These are hints, not rules. Read the actual error and use your judgment.

### Step 7: Report

**Summary table** — one row per log file:

```
| # | Log File | Status | Model | Method | Phase | Elapsed | ETA |
|---|----------|--------|-------|--------|-------|---------|-----|
```

**Detailed report** — for ACTIVE and FAILED experiments only:
- **Launch command**: the full verbatim command from the deployment script (or "not found in scripts" if manually launched)
- **Config source**: which base config file (`--config` arg) + which CLI overrides were applied. If launch command not found, note the fallback source (e.g., `<output_dir>/config.yaml`)
- Experiment identity: model.name, method, data.train_dataset, data.chat_format
- Key hyperparams: lr, num_epochs, batch_size, max_length, lora.r, seed
- Data mixing: data.mix_with (if present)
- Eval setup: which lm_eval tasks and harmful_eval tasks are configured
- Wandb: run URL if found in log
- Output dir: full path
- Progress: what phase, how far along
- Last few meaningful log lines (stripped of ANSI)
- Errors: what went wrong + suggested fix
- Any other observations (warnings worth noting, unusual patterns)

**Never report details you didn't read from the config file or the log. If uncertain, say "not found in config" rather than guessing.**

## Tips

- For recurring monitoring, combine with `/loop 5m /lab-babysitter`
- If a log stopped updating but shows no error or completion, it was likely killed externally
- Per-experiment logs at `<output_dir>/log.log` may have more detail than the `./logs/` redirects
- `<output_dir>/eval_diff.json` existing = pipeline fully complete
- `<output_dir>/final/` existing = training checkpoint was saved
