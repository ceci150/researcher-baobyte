"""Structured research-run API for the Lovable GUI.

This is the first integration layer between the GUI and the agent framework.
It exposes a stable run/event protocol now, while the event producer can later
be swapped from scripted middleware steps to live MetaChain/AgentLoop hooks.
"""

from __future__ import annotations

import asyncio
import json
import re
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from agent.tools.arxiv_search import ArxivSearchTool


research_run_router = APIRouter()


class RunCreatePayload(BaseModel):
    task: str
    mode: str = "Explore"
    control_mode: str = "Full Automation"


class ApprovalPayload(BaseModel):
    step_id: str
    action: str
    selected_opportunity_id: Optional[str] = None
    comment: str = ""


class FollowUpPayload(BaseModel):
    message: str


@dataclass
class ResearchRun:
    id: str
    task: str
    mode: str
    control_mode: str
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


def parse_arxiv_result(result: str) -> tuple[list[str], list[str]]:
    sources: list[str] = []
    citations: list[str] = []
    current_title = ""
    for line in result.splitlines():
        title_match = re.match(r"\[(\d+)\]\s+(.+)", line)
        if title_match:
            current_title = title_match.group(2).strip()
            citations.append(current_title)
            continue
        url_match = re.match(r"\s*URL\s+:\s+(\S+)", line)
        if url_match:
            url = url_match.group(1).strip()
            sources.append(f"{current_title} — {url}" if current_title else url)
    return sources[:5], citations[:5]


async def run_prepare_agent(task: str) -> Dict[str, Any]:
    query = infer_prepare_query(task)
    started = time.perf_counter()
    arxiv_tool = ArxivSearchTool()
    result = await asyncio.to_thread(
        arxiv_tool.execute,
        query=query,
        max_results=3,
        sort_by="relevance",
        categories=["cs.CV", "cs.LG", "cs.AI"],
    )
    sources, citations = parse_arxiv_result(result)
    if not sources and "No papers found" in result:
        fallback_query = " ".join(query.split()[:5])
        result = await asyncio.to_thread(
            arxiv_tool.execute,
            query=fallback_query,
            max_results=3,
            sort_by="relevance",
        )
        query = fallback_query
        sources, citations = parse_arxiv_result(result)
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    return {
        "query": query,
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


async def emit_goal_accept_steps(run: ResearchRun) -> None:
    query = infer_prepare_query(run.task)
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
                        "max_results": 3,
                        "categories": ["cs.CV", "cs.LG", "cs.AI"],
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
                    "max_results": 3,
                    "categories": ["cs.CV", "cs.LG", "cs.AI"],
                },
                "output": compact_tool_output(prepare["result"]),
                "sources": prepare["sources"],
                "citations": prepare["citations"],
                "timeMs": prepare["elapsedMs"],
            },
        },
    )

    for step in build_planning_steps()[1:]:
        delay = step.pop("delayMs", 0)
        if delay:
            await asyncio.sleep(delay)
        await store.publish(run, {"type": "step", "step": step})
        if step.get("gate"):
            run.status = "waiting"
            run.paused_on_step_id = step["id"]
            await store.publish(
                run,
                {"type": "status", "status": "waiting", "pausedOnStepId": step["id"]},
            )
            return


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
    step = {
        "id": f"followup-{uuid.uuid4().hex[:6]}",
        "stageIndex": max((s.get("stageIndex", 0) for s in run.steps), default=0),
        "title": "Follow-up sent to agent",
        "summary": payload.message,
        "duration": "0s",
        "status": "review",
        "tool": tool("User Follow-up", {"message": payload.message}, "Follow-up recorded for the next agent turn."),
    }
    await store.publish(run, {"type": "step", "step": step})
    return {"status": "ok"}


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
