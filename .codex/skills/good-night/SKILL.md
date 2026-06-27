---
name: good-night
description: End-of-day ritual that writes a daily summary to ./docs and syncs outputs/logs to HF bucket. Use when user says "good night", "end of day", "wrap up", "daily summary", or invokes /good-night.
---

# Good Night

End-of-day wrap-up: summarize today's work, save to `./docs/`, sync to HF bucket.

## Workflow

### Step 1: Gather today's activity

Run these in parallel:

```bash
# Today's commits
git log --oneline --since="midnight" --all

# Files changed today (committed)
git diff --stat $(git log --since="midnight" --reverse --format="%H" | head -1)^..HEAD 2>/dev/null || git diff --stat HEAD~5..HEAD

# Untracked/modified files right now
git status --short

# New files added today (committed)
git log --since="midnight" --diff-filter=A --name-only --pretty=format:""

# Active/recently finished experiments
ls -lt --time-style=full-iso ./logs/*.log 2>/dev/null | head -10

# Wandb runs started today (from log files)
grep -h "View run at:" ./logs/*.log 2>/dev/null | grep "$(date +%Y%m%d)\|$(date +%Y-%m-%d)" | sort -u
```

### Step 2: Summarize the session

Also incorporate context from the current conversation — what was discussed, what decisions were made, what problems were solved.

Write a concise markdown summary with these sections:

```markdown
# {YYYY-MM-DD} Daily Summary

## What was done
- Bullet points of key accomplishments

## Commits
- List today's commits (short hash + message)

## Files added/modified
- Key new files and why
- Key modified files and what changed

## Experiment status
- What's currently running (from ./logs/ active files)
- What finished today (with key results if available)
- Wandb run URLs started today

## Dirty state
- Uncommitted changes (list files from `git status`)
- Anything half-done that needs attention tomorrow

## Blockers & open questions
- Things that got stuck or were deferred
- Questions that need answers before proceeding

## Decisions & notes
- Any design decisions, tradeoffs, or things to remember

## Next steps (actionable)
- Specific commands or tasks to run next session
- NOT vague ("continue X") — instead: exact commands, file paths, what to verify
- Priority order if multiple items
```

### Step 3: Save to docs

Write the summary to `./docs/{YYYY-MM-DD}-daily-summary.md`.

If a file with today's date already exists (e.g., from a prior session), **append** a new section with a timestamp header rather than overwriting.

### Step 4: Update CLAUDE.md if needed

Review today's work and check whether `CLAUDE.md` needs updates. CLAUDE.md is for **stable rules and standing decisions only** — not a code reference.

**Update if today's work introduced:**
- New standing conventions or coding rules
- New hard constraints or prohibitions
- Changes to the build/test/deploy workflow (常用命令)
- Architecture design decisions that future sessions need to respect (e.g., a new design pattern adopted)
- New technology stack entries
- Changes to the config system design, distributed training strategy, or experiment management conventions

**Do NOT update for:**
- New files, directories, or modules (derivable from the repo)
- Function names, signatures, or API changes (code is source of truth)
- Progress/status updates (stale immediately)
- Specific class names or config names (read `__init__.py` instead)

**If an update is warranted**, make it surgically — edit only the affected section. Then mention in the daily summary what was changed and why.

### Step 5: Sync to HF bucket

Run the sync script and capture output:

```bash
bash ./log_output_sync.sh 2>&1
```

**Before syncing:** Run dead link cleanup to avoid sync failures:
```bash
python outputs/clean_dead_links.py
```

**Report to user:**
- Whether sync succeeded or failed
- Any notable output (new files synced, errors)

If sync fails due to network/auth issues, report the error but don't retry — the user can run it manually later.

### Step 6: Final report

Tell the user:
- Where the summary was saved
- Sync status (success/failure + what was synced)
- A brief "good night" sign-off
