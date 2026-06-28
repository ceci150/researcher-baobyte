"""Self-grow: 全局监控任务，追踪外部 AI-research-agent 项目的新能力。

与 ``radar_defaults`` 中的 per-paper 雷达任务不同，Self-grow 监控的对象是
research-claw 工具自身的演进方向——它每天扫描一批外部参考项目（GitHub 仓库
和文章），发现新加入的 feature 后推送给用户，由用户决定要不要接入。因此它是
**全局唯一**的任务（不随论文项目复制），状态与记忆挂在 ``Default`` 项目下。

来源清单位于 ``config/selfgrow_sources.json``，在任务注册时内联进 prompt
（自动化 agent 的 read_file 受 session 沙箱限制，读不到 workspace 之外的
config 目录），因此编辑清单后需重启 gateway 才会生效。
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from loguru import logger

from core.automation.models import AutomationJob, JobSchedule, OutputPolicy

# Self-grow 任务挂载的全局项目（复用 Default 的记忆/状态基建）。
SELFGROW_PROJECT_ID = "Default"
SELFGROW_JOB_ID = "selfgrow.watch"

_SOURCES_FILE = Path(__file__).resolve().parent.parent.parent / "config" / "selfgrow_sources.json"


def load_sources() -> tuple[bool, list[dict[str, Any]]]:
    """读取来源清单。返回 (enabled, sources)。文件缺失/损坏时返回 (False, [])。"""
    if not _SOURCES_FILE.exists():
        logger.warning(f"Self-grow sources file not found: {_SOURCES_FILE}")
        return False, []
    try:
        data = json.loads(_SOURCES_FILE.read_text(encoding="utf-8"))
    except Exception as e:
        logger.error(f"Failed to parse {_SOURCES_FILE}: {e}")
        return False, []
    if not isinstance(data, dict):
        return False, []
    enabled = bool(data.get("enabled", True))
    raw = data.get("sources", [])
    sources: list[dict[str, Any]] = []
    if isinstance(raw, list):
        for item in raw:
            if not isinstance(item, dict):
                continue
            url = str(item.get("url", "")).strip()
            if not url:
                continue
            sources.append({
                "name": str(item.get("name", "")).strip() or url,
                "type": str(item.get("type", "article")).strip().lower() or "article",
                "url": url,
                "watch": str(item.get("watch", "")).strip(),
            })
    return enabled, sources


def _render_sources_block(sources: list[dict[str, Any]]) -> str:
    lines = []
    for i, s in enumerate(sources, 1):
        line = f"{i}. [{s['type']}] {s['name']} — {s['url']}"
        if s["watch"]:
            line += f"\n   关注点: {s['watch']}"
        lines.append(line)
    return "\n".join(lines) if lines else "(来源清单为空)"


def build_selfgrow_job(timezone: str = "UTC", *, sources: list[dict[str, Any]] | None = None) -> AutomationJob:
    """构造全局 Self-grow 监控任务。来源清单内联进 prompt。"""
    if sources is None:
        _, sources = load_sources()
    sources_block = _render_sources_block(sources)

    prompt = (
        "你是 research-claw 的 Self-grow（自我成长）监控任务。\n"
        "目标：监控一批外部 AI-research-agent 参考项目，发现它们新加入的、值得 research-claw "
        "借鉴的能力（feature），推送给用户，由用户决定是否接入。\n\n"
        "## 监控来源清单\n"
        f"{sources_block}\n\n"
        "## 执行步骤\n"
        "1) 参考系统注入的「执行历史总结」(rolling_summary)，获取上次扫描时间、以及已经报告过的"
        " feature 列表（用于去重）。首次执行（无历史）时，以「了解每个项目当前的核心能力」为基线，"
        "只挑出 3-8 个对 research-claw 最有借鉴价值的能力作为本次发现，不要全量罗列。\n"
        "2) 逐个来源用 web_fetch 抓取：\n"
        "   - github 类型：优先抓 releases 页面 (URL + '/releases')、近期 commits (URL + '/commits')，"
        "以及 README；从中识别新增/变更的能力。\n"
        "   - article 类型：抓正文，识别其描述的能力点或框架更新。\n"
        "   注意：web_fetch 可能因页面渲染/限流失败，失败的来源记下并跳过，不要中断整个任务。\n"
        "3) 对照「关注点」提示，提炼每个来源中**新出现或本次才注意到**的能力。\n"
        "4) 去重：对比 rolling_summary 中已报告过的 feature，相同能力不重复推送。\n"
        "5) 推送策略（必推型）：只要发现去重后的新 feature，必须调用 notify_push 推送；本次无新发现则不推送。\n"
        "6) 推送格式（用户看不到对话，推送是唯一渠道，内容必须自包含）：\n"
        "   开头一句话总览本次扫描（扫了几个来源、几个成功、发现几个新能力）。\n"
        "   然后逐条列出每个新 feature：\n"
        "   - 序号 + 能力名称\n"
        "   - 出处：项目名 + 可点击的完整 URL\n"
        "   - 这个能力是什么（2-3 句）\n"
        "   - 对 research-claw 的潜在价值（能补齐什么短板 / 能增强哪个现有模块，如 loop/tools/radar/写作）\n"
        "   - 接入难度初判（低/中/高）\n"
        "   结尾固定提示用户：「如需对其中某个能力生成针对本仓库的接入方案，回复对应序号或能力名即可（我会调用 "
        "selfgrow_plan 出方案，方案仅供 review，不会自动改代码）。」\n\n"
        "记忆使用说明：\n"
        "- 系统已自动注入执行历史总结与近期运行记录，直接参考即可，无需手动读取历史。\n"
        "- 去重判断请基于 rolling_summary 中记录的已报告 feature。\n"
        "- 执行记录由系统自动生成，不要写 kind='job_run' 的条目。\n"
        "- 如发现特别重要、值得长期保留的能力洞察，可调用 memory_write，"
        f"scope='job:{SELFGROW_JOB_ID}'，kind 自定义（如 'feature_finding'）。"
    )

    return AutomationJob(
        id=SELFGROW_JOB_ID,
        name="Self-Grow Watch",
        type="normal",
        # 每天 07:30 扫描（早于其它雷达任务，避免与 09:xx 高峰重叠）。
        schedule=JobSchedule(cron="30 7 * * *", timezone=timezone or "UTC"),
        prompt=prompt,
        enabled=True,
        managed_by="system",
        output_policy=OutputPolicy(mode="default"),
        metadata={
            "system_job": True,
            "origin": "selfgrow",
            "global_job": True,
            "goal": "selfgrow_watch",
            "source_count": len(sources),
        },
    )
