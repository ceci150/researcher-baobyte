---
name: recap
description: Reconstruct full project context after time away. Produces a structured briefing covering repo purpose, recent activity, in-progress work, completed work, planned/unfinished items, and experiment status. Use when user says "catch me up", "recap", "where did I leave off", "what's the status", "what happened", "remind me where we are", or returns after absence.
---

# Recap

Bring the user up to speed on a repo they haven't touched in a while.

## Procedure

Gather information from the sources below, then produce a single structured briefing. Do all gathering in parallel where possible.

### 1. Gather (parallel)

| Source | What to extract |
|--------|----------------|
| `CLAUDE.md` / `README.md` | One-paragraph project summary |
| `docs/` | Read recent session summaries (sorted by date) for context on what was done |
| `.claude/**/memory/` | All memory files — project goals, user role, decisions, references |
| `git log --oneline -30` | Recent commits: who, when, what |
| `git branch -a` | Active branches (especially non-main) |
| `git stash list` | Any stashed work |
| `gh pr list --state open` | Open PRs |
| `gh issue list --state open --limit 20` | Open issues / planned work |
| `outputs/` | Recent experiment directories (ls -lt, top 10) — note which stage/method |
| `logs/` | Any active or recent log files |

### 2. Synthesize

Produce a briefing with these sections:

```
## What is this repo
[1-2 sentences from CLAUDE.md/README]

## Where we left off
[Most recent session summary + last few commits — what was the user doing last?]

## Recent activity (last N days)
[Key commits, merged PRs, completed experiments — bullet list]

## In progress
[Open branches, draft PRs, stashed changes, running experiments]

## Planned / not yet done
[Open issues, TODOs from docs, unfinished items mentioned in memory/session summaries]

## Experiment status
[Recent experiment dirs with their stage/method/date, any results or failures visible]

## Suggested next steps
[Based on the above — what seems like the natural continuation?]
```

### 3. Deliver

- Keep each section concise (3-7 bullets max).
- Flag anything that looks stale or abandoned.
- If a section has nothing, say "Nothing found" — don't omit it.
- End with 1-2 suggested actions the user could take right now.
