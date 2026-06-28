"""End-to-end autonomous research pipeline: one prompt in, a paper PDF out.

Fixes the staged flow that was validated by hand on the budget-CoT demo into a
single orchestrator. Stages:

  1. SURVEY   — produce a short related-work brief for the research question.
  2. DESIGN   — generate the experiment scaffold (experiment.py harness,
                solution.py editable file, experiment.yaml metric spec), then
                VERIFY it actually runs (retry on failure).
  3. ITERATE  — run the validated metric-driven loop (IterativeExperimentRunner)
                to collect results.tsv.
  4. PLOT     — generate plot.py from results.tsv and run it (verify a PDF
                figure appears; retry on failure).
  5. WRITE    — fill a NeurIPS template with the real numbers + figure and
                compile to main.pdf with tectonic.

Reliability principle: every stage that emits CODE verifies it by executing it
and feeds errors back to the LLM for a bounded number of repair attempts,
rather than trusting a single generation (which we observed to be flaky).
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
from pathlib import Path
from typing import Any, Callable, Optional

from loguru import logger

from agent.scheduler.iterate import (
    ExperimentConfig,
    IterativeExperimentRunner,
)


# ---------------------------------------------------------------------------
# Helpers for LLM calls that must return code or JSON
# ---------------------------------------------------------------------------

def _strip_fences(text: str, lang: str = "") -> str:
    """Remove ``` fences (optionally ```<lang>) from a model reply."""
    t = text.strip()
    m = re.search(r"```(?:[a-zA-Z]+)?\s*\n(.*?)```", t, re.DOTALL)
    if m:
        return m.group(1).strip()
    return t


def _extract_json(text: str) -> dict:
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t, flags=re.MULTILINE).strip()
    s, e = t.find("{"), t.rfind("}")
    if s == -1 or e <= s:
        raise ValueError(f"no JSON object in reply: {text[:200]}")
    return json.loads(t[s : e + 1])


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------

class ResearchPipeline:
    """Drives SURVEY → DESIGN → ITERATE → PLOT → WRITE for one research prompt.

    Args mirror IterativeExperimentRunner: a Project (core dir + git), an LLM
    provider with async ``chat``, an optional model id, and an on_log callback.
    """

    MAX_CODE_REPAIRS = 3

    def __init__(
        self,
        project: Any,
        provider: Any,
        model: Optional[str] = None,
        on_log: Optional[Callable[[str], None]] = None,
        max_rounds: int = 5,
    ):
        self.project = project
        self.provider = provider
        self.model = model
        self.on_log = on_log or (lambda m: logger.info(m))
        self.max_rounds = max_rounds
        # Reuse the iterate runner's verified bash runner (key + venv injected).
        self._iter = IterativeExperimentRunner(project, provider, model, on_log=self.on_log)
        self._bash = self._iter._default_bash_run

    # -- public API ---------------------------------------------------------

    async def run(self, question: str) -> dict:
        core = self.project.core
        self._log(f"\n📋 Research question:\n   {question}\n")

        related = await self._survey(question)
        (core / "related_work.md").write_text(related, encoding="utf-8")
        self._git_commit("research: survey / related work")

        design = await self._design(question)  # writes experiment.py/solution.py/experiment.yaml
        self._git_commit("research: experiment scaffold")

        self._log("\n🔁 Stage 3/5 ITERATE — running metric-driven experiment loop")
        cfg = ExperimentConfig.load(core / "experiment.yaml")
        cfg.max_rounds = self.max_rounds
        await self._iter.run(cfg)  # writes results.tsv (project.root) + advances git

        await self._plot(question)  # writes plot.py + figures/*.pdf
        self._git_commit("research: figure")

        pdf = await self._write(question, related)
        self._git_commit("research: paper")

        self._log(f"\n🏁 Pipeline complete. Paper: {pdf}")
        return {"pdf": str(pdf), "related_work": str(core / "related_work.md")}

    # -- Stage 1: survey ----------------------------------------------------

    async def _survey(self, question: str) -> str:
        self._log("📚 Stage 1/5 SURVEY — drafting related work")
        prompt = (
            "You are a research assistant. For the research question below, write a "
            "concise Related Work brief (3-5 short paragraphs) naming the key prior "
            "directions and how the proposed study differs. Use only well-known, real "
            "lines of work; do NOT fabricate specific paper titles, authors, or years — "
            "refer to directions generically (e.g. 'chain-of-thought prompting', "
            "'self-consistency'). Output markdown.\n\n"
            f"Research question: {question}"
        )
        resp = await self.provider.chat(
            messages=[{"role": "user", "content": prompt}],
            model=self.model, max_tokens=1200, temperature=0.4,
        )
        return (resp.content or "").strip()

    # -- Stage 2: design + verify ------------------------------------------

    async def _design(self, question: str) -> dict:
        self._log("🧪 Stage 2/5 DESIGN — generating + verifying experiment scaffold")
        core = self.project.core
        feedback = ""
        for attempt in range(1, self.MAX_CODE_REPAIRS + 1):
            spec = await self._design_once(question, feedback)
            # Write the three files.
            (core / "experiment.py").write_text(spec["experiment_py"], encoding="utf-8")
            (core / "solution.py").write_text(spec["solution_py"], encoding="utf-8")
            (core / "experiment.yaml").write_text(spec["experiment_yaml"], encoding="utf-8")
            self._log(f"  attempt {attempt}: verifying experiment.py runs...")
            # Verify the harness runs and emits the declared metric.
            cfg = ExperimentConfig.load(core / "experiment.yaml")
            out = self._bash(cfg.run_command)
            metric = self._iter._extract_metric(out, cfg.metric_regex)
            if metric is not None:
                self._log(f"  ✅ scaffold verified — baseline {cfg.metric}={metric:.4f}")
                return spec
            tail = "\n".join(out.splitlines()[-20:])
            feedback = (
                f"The experiment did not print a line matching /{cfg.metric_regex}/. "
                f"Output tail:\n{tail}\nFix experiment.py/solution.py/experiment.yaml so a "
                f"baseline run prints the metric line."
            )
            self._log(f"  ⚠️ scaffold attempt {attempt} did not emit metric; repairing.")
        raise RuntimeError("DESIGN failed: could not produce a runnable experiment scaffold.")

    async def _design_once(self, question: str, feedback: str) -> dict:
        sys = (
            "You design a minimal, runnable experiment to study a research question "
            "with an LLM, on CPU/API only (no GPU, fast). Return STRICT JSON with keys: "
            "experiment_py, solution_py, experiment_yaml.\n"
            "Requirements:\n"
            "- experiment.py is the READ-ONLY evaluation harness. It imports the editable "
            "module (e.g. `import solution`), evaluates it, and PRINTS a final metric line "
            "like `accuracy: 0.1234` (you choose the metric name). Use a small FIXED eval "
            "set hard-coded in experiment.py so runs are reproducible.\n"
            "- It may call the OpenAI SDK: `from openai import OpenAI; "
            "client=OpenAI(api_key=os.environ['OPENAI_API_KEY'])`, model 'gpt-4o-mini'. "
            "Do NOT add API-key validation. Keep total API calls small (<= 30).\n"
            "- solution.py is the EDITABLE file holding the thing being optimized "
            "(e.g. a SYSTEM_PROMPT string). Keep it importable.\n"
            "- experiment.yaml declares: goal, metric, direction (maximize/minimize), "
            "metric_regex (captures the metric from stdout, group 1), run_command "
            "('python experiment.py'), editable_files: [solution.py], "
            "readonly_files: [experiment.py], max_rounds, patience.\n"
            "- IMPORTANT: design the baseline so it is NOT already optimal — leave clear "
            "headroom for the iterative loop to improve the metric.\n"
            "Output ONLY the JSON object."
        )
        user = f"Research question: {question}"
        if feedback:
            user += f"\n\nPrevious attempt failed verification:\n{feedback}"
        resp = await self.provider.chat(
            messages=[{"role": "system", "content": sys}, {"role": "user", "content": user}],
            model=self.model, max_tokens=4000, temperature=0.3,
        )
        spec = _extract_json(resp.content or "")
        for k in ("experiment_py", "solution_py", "experiment_yaml"):
            if k not in spec or not str(spec[k]).strip():
                raise ValueError(f"DESIGN reply missing '{k}'")
        return spec

    # -- Stage 4: plot + verify --------------------------------------------

    async def _plot(self, question: str) -> None:
        self._log("📈 Stage 4/5 PLOT — generating figure from results.tsv")
        core = self.project.core
        results = (self.project.root / "results.tsv")
        results_text = results.read_text(encoding="utf-8") if results.exists() else ""
        # Make results.tsv available inside core for plot.py's cwd.
        (core / "results.tsv").write_text(results_text, encoding="utf-8")

        feedback = ""
        for attempt in range(1, self.MAX_CODE_REPAIRS + 1):
            code = await self._plot_once(question, results_text, feedback)
            (core / "plot.py").write_text(code, encoding="utf-8")
            (core / "figures").mkdir(exist_ok=True)
            self._log(f"  attempt {attempt}: running plot.py...")
            out = self._bash("python plot.py")
            pdfs = list((core / "figures").glob("*.pdf"))
            if pdfs:
                self._log(f"  ✅ figure generated: figures/{pdfs[0].name}")
                return
            tail = "\n".join(out.splitlines()[-20:])
            feedback = f"plot.py did not create a PDF under figures/. Output tail:\n{tail}"
            self._log(f"  ⚠️ plot attempt {attempt} produced no figure; repairing.")
        self._log("  ⚠️ PLOT failed after retries; continuing without a figure.")

    async def _plot_once(self, question: str, results_text: str, feedback: str) -> str:
        sys = (
            "Write a Python script plot.py using matplotlib (use a non-interactive "
            "backend: `import matplotlib; matplotlib.use('Agg')`). It reads results.tsv "
            "in the current directory and saves a clear figure to "
            "figures/result.pdf (create the figures/ dir if needed). Choose axes/series "
            "appropriate to the columns. Output ONLY the Python code."
        )
        user = f"Research question: {question}\n\nresults.tsv:\n{results_text}"
        if feedback:
            user += f"\n\nPrevious attempt failed:\n{feedback}"
        resp = await self.provider.chat(
            messages=[{"role": "system", "content": sys}, {"role": "user", "content": user}],
            model=self.model, max_tokens=1500, temperature=0.2,
        )
        return _strip_fences(resp.content or "", "python")

    # -- Stage 5: write + compile ------------------------------------------

    async def _write(self, question: str, related: str) -> Path:
        self._log("📝 Stage 5/5 WRITE — drafting NeurIPS paper and compiling")
        core = self.project.core
        self._install_neurips_template(core)
        results_text = ""
        rp = core / "results.tsv"
        if rp.exists():
            results_text = rp.read_text(encoding="utf-8")
        figures = [p.name for p in (core / "figures").glob("*.pdf")] if (core / "figures").exists() else []
        fig_rel = f"figures/{figures[0]}" if figures else None

        body = await self._write_once(question, related, results_text, fig_rel)
        (core / "main.tex").write_text(body, encoding="utf-8")

        # Compile with tectonic (the project compiler already falls back to it).
        self._log("  compiling main.tex with tectonic...")
        out = self._bash("tectonic -X compile --keep-logs --outdir . main.tex")
        pdf = core / "main.pdf"
        if pdf.exists():
            self._log(f"  ✅ compiled main.pdf ({pdf.stat().st_size // 1024} KB)")
        else:
            self._log("  ⚠️ compilation did not produce main.pdf; see main.log.")
        return pdf

    async def _write_once(self, question: str, related: str, results_text: str,
                          fig_rel: Optional[str]) -> str:
        fig_instr = (
            f"Include the figure with \\includegraphics[width=0.7\\textwidth]{{{fig_rel}}} "
            f"inside a figure environment in the Experiments section."
            if fig_rel else "No figure is available; omit \\includegraphics."
        )
        sys = (
            "You write a complete, compilable NeurIPS-style LaTeX paper (a short paper). "
            "The document MUST: use \\documentclass{article} then "
            "\\usepackage[nonatbib, final]{neurips}, \\usepackage[numbers]{natbib}, and "
            "\\input{extra_pkgs}. Include sections: Abstract, Introduction, Related Work, "
            "Method, Experiments, Discussion. Report ONLY numbers that appear in the given "
            "results.tsv — do not invent results. Use a \\thebibliography with a few "
            "generic, real well-known references (no fabricated specifics). "
            f"{fig_instr} Output ONLY the LaTeX from \\documentclass to \\end{{document}}."
        )
        user = (
            f"Research question: {question}\n\n"
            f"Related work brief (reuse/condense):\n{related}\n\n"
            f"results.tsv (the ONLY source of numbers):\n{results_text}\n\n"
            f"Author block: use author 'Nobli' with email baobyte@nobli.com."
        )
        resp = await self.provider.chat(
            messages=[{"role": "system", "content": sys}, {"role": "user", "content": user}],
            model=self.model, max_tokens=6000, temperature=0.3,
        )
        tex = _strip_fences(resp.content or "", "latex")
        # Guard: ensure it starts at \documentclass.
        idx = tex.find("\\documentclass")
        return tex[idx:] if idx > 0 else tex

    # -- infra --------------------------------------------------------------

    def _install_neurips_template(self, core: Path) -> None:
        """Copy the bundled NeurIPS template files into the project core."""
        src = Path("config/.skills/neurips/templates/neurips2025")
        if not src.exists():
            src = self.project.workspace_root.parent / "config/.skills/neurips/templates/neurips2025"
        for name in ("neurips.sty", "extra_pkgs.tex"):
            s = src / name
            if s.exists() and not (core / name).exists():
                shutil.copy2(s, core / name)

    def _git_commit(self, msg: str) -> None:
        try:
            if self.project.git:
                self.project.git.commit(f"[research] {msg}")
        except Exception as e:
            logger.warning(f"git commit failed ({msg}): {e}")

    def _log(self, msg: str) -> None:
        self.on_log(msg)
