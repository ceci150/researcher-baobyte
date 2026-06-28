"""Structured research-run API for the Lovable GUI.

This is the first integration layer between the GUI and the agent framework.
It exposes a stable run/event protocol now, while the event producer can later
be swapped from scripted middleware steps to live MetaChain/AgentLoop hooks.
"""

from __future__ import annotations

import asyncio
import io
import json
import re
import time
import uuid
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from agent.tools.arxiv_search import ArxivSearchTool
from config.loader import get_config_service
from providers.proxy import DynamicProviderProxy


research_run_router = APIRouter()


class RunCreatePayload(BaseModel):
    task: str
    mode: str = "Explore"
    control_mode: str = "Full Automation"
    project_id: Optional[str] = None


class ApprovalPayload(BaseModel):
    step_id: str
    action: str
    selected_opportunity_id: Optional[str] = None
    comment: str = ""


class FollowUpPayload(BaseModel):
    message: str
    active_step_id: Optional[str] = None
    selected_tool_step_id: Optional[str] = None
    current_stage: Optional[int] = None


@dataclass
class ResearchRun:
    id: str
    task: str
    mode: str
    control_mode: str
    project_id: Optional[str] = None
    status: str = "running"
    steps: List[Dict[str, Any]] = field(default_factory=list)
    subscribers: List[asyncio.Queue] = field(default_factory=list)
    paused_on_step_id: Optional[str] = None
    producer_task: Optional[asyncio.Task] = None


class ResearchRunStore:
    def __init__(self) -> None:
        self.runs: Dict[str, ResearchRun] = {}

    def create(self, payload: RunCreatePayload) -> ResearchRun:
        run = ResearchRun(
            id=f"run_{uuid.uuid4().hex[:12]}",
            task=payload.task,
            mode=payload.mode,
            control_mode=payload.control_mode,
            project_id=payload.project_id,
        )
        self.runs[run.id] = run
        run.producer_task = asyncio.create_task(self._produce_scripted_steps(run))
        return run

    def get(self, run_id: str) -> ResearchRun:
        run = self.runs.get(run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")
        return run

    async def publish(self, run: ResearchRun, event: Dict[str, Any]) -> None:
        if event.get("type") == "step":
            self.upsert_step(run, event["step"])
        elif event.get("type") == "status":
            run.status = event.get("status", run.status)

        stale: List[asyncio.Queue] = []
        for queue in run.subscribers:
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                stale.append(queue)
        for queue in stale:
            run.subscribers.remove(queue)

    def upsert_step(self, run: ResearchRun, patch: Dict[str, Any]) -> Dict[str, Any]:
        for index, step in enumerate(run.steps):
            if step.get("id") == patch.get("id"):
                merged = {**step, **patch}
                if step.get("tool") and patch.get("tool"):
                    merged["tool"] = {**step["tool"], **patch["tool"]}
                run.steps[index] = merged
                return merged
        run.steps.append(patch)
        return patch

    async def update_step(self, run: ResearchRun, step_id: str, patch: Dict[str, Any]) -> None:
        updated = self.upsert_step(run, {"id": step_id, **patch})
        await self.publish(run, {"type": "step", "step": updated})

    async def _produce_scripted_steps(self, run: ResearchRun) -> None:
        await self.publish(run, {"type": "status", "status": "running"})
        for step in build_initial_steps(run.task):
            await asyncio.sleep(step.pop("delayMs", 0.8))
            await self.publish(run, {"type": "step", "step": step})
            if step.get("gate"):
                run.status = "waiting"
                run.paused_on_step_id = step["id"]
                await self.publish(
                    run,
                    {
                        "type": "status",
                        "status": "waiting",
                        "pausedOnStepId": run.paused_on_step_id,
                    },
                )
                return

        run.status = "complete"
        await self.publish(run, {"type": "status", "status": "complete"})


store = ResearchRunStore()


def tool(name: str, input_: Dict[str, Any], output: str, status: str = "done") -> Dict[str, Any]:
    return {
        "name": name,
        "input": input_,
        "output": output,
        "sources": [],
        "citations": [],
        "timeMs": 0,
        "status": status,
    }


ARTIFACT_CODE_EXTENSIONS = {".py", ".ipynb", ".yaml", ".yml", ".toml", ".json", ".md", ".tex", ".sh"}
ARTIFACT_FIGURE_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".svg"}


def workspace_root() -> Path:
    return get_config_service().config.workspace_path


def safe_relative(path: Path, root: Path) -> str:
    return str(path.resolve().relative_to(root.resolve()))


def artifact_url(project_id: str, relative_path: str) -> str:
    from urllib.parse import quote

    return f"/api/research-artifacts/file?project_id={quote(project_id)}&path={quote(relative_path)}"


def artifact_archive_url(project_id: str) -> str:
    from urllib.parse import quote

    return f"/api/research-artifacts/archive?project_id={quote(project_id)}"


def read_text_snippet(path: Path, limit: int = 8000) -> str:
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return ""
    return text[:limit]


def find_project_core(project_id: str) -> Optional[Path]:
    if not project_id:
        return None
    root = workspace_root()
    project_root = (root / project_id).resolve()
    if not project_root.exists() or not project_root.is_dir():
        return None
    nested_core = (project_root / project_id).resolve()
    if nested_core.exists() and nested_core.is_dir():
        return nested_core
    return project_root


def candidate_project_cores(project_id: Optional[str] = None) -> List[tuple[str, Path]]:
    root = workspace_root().resolve()
    candidates: List[tuple[str, Path]] = []
    if project_id:
        core = find_project_core(project_id)
        if core:
            candidates.append((project_id, core))

    if root.exists():
        for child in root.iterdir():
            if not child.is_dir() or child.name.startswith("."):
                continue
            nested_core = child / child.name
            core = nested_core if nested_core.exists() and nested_core.is_dir() else child
            item = (child.name, core.resolve())
            if item not in candidates:
                candidates.append(item)
    return candidates


def artifact_score(core: Path) -> tuple[int, float]:
    score = 0
    mtimes: List[float] = []
    key_paths = [
        core / "code" / "results.json",
        core / "results.json",
        core / "main.pdf",
        core / "figures",
        core / "code" / "run_experiment.py",
    ]
    for path in key_paths:
        if path.exists():
            score += 3 if path.name in {"results.json", "main.pdf"} else 1
            try:
                mtimes.append(path.stat().st_mtime)
            except OSError:
                pass
    if (core / "code").exists():
        score += 1
    for pattern in ("figures/*", "code/*.py", "*.pdf"):
        for path in core.glob(pattern):
            if path.is_file():
                score += 1
                try:
                    mtimes.append(path.stat().st_mtime)
                except OSError:
                    pass
    return score, max(mtimes) if mtimes else 0.0


def parse_results_json(path: Path) -> Optional[Any]:
    if not path.exists() or path.stat().st_size > 1_000_000:
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def discover_experiment_artifacts(project_id: Optional[str] = None) -> Dict[str, Any]:
    scored: List[tuple[int, float, str, Path]] = []
    for candidate_id, core in candidate_project_cores(project_id):
        try:
            core.resolve().relative_to(workspace_root().resolve())
        except ValueError:
            continue
        score, mtime = artifact_score(core)
        if score > 0:
            scored.append((score, mtime, candidate_id, core))

    if not scored:
        return {
            "found": False,
            "projectId": project_id,
            "message": "No executed experiment artifacts found in workspace yet.",
            "codeFiles": [],
            "figures": [],
            "pdfs": [],
            "results": None,
        }

    scored.sort(key=lambda item: (item[0], item[1]), reverse=True)
    _, mtime, selected_project_id, core = scored[0]

    code_files: List[Dict[str, Any]] = []
    for base in [core / "code", core]:
        if not base.exists() or not base.is_dir():
            continue
        for path in sorted(base.rglob("*")):
            if not path.is_file() or path.name.startswith("."):
                continue
            if path.suffix.lower() not in ARTIFACT_CODE_EXTENSIONS:
                continue
            rel = safe_relative(path, core)
            if any(item["path"] == rel for item in code_files):
                continue
            code_files.append(
                {
                    "path": rel,
                    "size": path.stat().st_size,
                    "url": artifact_url(selected_project_id, rel),
                    "snippet": read_text_snippet(path),
                }
            )
            if len(code_files) >= 20:
                break
        if len(code_files) >= 20:
            break

    figures: List[Dict[str, Any]] = []
    pdfs: List[Dict[str, Any]] = []
    for path in sorted(core.rglob("*")):
        if not path.is_file() or path.name.startswith("."):
            continue
        rel = safe_relative(path, core)
        suffix = path.suffix.lower()
        item = {
            "path": rel,
            "size": path.stat().st_size,
            "url": artifact_url(selected_project_id, rel),
        }
        if suffix in ARTIFACT_FIGURE_EXTENSIONS and ("figure" in rel.lower() or rel.startswith("figures/")):
            figures.append(item)
        if suffix == ".pdf" and (path.name == "main.pdf" or "paper" in path.name.lower()):
            pdfs.append(item)

    results_path = core / "code" / "results.json"
    if not results_path.exists():
        results_path = core / "results.json"
    results = parse_results_json(results_path) if results_path.exists() else None

    return {
        "found": True,
        "projectId": selected_project_id,
        "root": safe_relative(core, workspace_root()),
        "lastModified": int(mtime),
        "resultsPath": safe_relative(results_path, core) if results_path.exists() else None,
        "results": results,
        "codeFiles": code_files,
        "figures": figures[:20],
        "pdfs": pdfs[:20],
        "archiveUrl": artifact_archive_url(selected_project_id),
        "message": "Executed experiment artifacts discovered from the Research Claw workspace.",
    }


def build_initial_steps(task: str) -> List[Dict[str, Any]]:
    return [
        {
            "id": "goal-parse",
            "stageIndex": 0,
            "title": "Understanding research goal",
            "summary": f"Received task: {task}. Classified it as an interactive research workflow and prepared agent stages.",
            "duration": "0s",
            "status": "review",
            "tool": tool("Goal Router", {"task": task}, "Mapped task to idea, survey, experiment, feedback, writing, and memory stages."),
            "gate": True,
            "gateLabel": "Confirm research goal",
            "gateHint": "Approve the parsed objective before the workflow starts calling research agents.",
            "delayMs": 0.1,
        },
    ]


def build_planning_steps() -> List[Dict[str, Any]]:
    return [
        {
            "id": "prepare-agent",
            "stageIndex": 1,
            "title": "Prepare Agent selecting reference sources",
            "summary": "Prepare Agent will search papers and repositories, then choose reference codebases and source papers.",
            "duration": "1s",
            "status": "done",
            "tool": tool("Prepare Agent", {"inputs": ["task", "references", "date_limit"]}, "Placeholder completed; waiting for live framework hook."),
            "delayMs": 0.6,
        },
        {
            "id": "survey-agent",
            "stageIndex": 1,
            "title": "Survey Agent extracting atomic concepts",
            "summary": "Survey Agent will delegate to Paper Survey and Code Survey agents for formula and implementation notes.",
            "duration": "1s",
            "status": "done",
            "tool": tool("Survey Agent", {"handoffs": ["Paper Survey Agent", "Code Survey Agent"]}, "Placeholder completed; waiting for live framework hook."),
            "delayMs": 0.6,
        },
        {
            "id": "experiment-plan",
            "stageIndex": 2,
            "title": "Coding Plan Agent preparing experiment design",
            "summary": "The plan should cover dataset, model, training, testing, and success metrics.",
            "duration": "queued",
            "status": "review",
            "tool": tool("Coding Plan Agent", {"requiredPlans": ["dataset", "model", "training", "testing"]}, "Structured plan pending."),
            # TODO(real-agent): replace this GUI mock card with structured Coding Plan Agent output.
            "output": {"kind": "experiment"},
            "gate": True,
            "gateLabel": "Approve experiment plan",
            "gateHint": "Approve the plan before ML Agent writes and runs code.",
            "delayMs": 0.6,
        },
    ]


def infer_prepare_query(task: str) -> str:
    text = re.sub(r"\s+", " ", task).strip()
    phrase_patterns = [
        r"about ([^.]+)",
        r"for ([^.]+)",
        r"on ([^.]+)",
    ]
    for pattern in phrase_patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            phrase = match.group(1).strip(" .,:;")
            phrase = re.split(
                r"\b(and publish|and submit|and write|publish it|strong venue|venue)\b",
                phrase,
                maxsplit=1,
                flags=re.IGNORECASE,
            )[0].strip(" .,:;")
            if 8 <= len(phrase) <= 120:
                return phrase

    stopwords = {
        "find", "write", "paper", "about", "from", "this", "that", "with", "and",
        "the", "for", "into", "strong", "venue", "publish", "want", "research",
        "moment", "abstract", "introduce", "we", "our", "results", "suggest",
    }
    words = [
        w.lower()
        for w in re.findall(r"[A-Za-z][A-Za-z0-9@+\-]{2,}", text)
        if w.lower() not in stopwords
    ]
    deduped = list(dict.fromkeys(words))
    return " ".join(deduped[:8]) or text[:120] or "machine learning"


def build_prepare_queries(task: str) -> List[str]:
    base = infer_prepare_query(task)
    tokens = tokenize_research_text(base)
    queries = [base]

    if {"explainable", "interpretability", "interpretable", "xai"} & set(tokens):
        queries.extend(
            [
                "explainable artificial intelligence computer vision interpretability",
                "vision transformer explainability attribution saliency",
                "post-hoc explanation faithfulness computer vision",
            ]
        )
    if {"concept", "bottleneck", "cbm"} & set(tokens):
        queries.extend(
            [
                "concept bottleneck models computer vision",
                "concept-based explanations vision models",
            ]
        )

    compact = " ".join(tokens[:6])
    if compact and compact not in queries:
        queries.append(compact)
    return list(dict.fromkeys(q for q in queries if q))[:5]


def tokenize_research_text(text: str) -> List[str]:
    stopwords = {
        "about", "paper", "write", "want", "publish", "strong", "venue", "from",
        "this", "that", "with", "and", "the", "for", "into", "research", "using",
        "based", "model", "models", "method", "methods", "task", "tasks",
    }
    return [
        word.lower()
        for word in re.findall(r"[A-Za-z][A-Za-z0-9+\-]{2,}", text)
        if word.lower() not in stopwords
    ]


def parse_arxiv_papers(result: str, query: str) -> List[Dict[str, Any]]:
    papers: List[Dict[str, Any]] = []
    current: Dict[str, Any] | None = None
    for line in result.splitlines():
        title_match = re.match(r"\[(\d+)\]\s+(.+)", line)
        if title_match:
            if current:
                papers.append(current)
            current = {"title": title_match.group(2).strip(), "query": query}
            continue
        if not current:
            continue
        field_match = re.match(r"\s*([A-Za-z ]+):\s+(.*)", line)
        if not field_match:
            continue
        field = field_match.group(1).strip().lower().replace(" ", "_")
        value = field_match.group(2).strip()
        current[field] = value
    if current:
        papers.append(current)
    return papers


def score_prepare_paper(paper: Dict[str, Any], task_tokens: List[str]) -> float:
    title = str(paper.get("title", ""))
    abstract = str(paper.get("abstract", ""))
    categories = str(paper.get("categories", ""))
    haystack_title = set(tokenize_research_text(title))
    haystack_all = set(tokenize_research_text(f"{title} {abstract}"))
    task = set(task_tokens)

    score = 0.0
    score += 3.0 * len(task & haystack_title)
    score += 1.0 * len(task & haystack_all)

    title_lower = title.lower()
    abstract_lower = abstract.lower()
    if any(term in title_lower for term in ["explainable", "interpretability", "interpretable", "xai"]):
        score += 4.0
    if any(term in abstract_lower for term in ["explainable", "interpretability", "interpretable", "xai"]):
        score += 2.0
    if any(term in title_lower for term in ["computer vision", "vision"]):
        score += 2.0
    if "cs.CV" in categories:
        score += 1.5
    if any(term in title_lower for term in ["workshop", "pollination", "blind and low-vision"]):
        score -= 3.0
    return score


def format_prepare_output(papers: List[Dict[str, Any]], queries: List[str]) -> str:
    if not papers:
        return f"No ranked arXiv papers found. Queries tried: {', '.join(queries)}"
    lines = [
        "Ranked arXiv reference candidates",
        f"Queries tried: {', '.join(queries)}",
        "=" * 60,
    ]
    for index, paper in enumerate(papers, 1):
        lines.extend(
            [
                f"[{index}] {paper.get('title', 'Untitled')}",
                f"    Score    : {paper.get('score', 0):.1f}",
                f"    Query    : {paper.get('query', '')}",
                f"    Published: {paper.get('published', 'unknown')}",
                f"    Categories: {paper.get('categories', '')}",
                f"    URL      : {paper.get('url', '')}",
                f"    Abstract : {paper.get('abstract', '')}",
                "",
            ]
        )
    return "\n".join(lines).strip()


async def run_prepare_agent(task: str) -> Dict[str, Any]:
    queries = build_prepare_queries(task)
    primary_query = queries[0]
    task_tokens = tokenize_research_text(" ".join(queries))
    started = time.perf_counter()
    arxiv_tool = ArxivSearchTool()
    papers_by_url: Dict[str, Dict[str, Any]] = {}
    raw_results: List[str] = []

    for query in queries:
        result = await asyncio.to_thread(
            arxiv_tool.execute,
            query=query,
            max_results=5,
            sort_by="relevance",
            categories=["cs.CV", "cs.LG", "cs.AI"],
        )
        raw_results.append(result)
        for paper in parse_arxiv_papers(result, query):
            url = str(paper.get("url", ""))
            key = url or str(paper.get("title", "")).lower()
            if not key:
                continue
            score = score_prepare_paper(paper, task_tokens)
            existing = papers_by_url.get(key)
            if not existing or score > existing.get("score", 0):
                paper["score"] = score
                papers_by_url[key] = paper

    ranked = sorted(papers_by_url.values(), key=lambda paper: paper.get("score", 0), reverse=True)
    selected = ranked[:3]
    sources = [
        f"{paper.get('title', 'Untitled')} — {paper.get('url', '')}".strip(" —")
        for paper in selected
    ]
    citations = [str(paper.get("title", "Untitled")) for paper in selected]
    result = format_prepare_output(selected, queries)
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    return {
        "query": primary_query,
        "queries": queries,
        "result": result,
        "sources": sources,
        "citations": citations,
        "elapsedMs": elapsed_ms,
    }


def compact_tool_output(output: str, limit: int = 1400) -> str:
    if len(output) <= limit:
        return output
    return output[:limit].rstrip() + "\n\n[truncated for GUI]"


def format_duration(ms: int) -> str:
    seconds = max(1, round(ms / 1000))
    if seconds < 60:
        return f"{seconds}s"
    return f"{seconds // 60}m {seconds % 60:02d}s"


def extract_json_object(text: str) -> Dict[str, Any]:
    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if not match:
        return {}
    try:
        parsed = json.loads(match.group(0))
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        return {}


def format_survey_summary(survey: Dict[str, Any]) -> str:
    concepts = survey.get("concepts") or []
    methods = survey.get("methods") or []
    metrics = survey.get("metrics") or []
    parts = []
    if concepts:
        parts.append(f"concepts: {', '.join(map(str, concepts[:3]))}")
    if methods:
        parts.append(f"methods: {', '.join(map(str, methods[:2]))}")
    if metrics:
        parts.append(f"metrics: {', '.join(map(str, metrics[:2]))}")
    return "Extracted " + "; ".join(parts) + "." if parts else "Extracted survey concepts from selected references."


def fallback_survey(task: str, prepare: Dict[str, Any]) -> Dict[str, Any]:
    tokens = tokenize_research_text(task)
    concepts = [token for token in tokens if token in {"explainable", "interpretability", "vision", "faithfulness", "concept", "bottleneck"}]
    if not concepts:
        concepts = tokens[:4]
    return {
        "concepts": list(dict.fromkeys(concepts))[:5],
        "methods": ["literature-driven concept extraction"],
        "datasets": [],
        "metrics": ["relevance to research goal"],
        "open_questions": ["LLM survey extraction unavailable; inspect selected references manually."],
        "rationale": "Fallback survey generated from task keywords and Prepare Agent sources.",
        "sources_used": prepare.get("citations", []),
    }


def fallback_experiment_plan(task: str, survey: Dict[str, Any]) -> Dict[str, Any]:
    concepts = survey.get("concepts") or tokenize_research_text(task)[:4]
    metrics = survey.get("metrics") or ["faithfulness", "accuracy", "robustness"]
    return {
        "hypothesis": f"A focused experiment around {', '.join(map(str, concepts[:3]))} can reveal a measurable aha moment.",
        "method": "Compare a baseline explanation method against a concept-aware or faithfulness-aware variant.",
        "datasets": ["one small public benchmark selected from the survey"],
        "metrics": metrics[:4],
        "baselines": ["vanilla baseline", "strong post-hoc explanation baseline"],
        "resources": "Single-GPU smoke test first; scale after proof of signal.",
        "risks": ["survey-derived plan only; verify dataset availability", "metric may not capture causal faithfulness"],
        "success_criteria": ["clear metric delta over baseline", "reproducible run configuration"],
        "next_actions": ["choose dataset", "write minimal training/eval script", "run 1-seed smoke test"],
        "rationale": "Fallback plan generated from Survey Agent outputs.",
    }


def format_plan_summary(plan: Dict[str, Any]) -> str:
    hypothesis = str(plan.get("hypothesis") or "").strip()
    method = str(plan.get("method") or "").strip()
    if hypothesis and method:
        return f"Planned experiment: {hypothesis[:120]} Method: {method[:100]}"
    if hypothesis:
        return f"Planned experiment: {hypothesis[:180]}"
    return "Generated an experiment plan from Prepare and Survey Agent outputs."


async def run_survey_agent(task: str, prepare: Dict[str, Any]) -> Dict[str, Any]:
    references = prepare.get("result", "")
    prompt = f"""
You are Survey Agent inside an AI research framework.
Input research task:
{task}

Prepare Agent selected these arXiv reference candidates:
{references[:6000]}

Return ONLY compact JSON with keys:
concepts: string[],
methods: string[],
datasets: string[],
metrics: string[],
open_questions: string[],
rationale: string,
sources_used: string[].
Focus on atomic concepts and experiment-relevant signals. Do not invent paper titles.
"""
    started = time.perf_counter()
    provider = DynamicProviderProxy()
    response = await provider.chat(
        messages=[
            {"role": "system", "content": "Return valid JSON only. Be concise and technical."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=900,
    )
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    if response.finish_reason == "error" or not response.content:
        survey = fallback_survey(task, prepare)
        survey["_raw"] = response.content or "No LLM response"
        survey["_status"] = "fallback"
    else:
        survey = extract_json_object(response.content)
        if not survey:
            survey = fallback_survey(task, prepare)
            survey["_raw"] = response.content
            survey["_status"] = "fallback"
        else:
            survey["_raw"] = response.content
            survey["_status"] = "llm"
    survey["elapsedMs"] = elapsed_ms
    return survey


async def run_coding_plan_agent(task: str, prepare: Dict[str, Any], survey: Dict[str, Any]) -> Dict[str, Any]:
    survey_json = json.dumps(
        {k: v for k, v in survey.items() if k not in {"_raw", "elapsedMs"}},
        ensure_ascii=False,
        indent=2,
    )
    prompt = f"""
You are Coding Plan Agent inside an AI research framework.
Input research task:
{task}

Prepare Agent sources:
{json.dumps(prepare.get("sources", []), ensure_ascii=False)}

Survey Agent output:
{survey_json[:5000]}

Return ONLY compact JSON with keys:
hypothesis: string,
method: string,
datasets: string[],
metrics: string[],
baselines: string[],
resources: string,
risks: string[],
success_criteria: string[],
next_actions: string[],
rationale: string.
Make the plan concrete enough for a Machine Learning Agent to implement a first iteration.
"""
    started = time.perf_counter()
    provider = DynamicProviderProxy()
    response = await provider.chat(
        messages=[
            {"role": "system", "content": "Return valid JSON only. Be concrete and implementation-oriented."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=1000,
    )
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    if response.finish_reason == "error" or not response.content:
        plan = fallback_experiment_plan(task, survey)
        plan["_raw"] = response.content or "No LLM response"
        plan["_status"] = "fallback"
    else:
        plan = extract_json_object(response.content)
        if not plan:
            plan = fallback_experiment_plan(task, survey)
            plan["_raw"] = response.content
            plan["_status"] = "fallback"
        else:
            plan["_raw"] = response.content
            plan["_status"] = "llm"
    plan["elapsedMs"] = elapsed_ms
    return plan


def parse_step_output(step: Dict[str, Any]) -> Dict[str, Any]:
    output = (step.get("tool") or {}).get("output")
    if not output:
        return {}
    try:
        parsed = json.loads(str(output))
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        return {}


async def run_coding_plan_revision(
    task: str,
    current_plan: Dict[str, Any],
    survey_step: Dict[str, Any],
    user_message: str,
) -> Dict[str, Any]:
    survey = parse_step_output(survey_step)
    prompt = f"""
You are Coding Plan Agent revising an experiment plan after human follow-up.
Task:
{task}

Current experiment plan:
{json.dumps(current_plan, ensure_ascii=False, indent=2)[:5000]}

Survey context:
{json.dumps(survey, ensure_ascii=False, indent=2)[:3500]}

Human follow-up:
{user_message}

Return ONLY compact JSON with the same keys:
hypothesis: string,
method: string,
datasets: string[],
metrics: string[],
baselines: string[],
resources: string,
risks: string[],
success_criteria: string[],
next_actions: string[],
rationale: string.
Preserve useful existing details, but directly satisfy the human follow-up.
"""
    started = time.perf_counter()
    provider = DynamicProviderProxy()
    response = await provider.chat(
        messages=[
            {"role": "system", "content": "Return valid JSON only. Make a concrete revision, not commentary."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=1000,
    )
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    if response.finish_reason == "error" or not response.content:
        revised = {**current_plan}
        revised["next_actions"] = [user_message, *list(revised.get("next_actions") or [])]
        revised["rationale"] = f"Fallback revision recorded from human follow-up: {user_message}"
        revised["_raw"] = response.content or "No LLM response"
        revised["_status"] = "fallback"
    else:
        revised = extract_json_object(response.content)
        if not revised:
            revised = {**current_plan}
            revised["next_actions"] = [user_message, *list(revised.get("next_actions") or [])]
            revised["rationale"] = f"Fallback revision recorded from human follow-up: {user_message}"
            revised["_raw"] = response.content
            revised["_status"] = "fallback"
        else:
            revised["_raw"] = response.content
            revised["_status"] = "llm"
    revised["elapsedMs"] = elapsed_ms
    return revised


async def emit_goal_accept_steps(run: ResearchRun) -> None:
    query = infer_prepare_query(run.task)
    queries = build_prepare_queries(run.task)
    await store.publish(
        run,
        {
            "type": "step",
            "step": {
                "id": "prepare-agent",
                "stageIndex": 1,
                "title": "Prepare Agent searching reference sources",
                "summary": f"Searching arXiv for candidate papers related to: {query}",
                "duration": "queued",
                "status": "running",
                "tool": tool(
                    "arxiv_search",
                    {
                        "query": query,
                        "queries": queries,
                        "max_results_per_query": 5,
                        "categories": ["cs.CV", "cs.LG", "cs.AI"],
                        "rerank": "task-keyword/title/abstract overlap",
                    },
                    "Searching arXiv through the framework tool layer.",
                    "running",
                ),
                "delayMs": 0,
            },
        },
    )

    prepare = await run_prepare_agent(run.task)
    await store.update_step(
        run,
        "prepare-agent",
        {
            "status": "done",
            "duration": format_duration(prepare["elapsedMs"]),
            "summary": (
                f"Found {len(prepare['sources'])} arXiv reference candidates for "
                f"'{prepare['query']}'."
            ),
            "sources": prepare["sources"],
            "tool": {
                "status": "done",
                "input": {
                    "query": prepare["query"],
                    "queries": prepare["queries"],
                    "max_results_per_query": 5,
                    "categories": ["cs.CV", "cs.LG", "cs.AI"],
                    "rerank": "task-keyword/title/abstract overlap",
                },
                "output": compact_tool_output(prepare["result"]),
                "sources": prepare["sources"],
                "citations": prepare["citations"],
                "timeMs": prepare["elapsedMs"],
            },
        },
    )

    await store.publish(
        run,
        {
            "type": "step",
            "step": {
                "id": "survey-agent",
                "stageIndex": 1,
                "title": "Survey Agent extracting atomic concepts",
                "summary": "Reading selected references and extracting concepts, methods, datasets, and metrics.",
                "duration": "queued",
                "status": "running",
                "tool": tool(
                    "LLM Survey Agent",
                    {"task": run.task, "sources": prepare["sources"]},
                    "Extracting structured survey signals from Prepare Agent references.",
                    "running",
                ),
            },
        },
    )
    survey = await run_survey_agent(run.task, prepare)
    survey_output = json.dumps(
        {k: v for k, v in survey.items() if k not in {"_raw", "elapsedMs"}},
        ensure_ascii=False,
        indent=2,
    )
    await store.update_step(
        run,
        "survey-agent",
        {
            "status": "done",
            "duration": format_duration(survey["elapsedMs"]),
            "summary": format_survey_summary(survey),
            "sources": prepare["sources"],
            "tool": {
                "status": "done",
                "input": {"task": run.task, "sources": prepare["sources"]},
                "output": survey_output,
                "sources": prepare["sources"],
                "citations": survey.get("sources_used") or prepare["citations"],
                "timeMs": survey["elapsedMs"],
            },
        },
    )

    await store.publish(
        run,
        {
            "type": "step",
            "step": {
                "id": "experiment-plan",
                "stageIndex": 2,
                "title": "Coding Plan Agent preparing experiment design",
                "summary": "Generating a concrete experiment plan from reference papers and survey concepts.",
                "duration": "queued",
                "status": "running",
                "tool": tool(
                    "Coding Plan Agent",
                    {
                        "task": run.task,
                        "survey": {k: v for k, v in survey.items() if k not in {"_raw", "elapsedMs"}},
                    },
                    "Generating structured experiment plan.",
                    "running",
                ),
                "output": {"kind": "experiment"},
            },
        },
    )
    plan = await run_coding_plan_agent(run.task, prepare, survey)
    plan_output = json.dumps(
        {k: v for k, v in plan.items() if k not in {"_raw", "elapsedMs"}},
        ensure_ascii=False,
        indent=2,
    )
    await store.update_step(
        run,
        "experiment-plan",
        {
            "status": "review",
            "duration": format_duration(plan["elapsedMs"]),
            "summary": format_plan_summary(plan),
            "sources": prepare["sources"],
            "tool": {
                "status": "done",
                "input": {
                    "task": run.task,
                    "survey": {k: v for k, v in survey.items() if k not in {"_raw", "elapsedMs"}},
                },
                "output": plan_output,
                "sources": prepare["sources"],
                "citations": survey.get("sources_used") or prepare["citations"],
                "timeMs": plan["elapsedMs"],
            },
            "gate": True,
            "gateLabel": "Approve experiment plan",
            "gateHint": "Approve the plan before ML Agent writes and runs code.",
        },
    )
    run.status = "waiting"
    run.paused_on_step_id = "experiment-plan"
    await store.publish(
        run,
        {"type": "status", "status": "waiting", "pausedOnStepId": "experiment-plan"},
    )


def find_step(run: ResearchRun, step_id: str) -> Dict[str, Any]:
    for step in run.steps:
        if step.get("id") == step_id:
            return step
    return {}


def fallback_ml_blueprint(plan_text: str) -> Dict[str, Any]:
    return {
        "implementation_scope": "dry-run implementation blueprint; no GPU, Docker, or training command executed",
        "files": ["src/data.py", "src/model.py", "src/explain.py", "src/evaluate.py", "configs/smoke.yaml"],
        "commands": ["python src/evaluate.py --config configs/smoke.yaml"],
        "artifacts": ["metrics.json", "explanation_maps/", "run_report.md"],
        "assumptions": ["datasets are available locally or through documented download scripts"],
        "risks": ["compute availability unverified", "dataset licensing and preprocessing still need validation"],
        "handoff": plan_text[:500],
    }


def fallback_judge_feedback(ml_output: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "verdict": "needs_review",
        "strengths": ["implementation blueprint is structured enough for a first pass"],
        "issues": ["no executable run has been performed yet", "dataset availability is not verified"],
        "required_fixes": ["confirm dataset path and smoke-test command before execution"],
        "approval_recommendation": "approve only as a planning checkpoint, not as completed experiment evidence",
        "risk_level": "medium",
        "checked_against": ["experiment plan", "implementation blueprint"],
    }


def format_ml_summary(blueprint: Dict[str, Any]) -> str:
    files = blueprint.get("files") or []
    commands = blueprint.get("commands") or []
    return f"Prepared implementation blueprint with {len(files)} files and {len(commands)} command(s); no execution performed."


def format_judge_summary(feedback: Dict[str, Any]) -> str:
    verdict = feedback.get("verdict", "needs_review")
    issues = feedback.get("issues") or []
    return f"Judge verdict: {verdict}. Key issue: {str(issues[0])[:120] if issues else 'review generated.'}"


async def run_ml_agent(task: str, plan_step: Dict[str, Any]) -> Dict[str, Any]:
    plan_text = str((plan_step.get("tool") or {}).get("output") or plan_step.get("summary") or "")
    prompt = f"""
You are Machine Learning Agent inside an AI research framework.
The user approved this experiment plan for task:
{task}

Experiment plan JSON/text:
{plan_text[:6000]}

Return ONLY compact JSON with keys:
implementation_scope: string,
files: string[],
commands: string[],
artifacts: string[],
assumptions: string[],
risks: string[],
handoff: string.
Important: Do not claim that code was executed. This stage only prepares an implementation blueprint for the GUI.
"""
    started = time.perf_counter()
    provider = DynamicProviderProxy()
    response = await provider.chat(
        messages=[
            {"role": "system", "content": "Return valid JSON only. Do not claim actual execution."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=900,
    )
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    if response.finish_reason == "error" or not response.content:
        blueprint = fallback_ml_blueprint(plan_text)
        blueprint["_raw"] = response.content or "No LLM response"
        blueprint["_status"] = "fallback"
    else:
        blueprint = extract_json_object(response.content)
        if not blueprint:
            blueprint = fallback_ml_blueprint(plan_text)
            blueprint["_raw"] = response.content
            blueprint["_status"] = "fallback"
        else:
            blueprint["_raw"] = response.content
            blueprint["_status"] = "llm"
    blueprint["elapsedMs"] = elapsed_ms
    return blueprint


async def run_judge_agent(task: str, plan_step: Dict[str, Any], ml_output: Dict[str, Any]) -> Dict[str, Any]:
    plan_text = str((plan_step.get("tool") or {}).get("output") or plan_step.get("summary") or "")
    ml_json = json.dumps(
        {k: v for k, v in ml_output.items() if k not in {"_raw", "elapsedMs"}},
        ensure_ascii=False,
        indent=2,
    )
    prompt = f"""
You are Judge Agent inside an AI research framework.
Task:
{task}

Approved experiment plan:
{plan_text[:4000]}

Machine Learning Agent blueprint:
{ml_json[:5000]}

Return ONLY compact JSON with keys:
verdict: string,
strengths: string[],
issues: string[],
required_fixes: string[],
approval_recommendation: string,
risk_level: string,
checked_against: string[].
Be strict: this is a blueprint review, not evidence of completed experiment execution.
"""
    started = time.perf_counter()
    provider = DynamicProviderProxy()
    response = await provider.chat(
        messages=[
            {"role": "system", "content": "Return valid JSON only. Be concise and critical."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=900,
    )
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    if response.finish_reason == "error" or not response.content:
        feedback = fallback_judge_feedback(ml_output)
        feedback["_raw"] = response.content or "No LLM response"
        feedback["_status"] = "fallback"
    else:
        feedback = extract_json_object(response.content)
        if not feedback:
            feedback = fallback_judge_feedback(ml_output)
            feedback["_raw"] = response.content
            feedback["_status"] = "fallback"
        else:
            feedback["_raw"] = response.content
            feedback["_status"] = "llm"
    feedback["elapsedMs"] = elapsed_ms
    return feedback


async def run_judge_revision(
    task: str,
    plan_step: Dict[str, Any],
    ml_step: Dict[str, Any],
    current_feedback: Dict[str, Any],
    user_message: str,
) -> Dict[str, Any]:
    plan = parse_step_output(plan_step)
    ml_output = parse_step_output(ml_step)
    prompt = f"""
You are Judge Agent revising your implementation feedback after human follow-up.
Task:
{task}

Approved experiment plan:
{json.dumps(plan, ensure_ascii=False, indent=2)[:4000]}

Machine Learning Agent blueprint:
{json.dumps(ml_output, ensure_ascii=False, indent=2)[:4000]}

Current judge feedback:
{json.dumps(current_feedback, ensure_ascii=False, indent=2)[:3000]}

Human follow-up:
{user_message}

Return ONLY compact JSON with keys:
verdict: string,
strengths: string[],
issues: string[],
required_fixes: string[],
approval_recommendation: string,
risk_level: string,
checked_against: string[].
Revise the feedback directly in response to the human follow-up.
"""
    started = time.perf_counter()
    provider = DynamicProviderProxy()
    response = await provider.chat(
        messages=[
            {"role": "system", "content": "Return valid JSON only. Be strict and actionable."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=900,
    )
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    if response.finish_reason == "error" or not response.content:
        revised = {**current_feedback}
        revised["required_fixes"] = [user_message, *list(revised.get("required_fixes") or [])]
        revised["approval_recommendation"] = f"Revision requested by human: {user_message}"
        revised["_raw"] = response.content or "No LLM response"
        revised["_status"] = "fallback"
    else:
        revised = extract_json_object(response.content)
        if not revised:
            revised = {**current_feedback}
            revised["required_fixes"] = [user_message, *list(revised.get("required_fixes") or [])]
            revised["approval_recommendation"] = f"Revision requested by human: {user_message}"
            revised["_raw"] = response.content
            revised["_status"] = "fallback"
        else:
            revised["_raw"] = response.content
            revised["_status"] = "llm"
    revised["elapsedMs"] = elapsed_ms
    return revised


async def emit_experiment_accept_steps(run: ResearchRun, approved_step_id: str) -> None:
    plan_step = find_step(run, approved_step_id)
    await store.publish(
        run,
        {
            "type": "step",
            "step": {
                "id": "ml-agent",
                "stageIndex": 3,
                "title": "Machine Learning Agent preparing implementation blueprint",
                "summary": "Preparing files, commands, artifacts, and assumptions for a first experiment iteration.",
                "duration": "queued",
                "status": "running",
                "tool": tool(
                    "Machine Learning Agent",
                    {"approvedStep": approved_step_id},
                    "Generating implementation blueprint; execution is not started.",
                    "running",
                ),
            },
        },
    )
    blueprint = await run_ml_agent(run.task, plan_step)
    runtime_artifacts = discover_experiment_artifacts(run.project_id)
    blueprint_output = json.dumps(
        {k: v for k, v in blueprint.items() if k not in {"_raw", "elapsedMs"}},
        ensure_ascii=False,
        indent=2,
    )
    await store.update_step(
        run,
        "ml-agent",
        {
            "status": "done",
            "duration": format_duration(blueprint["elapsedMs"]),
            "summary": format_ml_summary(blueprint),
            "tool": {
                "status": "done",
                "input": {"task": run.task, "approvedStep": approved_step_id},
                "output": blueprint_output,
                "sources": plan_step.get("sources", []),
                "citations": (plan_step.get("tool") or {}).get("citations", []),
                "timeMs": blueprint["elapsedMs"],
            },
            "artifacts": runtime_artifacts,
            "output": {"kind": "artifacts"},
        },
    )

    await store.publish(
        run,
        {
            "type": "step",
            "step": {
                "id": "judge-feedback",
                "stageIndex": 3,
                "title": "Judge Agent reviewing implementation blueprint",
                "summary": "Checking whether the blueprint matches the approved plan and is ready for execution.",
                "duration": "queued",
                "status": "running",
                "tool": tool(
                    "Judge Agent",
                    {"checks": ["plan alignment", "execution readiness", "risks"]},
                    "Reviewing ML Agent blueprint.",
                    "running",
                ),
                "output": {"kind": "iteration"},
            },
        },
    )
    feedback = await run_judge_agent(run.task, plan_step, blueprint)
    feedback_output = json.dumps(
        {k: v for k, v in feedback.items() if k not in {"_raw", "elapsedMs"}},
        ensure_ascii=False,
        indent=2,
    )
    await store.update_step(
        run,
        "judge-feedback",
        {
            "status": "review",
            "duration": format_duration(feedback["elapsedMs"]),
            "summary": format_judge_summary(feedback),
            "tool": {
                "status": "done",
                "input": {
                    "task": run.task,
                    "mlBlueprint": {k: v for k, v in blueprint.items() if k not in {"_raw", "elapsedMs"}},
                    "runtimeArtifacts": runtime_artifacts,
                },
                "output": feedback_output,
                "sources": plan_step.get("sources", []),
                "citations": (plan_step.get("tool") or {}).get("citations", []),
                "timeMs": feedback["elapsedMs"],
            },
            "artifacts": runtime_artifacts,
            "gate": True,
            "gateLabel": "Approve iteration feedback",
            "gateHint": "Approve feedback before continuing to writing or further experiments.",
        },
    )
    run.status = "waiting"
    run.paused_on_step_id = "judge-feedback"
    await store.publish(
        run,
        {"type": "status", "status": "waiting", "pausedOnStepId": "judge-feedback"},
    )


def fallback_paper_draft(task: str, judge_step: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "title": "Toward an Agentic Research Workspace",
        "abstract": f"We study the research direction implied by: {task}. The current system has produced a reviewed experiment blueprint and judge feedback, but no executed results yet.",
        "outline": ["Introduction", "Related Work", "Method", "Planned Experiments", "Limitations"],
        "claims": ["The workflow can turn research intent into a reviewed experiment plan."],
        "limitations": ["No real experiment execution has been performed in this run."],
        "next_writing_actions": ["replace mock results with executed experiment evidence", "expand related work from selected references"],
        "rationale": "Fallback writing draft generated from run state.",
    }


def format_writing_summary(draft: Dict[str, Any]) -> str:
    title = str(draft.get("title") or "Untitled draft")
    abstract = str(draft.get("abstract") or "")
    return f"Drafted paper narrative: {title}. {abstract[:120]}"


async def run_paper_generation_agent(run: ResearchRun, judge_step: Dict[str, Any]) -> Dict[str, Any]:
    runtime_artifacts = judge_step.get("artifacts") or discover_experiment_artifacts(run.project_id)
    compact_steps = [
        {
            "id": step.get("id"),
            "title": step.get("title"),
            "summary": step.get("summary"),
            "tool_output": ((step.get("tool") or {}).get("output") or "")[:2200],
            "artifacts": step.get("artifacts"),
        }
        for step in run.steps
        if step.get("id") in {"prepare-agent", "survey-agent", "experiment-plan", "ml-agent", "judge-feedback"}
    ]
    prompt = f"""
You are Paper Generation Agent inside an AI research framework.
Task:
{run.task}

Research workflow state:
{json.dumps(compact_steps, ensure_ascii=False, indent=2)[:9000]}

Runtime artifacts:
{json.dumps(runtime_artifacts, ensure_ascii=False, indent=2)[:3000]}

Return ONLY compact JSON with keys:
title: string,
abstract: string,
outline: string[],
claims: string[],
limitations: string[],
next_writing_actions: string[],
rationale: string.
Be honest about evidence: if runtime artifacts are not found, say this run has generated plans/blueprints/feedback but not executed experiment results. If runtime artifacts are found, say that executed artifacts are available, but do not invent metric values not present in results.json.
"""
    started = time.perf_counter()
    provider = DynamicProviderProxy()
    response = await provider.chat(
        messages=[
            {"role": "system", "content": "Return valid JSON only. Do not fabricate experiment results."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=1000,
    )
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    if response.finish_reason == "error" or not response.content:
        draft = fallback_paper_draft(run.task, judge_step)
        draft["_raw"] = response.content or "No LLM response"
        draft["_status"] = "fallback"
    else:
        draft = extract_json_object(response.content)
        if not draft:
            draft = fallback_paper_draft(run.task, judge_step)
            draft["_raw"] = response.content
            draft["_status"] = "fallback"
        else:
            draft["_raw"] = response.content
            draft["_status"] = "llm"
    draft["elapsedMs"] = elapsed_ms
    return draft


async def emit_judge_accept_steps(run: ResearchRun, approved_step_id: str) -> None:
    judge_step = find_step(run, approved_step_id)
    runtime_artifacts = judge_step.get("artifacts") or discover_experiment_artifacts(run.project_id)
    await store.publish(
        run,
        {
            "type": "step",
            "step": {
                "id": "writing-studio",
                "stageIndex": 4,
                "title": "Writing Studio preparing research narrative",
                "summary": "Generating title, abstract, outline, claims, limitations, and writing actions.",
                "duration": "queued",
                "status": "running",
                "tool": tool(
                    "Paper Generation Agent",
                    {"inputs": ["task", "prepare", "survey", "experiment_plan", "judge_feedback"]},
                    "Generating paper narrative from reviewed workflow state.",
                    "running",
                ),
                "output": {"kind": "abstract"},
            },
        },
    )
    draft = await run_paper_generation_agent(run, judge_step)
    draft_output = json.dumps(
        {k: v for k, v in draft.items() if k not in {"_raw", "elapsedMs"}},
        ensure_ascii=False,
        indent=2,
    )
    await store.update_step(
        run,
        "writing-studio",
        {
            "status": "done",
            "duration": format_duration(draft["elapsedMs"]),
            "summary": format_writing_summary(draft),
            "tool": {
                "status": "done",
                "input": {"task": run.task, "approvedStep": approved_step_id, "runtimeArtifacts": runtime_artifacts},
                "output": draft_output,
                "sources": judge_step.get("sources", []),
                "citations": (judge_step.get("tool") or {}).get("citations", []),
                "timeMs": draft["elapsedMs"],
            },
            "artifacts": runtime_artifacts,
            "output": {"kind": "abstract"},
        },
    )
    memory_summary = {
        "run_id": run.id,
        "task": run.task,
        "completed_steps": [step.get("id") for step in run.steps],
        "draft_title": draft.get("title"),
        "remaining_work": draft.get("next_writing_actions", []),
    }
    await store.publish(
        run,
        {
            "type": "step",
            "step": {
                "id": "memory-update",
                "stageIndex": 6,
                "title": "Memory & Growing updated",
                "summary": "Recorded run summary, draft title, and remaining writing actions.",
                "duration": "0s",
                "status": "done",
                "tool": tool("Memory Tracker", {"scope": "research_run"}, json.dumps(memory_summary, ensure_ascii=False, indent=2)),
                "output": {"kind": "memory"},
            },
        },
    )
    run.status = "complete"
    run.paused_on_step_id = None
    await store.publish(run, {"type": "status", "status": "complete"})


def build_approval_steps(payload: ApprovalPayload) -> List[Dict[str, Any]]:
    if payload.action == "ask-revision":
        return [
            {
                "id": f"revision-{uuid.uuid4().hex[:6]}",
                "stageIndex": 3,
                "title": "Revision request captured",
                "summary": payload.comment or "The user requested a revision before continuing.",
                "duration": "0s",
                "status": "review",
                "tool": tool("Human Feedback", {"action": payload.action}, "Revision request queued for the next agent turn."),
            }
        ]
    if payload.action == "reject":
        return [
            {
                "id": f"rejected-{uuid.uuid4().hex[:6]}",
                "stageIndex": 3,
                "title": "Run paused by user",
                "summary": payload.comment or "The user rejected this gate. No further automated steps will run.",
                "duration": "0s",
                "status": "waiting",
                "tool": tool("Human Feedback", {"action": payload.action}, "Run remains paused."),
            }
        ]
    if payload.step_id == "goal-parse":
        return build_planning_steps()
    if payload.step_id == "judge-feedback":
        return [
            {
                "id": "writing-studio",
                "stageIndex": 4,
                "title": "Writing Studio preparing research narrative",
                "summary": "Paper Generation Agent can now turn the accepted experiment story into draft sections.",
                "duration": "queued",
                "status": "review",
                "tool": tool("Paper Generation Agent", {"inputs": ["idea", "survey", "experiment_report"]}, "Writing hook pending."),
                "output": {"kind": "abstract"},
                "delayMs": 0.3,
            },
            {
                "id": "memory-update",
                "stageIndex": 6,
                "title": "Memory & Growing updated",
                "summary": "The workflow recorded accepted decisions, open risks, and suggested next actions.",
                "duration": "0s",
                "status": "done",
                "tool": tool("Memory Tracker", {"scope": "research_run"}, "Run memory event recorded."),
                "output": {"kind": "memory"},
                "delayMs": 0.3,
            },
        ]
    return [
        {
            "id": "ml-agent",
            "stageIndex": 3,
            "title": "Machine Learning Agent implementing and running experiment",
            "summary": "ML Agent will create project files, run training/testing, and report results.",
            "duration": "1s",
            "status": "done",
            "tool": tool("Machine Learning Agent", {"approvedStep": payload.step_id}, "Placeholder completed; waiting for live framework hook."),
            "delayMs": 0.3,
        },
        {
            "id": "judge-feedback",
            "stageIndex": 3,
            "title": "Judge Agent producing implementation feedback",
            "summary": "Judge Agent checks whether implementation matches the idea, plan, and atomic concepts.",
            "duration": "queued",
            "status": "review",
            "tool": tool("Judge Agent", {"checks": ["concept coverage", "dataset", "2 epoch run", "GPU support"]}, "Structured feedback pending."),
            "output": {"kind": "iteration"},
            "gate": True,
            "gateLabel": "Approve iteration feedback",
            "gateHint": "Approve feedback before continuing to writing or further experiments.",
            "delayMs": 0.6,
        },
    ]


@research_run_router.post("/api/research-runs")
async def create_research_run(payload: RunCreatePayload):
    run = store.create(payload)
    return {
        "id": run.id,
        "task": run.task,
        "mode": run.mode,
        "controlMode": run.control_mode,
        "status": run.status,
    }


@research_run_router.get("/api/research-runs/{run_id}")
async def get_research_run(run_id: str):
    run = store.get(run_id)
    return {
        "id": run.id,
        "task": run.task,
        "mode": run.mode,
        "controlMode": run.control_mode,
        "status": run.status,
        "steps": run.steps,
        "pausedOnStepId": run.paused_on_step_id,
    }


@research_run_router.get("/api/research-artifacts")
async def get_research_artifacts(project_id: Optional[str] = Query(default=None)):
    return discover_experiment_artifacts(project_id)


@research_run_router.get("/api/research-artifacts/file")
async def get_research_artifact_file(
    project_id: str = Query(...),
    path: str = Query(...),
):
    core = find_project_core(project_id)
    if not core:
        raise HTTPException(status_code=404, detail=f"project not found: {project_id}")
    root = core.resolve()
    target = (root / path).resolve()
    try:
        target.relative_to(root)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid artifact path") from None
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="artifact not found")
    return FileResponse(str(target), filename=target.name)


@research_run_router.get("/api/research-artifacts/archive")
async def get_research_artifact_archive(project_id: str = Query(...)):
    core = find_project_core(project_id)
    if not core:
        raise HTTPException(status_code=404, detail=f"project not found: {project_id}")
    root = core.resolve()
    artifact_paths: List[Path] = []
    for pattern in [
        "code/**/*",
        "figures/**/*",
        "main.pdf",
        "paper.pdf",
        "results.json",
        "main.tex",
    ]:
        for path in root.glob(pattern):
            if path.is_file() and not path.name.startswith("."):
                artifact_paths.append(path.resolve())
    unique_paths = sorted(set(artifact_paths), key=lambda item: str(item))
    if not unique_paths:
        raise HTTPException(status_code=404, detail="no artifact files found")

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in unique_paths:
            try:
                rel = path.relative_to(root)
            except ValueError:
                continue
            archive.write(path, arcname=str(rel))
    buffer.seek(0)
    filename = f"{project_id}-artifacts.zip"
    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@research_run_router.post("/api/research-runs/{run_id}/approval")
async def approve_research_run(run_id: str, payload: ApprovalPayload):
    run = store.get(run_id)
    run.paused_on_step_id = None
    run.status = "running"
    await store.update_step(
        run,
        payload.step_id,
        {
            "status": "done",
            "gate": False,
            "gateLabel": None,
            "gateHint": None,
            "tool": {"status": "done"},
        },
    )
    await store.publish(run, {"type": "status", "status": "running"})
    if payload.action == "accept" and payload.step_id == "goal-parse":
        await emit_goal_accept_steps(run)
        return {"status": run.status, "pausedOnStepId": run.paused_on_step_id}
    if payload.action == "accept" and payload.step_id == "experiment-plan":
        await emit_experiment_accept_steps(run, payload.step_id)
        return {"status": run.status, "pausedOnStepId": run.paused_on_step_id}
    if payload.action == "accept" and payload.step_id == "judge-feedback":
        await emit_judge_accept_steps(run, payload.step_id)
        return {"status": run.status, "pausedOnStepId": run.paused_on_step_id}

    emitted_gate = False
    for step in build_approval_steps(payload):
        delay = step.pop("delayMs", 0)
        if delay:
            await asyncio.sleep(delay)
        await store.publish(run, {"type": "step", "step": step})
        if step.get("gate"):
            run.status = "waiting"
            run.paused_on_step_id = step["id"]
            emitted_gate = True
            await store.publish(
                run,
                {"type": "status", "status": "waiting", "pausedOnStepId": step["id"]},
            )
            break
        if payload.action in {"ask-revision", "reject"}:
            run.status = "waiting"
            run.paused_on_step_id = step["id"]
            emitted_gate = True
            await store.publish(
                run,
                {"type": "status", "status": "waiting", "pausedOnStepId": step["id"]},
            )
            break
    if not emitted_gate and run.status == "running":
        run.status = "complete"
        await store.publish(run, {"type": "status", "status": "complete"})
    return {"status": run.status, "pausedOnStepId": run.paused_on_step_id}


@research_run_router.post("/api/research-runs/{run_id}/follow-up")
async def send_follow_up(run_id: str, payload: FollowUpPayload):
    run = store.get(run_id)
    target_step_id = (
        payload.active_step_id
        or payload.selected_tool_step_id
        or run.paused_on_step_id
    )
    target_step = find_step(run, target_step_id) if target_step_id else {}

    if target_step.get("id") == "experiment-plan":
        current_plan = parse_step_output(target_step)
        survey_step = find_step(run, "survey-agent")
        await store.update_step(
            run,
            "experiment-plan",
            {
                "status": "running",
                "summary": f"Revising experiment plan from follow-up: {payload.message[:120]}",
                "tool": {
                    "status": "running",
                    "input": {
                        **((target_step.get("tool") or {}).get("input") or {}),
                        "followUp": payload.message,
                        "activeStepId": payload.active_step_id,
                        "selectedToolStepId": payload.selected_tool_step_id,
                        "currentStage": payload.current_stage,
                    },
                    "output": "Revising structured experiment plan from user follow-up.",
                },
            },
        )
        revised = await run_coding_plan_revision(
            run.task,
            current_plan,
            survey_step,
            payload.message,
        )
        revised_output = json.dumps(
            {k: v for k, v in revised.items() if k not in {"_raw", "elapsedMs"}},
            ensure_ascii=False,
            indent=2,
        )
        await store.update_step(
            run,
            "experiment-plan",
            {
                "status": "review",
                "duration": format_duration(revised["elapsedMs"]),
                "summary": f"Revised after follow-up: {format_plan_summary(revised)}",
                "tool": {
                    "status": "done",
                    "input": {
                        "task": run.task,
                        "previousPlan": current_plan,
                        "followUp": payload.message,
                        "activeStepId": payload.active_step_id,
                        "selectedToolStepId": payload.selected_tool_step_id,
                        "currentStage": payload.current_stage,
                    },
                    "output": revised_output,
                    "timeMs": revised["elapsedMs"],
                },
                "gate": True,
                "gateLabel": "Approve experiment plan",
                "gateHint": "Approve the revised plan before ML Agent writes and runs code.",
                "output": {"kind": "experiment"},
            },
        )
        run.status = "waiting"
        run.paused_on_step_id = "experiment-plan"
        await store.publish(
            run,
            {"type": "status", "status": "waiting", "pausedOnStepId": "experiment-plan"},
        )
        return {"status": "revised", "targetStepId": "experiment-plan"}

    if target_step.get("id") == "judge-feedback":
        current_feedback = parse_step_output(target_step)
        plan_step = find_step(run, "experiment-plan")
        ml_step = find_step(run, "ml-agent")
        await store.update_step(
            run,
            "judge-feedback",
            {
                "status": "running",
                "summary": f"Revising judge feedback from follow-up: {payload.message[:120]}",
                "tool": {
                    "status": "running",
                    "input": {
                        **((target_step.get("tool") or {}).get("input") or {}),
                        "followUp": payload.message,
                        "activeStepId": payload.active_step_id,
                        "selectedToolStepId": payload.selected_tool_step_id,
                        "currentStage": payload.current_stage,
                    },
                    "output": "Revising judge feedback from user follow-up.",
                },
            },
        )
        revised = await run_judge_revision(
            run.task,
            plan_step,
            ml_step,
            current_feedback,
            payload.message,
        )
        revised_output = json.dumps(
            {k: v for k, v in revised.items() if k not in {"_raw", "elapsedMs"}},
            ensure_ascii=False,
            indent=2,
        )
        await store.update_step(
            run,
            "judge-feedback",
            {
                "status": "review",
                "duration": format_duration(revised["elapsedMs"]),
                "summary": f"Revised after follow-up: {format_judge_summary(revised)}",
                "tool": {
                    "status": "done",
                    "input": {
                        "task": run.task,
                        "previousFeedback": current_feedback,
                        "followUp": payload.message,
                        "activeStepId": payload.active_step_id,
                        "selectedToolStepId": payload.selected_tool_step_id,
                        "currentStage": payload.current_stage,
                    },
                    "output": revised_output,
                    "timeMs": revised["elapsedMs"],
                },
                "gate": True,
                "gateLabel": "Approve iteration feedback",
                "gateHint": "Approve the revised feedback before continuing to writing.",
                "output": {"kind": "iteration"},
            },
        )
        run.status = "waiting"
        run.paused_on_step_id = "judge-feedback"
        await store.publish(
            run,
            {"type": "status", "status": "waiting", "pausedOnStepId": "judge-feedback"},
        )
        return {"status": "revised", "targetStepId": "judge-feedback"}

    step = {
        "id": f"followup-{uuid.uuid4().hex[:6]}",
        "stageIndex": payload.current_stage if payload.current_stage is not None else max((s.get("stageIndex", 0) for s in run.steps), default=0),
        "title": "Follow-up sent to agent",
        "summary": payload.message,
        "duration": "0s",
        "status": "review",
        "tool": tool(
            "User Follow-up",
            {
                "message": payload.message,
                "activeStepId": payload.active_step_id,
                "selectedToolStepId": payload.selected_tool_step_id,
                "currentStage": payload.current_stage,
            },
            "Follow-up recorded for the next agent turn.",
        ),
    }
    await store.publish(run, {"type": "step", "step": step})
    return {"status": "recorded", "targetStepId": target_step_id}


@research_run_router.websocket("/ws/research-runs/{run_id}")
async def ws_research_run(websocket: WebSocket, run_id: str):
    await websocket.accept()
    try:
        run = store.get(run_id)
    except HTTPException:
        await websocket.close(code=1008, reason="Run not found")
        return
    queue: asyncio.Queue = asyncio.Queue(maxsize=100)
    run.subscribers.append(queue)

    try:
        for step in run.steps:
            await websocket.send_text(json.dumps({"type": "step", "step": step}))
        await websocket.send_text(
            json.dumps(
                {
                    "type": "status",
                    "status": run.status,
                    "pausedOnStepId": run.paused_on_step_id,
                }
            )
        )
        while True:
            event = await queue.get()
            await websocket.send_text(json.dumps(event, ensure_ascii=False))
    except WebSocketDisconnect:
        pass
    finally:
        if queue in run.subscribers:
            run.subscribers.remove(queue)
