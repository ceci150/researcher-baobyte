"""Metric-driven autonomous experiment loop.

Inspired by Karpathy's `autoresearch`: given an editable codebase, a run
command, and a single scalar metric, an LLM proposes a change, the change is
applied and committed, the experiment is run, the metric is extracted from the
log, and the result is compared against the best so far. Improvements are kept
(the git branch advances); regressions are reverted (`git reset --hard`). Every
round is appended to `results.tsv`. The loop repeats until a budget is hit.

This is the engine behind `cli/main.py iterate`. It deliberately reuses the
project's existing primitives:
  - the project ``core`` git repo (commit / reset / log) for keep-or-revert,
  - the session-anchored ``BashTool`` (with injected OPENAI_API_KEY and the
    per-project venv on PATH) to actually run experiments,
  - ``provider.chat`` for the single structured "propose next change" call.
"""

from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any, Callable, Optional

import yaml
from loguru import logger


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

@dataclass
class ExperimentConfig:
    """Declarative spec for an iterative experiment, read from experiment.yaml.

    Example experiment.yaml::

        goal: "Maximize classification accuracy on the eval set."
        metric: accuracy          # the scalar the loop optimizes
        direction: maximize       # maximize | minimize
        metric_regex: '^accuracy:\\s*([0-9.]+)'  # captures the metric from stdout
        run_command: "python experiment.py"
        editable_files: [solution.py]   # files the LLM may modify
        readonly_files: [experiment.py] # context the LLM may read but not edit
        max_rounds: 10
        timeout_seconds: 600
        patience: 4               # stop after N consecutive non-improving rounds
    """
    goal: str = ""
    metric: str = "metric"
    direction: str = "maximize"  # "maximize" or "minimize"
    metric_regex: str = r"^metric:\s*([0-9.eE+-]+)"
    run_command: str = "python experiment.py"
    editable_files: list[str] = field(default_factory=list)
    readonly_files: list[str] = field(default_factory=list)
    max_rounds: int = 10
    timeout_seconds: int = 600
    patience: int = 0  # 0 = no early stop on stagnation

    @classmethod
    def load(cls, path: Path) -> "ExperimentConfig":
        data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        known = {f for f in cls.__dataclass_fields__}  # type: ignore[attr-defined]
        unknown = set(data) - known
        if unknown:
            logger.warning(f"experiment.yaml has unknown keys (ignored): {sorted(unknown)}")
        return cls(**{k: v for k, v in data.items() if k in known})

    def is_better(self, candidate: float, best: Optional[float]) -> bool:
        """Return True if candidate strictly improves on best for this direction."""
        if best is None:
            return True
        if self.direction == "minimize":
            return candidate < best
        return candidate > best


# ---------------------------------------------------------------------------
# Round records
# ---------------------------------------------------------------------------

@dataclass
class RoundResult:
    round_id: int
    commit: str = ""
    metric: Optional[float] = None
    status: str = "crash"        # keep | discard | crash
    description: str = ""
    log_tail: str = ""


# ---------------------------------------------------------------------------
# The proposer: a single structured LLM call that picks the next change
# ---------------------------------------------------------------------------

_PROPOSER_SYSTEM = """\
You are an autonomous ML research agent running an experiment loop. Each round
you propose ONE concrete change to the editable file(s) to improve a single
scalar metric. You see the full history of what has been tried and the current
file contents.

Rules:
- Propose a SINGLE focused change with a clear hypothesis. Avoid changing many
  things at once — small, attributable changes make the loop converge.
- Do NOT fabricate results. You only propose the edit; the harness runs it.
- Return STRICT JSON only, no prose, with this schema:
  {
    "description": "<= 12 word summary of the change, for the results log",
    "hypothesis": "one sentence: why this should improve the metric",
    "edits": [
      {"file": "<editable file path>",
       "find": "<exact substring currently in the file to replace>",
       "replace": "<new substring>"}
    ]
  }
- `find` must match EXACTLY ONE occurrence in the named file. Include enough
  surrounding context to be unique. To insert new code, anchor `find` on an
  existing line and include it in `replace`.
- Keep changes runnable: the code must still execute within the time budget.
"""


class ExperimentProposer:
    """Wraps a provider.chat call that returns the next change as JSON."""

    def __init__(self, provider: Any, model: Optional[str]):
        self.provider = provider
        self.model = model

    async def propose(
        self,
        config: ExperimentConfig,
        file_contents: dict[str, str],
        readonly_contents: dict[str, str],
        history: list[RoundResult],
        best_metric: Optional[float],
    ) -> dict[str, Any]:
        history_lines = []
        for r in history:
            m = f"{r.metric:.6f}" if r.metric is not None else "crash"
            history_lines.append(f"  round {r.round_id}: {r.status:8} {config.metric}={m}  — {r.description}")
        history_block = "\n".join(history_lines) if history_lines else "  (none yet)"

        editable_block = "\n\n".join(
            f"=== EDITABLE FILE: {name} ===\n{content}" for name, content in file_contents.items()
        )
        readonly_block = "\n\n".join(
            f"=== READ-ONLY FILE: {name} ===\n{content}" for name, content in readonly_contents.items()
        ) or "(none)"

        best_str = f"{best_metric:.6f}" if best_metric is not None else "none yet"
        user = f"""\
GOAL: {config.goal}
METRIC: {config.metric} (direction: {config.direction}); best so far: {best_str}

EXPERIMENT HISTORY (most recent last):
{history_block}

{readonly_block}

{editable_block}

Propose the next single change as strict JSON per the schema."""

        response = await self.provider.chat(
            messages=[
                {"role": "system", "content": _PROPOSER_SYSTEM},
                {"role": "user", "content": user},
            ],
            model=self.model,
            max_tokens=2000,
            temperature=0.7,
        )
        return _parse_proposal(response.content or "")


def _parse_proposal(text: str) -> dict[str, Any]:
    """Extract the first JSON object from the model output."""
    text = text.strip()
    # Strip markdown fences if present.
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.MULTILINE).strip()
    # Find the outermost {...}.
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError(f"No JSON object found in proposal: {text[:200]}")
    obj = json.loads(text[start : end + 1])
    if not isinstance(obj.get("edits"), list) or not obj["edits"]:
        raise ValueError("Proposal has no edits.")
    return obj


# ---------------------------------------------------------------------------
# The loop controller
# ---------------------------------------------------------------------------

class IterativeExperimentRunner:
    """Drives the propose → apply → commit → run → compare → keep/revert loop.

    Args:
        project:   a core.project.Project (provides .core dir and .git repo).
        provider:  an LLM provider with an async ``chat`` method.
        model:     model id for the proposer (None lets the provider decide).
        bash_run:  callable(command:str, cwd:str|None) -> str that runs a shell
                   command in the project sandbox (defaults to a BashTool).
        on_log:    optional callable(str) for streaming human-facing progress.
    """

    def __init__(
        self,
        project: Any,
        provider: Any,
        model: Optional[str] = None,
        bash_run: Optional[Callable[..., str]] = None,
        on_log: Optional[Callable[[str], None]] = None,
    ):
        self.project = project
        self.provider = provider
        self.model = model
        self.on_log = on_log or (lambda m: logger.info(m))
        self.proposer = ExperimentProposer(provider, model)
        self._bash_run = bash_run or self._default_bash_run

    # -- public API ---------------------------------------------------------

    async def run(self, config: ExperimentConfig) -> list[RoundResult]:
        core = self.project.core
        git = self.project.git
        if git is None:
            raise RuntimeError("Project has no git repo; iterative loop requires git for keep/revert.")

        # Write the results log OUTSIDE the git-tracked core, so that the
        # per-round `git reset --hard` (keep/revert) cannot roll it back.
        results_path = self.project.root / "results.tsv"
        self._ensure_results_header(results_path, config)

        history: list[RoundResult] = []
        best_metric: Optional[float] = None
        best_commit: str = self._current_commit()
        stagnation = 0

        # --- Round 0: baseline (run code as-is, no edit) ---
        self._log("🔬 Round 0: establishing baseline (no code change)")
        baseline = self._run_and_score(config, round_id=0, description="baseline")
        baseline.commit = best_commit
        if baseline.metric is not None:
            best_metric = baseline.metric
            baseline.status = "keep"
            self._log(f"📊 Baseline {config.metric} = {baseline.metric:.6f}")
        else:
            self._log("⚠️ Baseline crashed — continuing; first improvement will set the bar.")
        history.append(baseline)
        self._append_result(results_path, baseline, config)

        # --- Iterative rounds ---
        for round_id in range(1, config.max_rounds + 1):
            if config.patience and stagnation >= config.patience:
                self._log(f"🛑 Stopping early: {stagnation} non-improving rounds (patience={config.patience}).")
                break

            self._log(f"\n🔁 Round {round_id}/{config.max_rounds} (best {config.metric}={_fmt(best_metric)})")
            start_commit = self._current_commit()

            # 1. Propose
            try:
                file_contents = self._read_files(config.editable_files)
                readonly_contents = self._read_files(config.readonly_files)
                proposal = await self.proposer.propose(
                    config, file_contents, readonly_contents, history, best_metric
                )
            except Exception as e:
                self._log(f"  ⚠️ Proposal failed: {e}; skipping round.")
                continue

            desc = str(proposal.get("description", "unspecified change"))[:120]
            self._log(f"  💡 {desc}")
            if proposal.get("hypothesis"):
                self._log(f"     hypothesis: {proposal['hypothesis']}")

            # 2. Apply edits
            applied, apply_err = self._apply_edits(config, proposal["edits"])
            if not applied:
                self._log(f"  ⚠️ Could not apply edits: {apply_err}; reverting workspace.")
                git.reset(start_commit)
                continue

            # 3. Commit the attempt
            git.commit(f"[iterate] round {round_id}: {desc}")
            attempt_commit = self._current_commit()

            # 4 + 5. Run and score
            result = self._run_and_score(config, round_id=round_id, description=desc)
            result.commit = attempt_commit
            history.append(result)

            # 6. Compare → keep or revert
            if result.metric is not None and config.is_better(result.metric, best_metric):
                best_metric = result.metric
                best_commit = attempt_commit
                result.status = "keep"
                stagnation = 0
                self._log(f"  ✅ KEEP — {config.metric}={result.metric:.6f} (new best)")
            else:
                result.status = "discard" if result.metric is not None else "crash"
                stagnation += 1
                git.reset(start_commit)
                shown = _fmt(result.metric)
                self._log(f"  ↩️  {result.status.upper()} — {config.metric}={shown}; reverted to {start_commit[:7]}")

            # 7. Log
            self._append_result(results_path, result, config)

        # Make sure the working tree ends on the best commit.
        if self._current_commit() != best_commit:
            git.reset(best_commit)
        self._log(f"\n🏁 Done. Best {config.metric} = {_fmt(best_metric)} at commit {best_commit[:7]}")
        self._log(f"   Full log: {results_path}")
        return history

    # -- internals ----------------------------------------------------------

    def _run_and_score(self, config: ExperimentConfig, round_id: int, description: str) -> RoundResult:
        """Run the experiment command and extract the metric from its output."""
        self._log(f"  ▶️  running: {config.run_command}")
        t0 = time.time()
        try:
            output = self._bash_run(config.run_command)
        except Exception as e:
            return RoundResult(round_id=round_id, status="crash", description=description,
                               log_tail=f"harness error: {e}")
        dt = time.time() - t0
        metric = self._extract_metric(output, config.metric_regex)
        tail = "\n".join(output.splitlines()[-15:])
        if metric is None:
            self._log(f"  ⚠️ No metric matched /{config.metric_regex}/ in output ({dt:.0f}s).")
            return RoundResult(round_id=round_id, status="crash", description=description, log_tail=tail)
        return RoundResult(round_id=round_id, metric=metric, status="pending",
                           description=description, log_tail=tail)

    @staticmethod
    def _extract_metric(output: str, pattern: str) -> Optional[float]:
        rx = re.compile(pattern, re.MULTILINE)
        matches = rx.findall(output)
        if not matches:
            return None
        # Use the LAST match (final reported metric) and the first capture group.
        last = matches[-1]
        if isinstance(last, tuple):
            last = last[0]
        try:
            return float(last)
        except (TypeError, ValueError):
            return None

    def _read_files(self, names: list[str]) -> dict[str, str]:
        out: dict[str, str] = {}
        for name in names:
            p = self.project.core / name
            if p.exists():
                out[name] = p.read_text(encoding="utf-8")
            else:
                logger.warning(f"iterate: file not found, skipping: {name}")
        return out

    def _apply_edits(self, config: ExperimentConfig, edits: list[dict]) -> tuple[bool, str]:
        """Apply find/replace edits to editable files. All-or-nothing."""
        editable = set(config.editable_files)
        staged: list[tuple[Path, str]] = []
        for edit in edits:
            fname = edit.get("file")
            if fname not in editable:
                return False, f"edit targets non-editable file: {fname}"
            path = self.project.core / fname
            if not path.exists():
                return False, f"file does not exist: {fname}"
            content = path.read_text(encoding="utf-8")
            find = edit.get("find", "")
            replace = edit.get("replace", "")
            if not find:
                return False, f"empty 'find' for {fname}"
            count = content.count(find)
            if count == 0:
                return False, f"'find' not present in {fname}"
            if count > 1:
                return False, f"'find' matches {count} times in {fname} (must be unique)"
            staged.append((path, content.replace(find, replace, 1)))
        for path, new_content in staged:
            path.write_text(new_content, encoding="utf-8")
        return True, ""

    def _default_bash_run(self, command: str, cwd: Optional[str] = None) -> str:
        """Run a command in the project core via the session-anchored BashTool,
        which injects OPENAI_API_KEY/base and the per-project venv onto PATH."""
        from agent.tools.bash import BashTool

        class _CoreSession:
            """Minimal session shim anchoring BashTool to the project core."""
            id = "iterate"

            def __init__(self, project):
                self.project = project

            def resolve(self, p):
                base = self.project.core
                target = (base / p).resolve() if p and p != "." else base
                target.mkdir(parents=True, exist_ok=True)
                return target

        tool = BashTool(session=_CoreSession(self.project))
        return tool.execute(command, cwd=cwd)

    def _current_commit(self) -> str:
        res = self.project.git._run("git", "rev-parse", "HEAD")
        return (res.output or "").strip()

    def _ensure_results_header(self, path: Path, config: ExperimentConfig) -> None:
        if not path.exists():
            path.write_text(f"round\tcommit\t{config.metric}\tstatus\tdescription\n", encoding="utf-8")

    def _append_result(self, path: Path, r: RoundResult, config: ExperimentConfig) -> None:
        metric = f"{r.metric:.6f}" if r.metric is not None else "0.000000"
        desc = r.description.replace("\t", " ").replace("\n", " ")
        with path.open("a", encoding="utf-8") as f:
            f.write(f"{r.round_id}\t{r.commit[:7]}\t{metric}\t{r.status}\t{desc}\n")

    def _log(self, msg: str) -> None:
        self.on_log(msg)


def _fmt(v: Optional[float]) -> str:
    return f"{v:.6f}" if v is not None else "n/a"
