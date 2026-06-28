"""selfgrow_plan: 为某个外部能力生成针对 research-claw 的接入方案。

当 Self-grow 监控任务推送了一批新 feature、用户回复「想接入 feature X」时，
主 assistant 调用本工具。它会：
  1) 用 web_fetch 不可达的方式直接读 research-claw 仓库自身的关键源码（架构摘要），
  2) 结合用户提供的 feature 描述与来源链接，
  3) 通过一次 provider.chat 产出一份**面向本仓库的实施方案** markdown，
  4) 写入 docs/selfgrow/{slug}.md 并推送给用户。

注意：本工具只产出方案，不会自动改代码——落地由用户确认后人工/另起任务进行。
"""

from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

from loguru import logger

from core.tools.base import BaseTool

# research-claw 仓库根目录（本文件位于 agent/tools/ 下）。
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent

# 给规划 LLM 注入的架构锚点：这些文件/目录构成 research-claw 的主要扩展点。
_ARCH_ANCHORS = [
    "CLAUDE.md",
    "agent/loop.py",
    "config/tools.json",
    "config/agent_profiles/automation_agent.json",
    "core/automation/radar_defaults.py",
    "core/automation/selfgrow.py",
    "agent/scheduler/iterate.py",
]


class SelfGrowPlanTool(BaseTool):
    """Generate a repo-specific integration plan for an externally-spotted feature."""

    def __init__(self, tool_context: Any):
        self.ctx = tool_context
        self.provider = getattr(tool_context, "provider", None)
        self.model = getattr(tool_context, "model", None)

    @property
    def name(self) -> str:
        return "selfgrow_plan"

    @property
    def description(self) -> str:
        return (
            "Generate a concrete integration plan for adopting an externally-spotted "
            "feature into research-claw. Use this when the user, after a Self-grow watch "
            "push, asks to integrate a specific capability. Reads research-claw's own "
            "source for context, writes a markdown plan under docs/selfgrow/, and returns "
            "it. Does NOT modify code — the plan is for review only."
        )

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "feature": {
                    "type": "string",
                    "description": "Name / short description of the capability to integrate.",
                },
                "source_url": {
                    "type": "string",
                    "description": "Source link where the feature was found (repo or article).",
                    "default": "",
                },
                "context": {
                    "type": "string",
                    "description": "Optional extra detail about the feature (e.g. how the source implements it, what the user already knows).",
                    "default": "",
                },
            },
            "required": ["feature"],
        }

    @staticmethod
    def _slug(text: str) -> str:
        s = re.sub(r"[^a-zA-Z0-9]+", "-", text.strip().lower()).strip("-")
        return (s or "feature")[:50]

    def _read_arch_summary(self, max_chars_per_file: int = 4000) -> str:
        """Read the head of each architecture anchor file as planning context."""
        parts: list[str] = []
        for rel in _ARCH_ANCHORS:
            path = _REPO_ROOT / rel
            if not path.exists() or not path.is_file():
                continue
            try:
                text = path.read_text(encoding="utf-8", errors="ignore")
            except Exception as e:
                logger.debug(f"selfgrow_plan: cannot read {rel}: {e}")
                continue
            snippet = text[:max_chars_per_file]
            truncated = "\n... [truncated]" if len(text) > max_chars_per_file else ""
            parts.append(f"### {rel}\n```\n{snippet}{truncated}\n```")
        return "\n\n".join(parts) if parts else "(无法读取仓库源码)"

    async def execute(
        self,
        feature: str,
        source_url: str = "",
        context: str = "",
        **kwargs,
    ) -> str:
        feature = (feature or "").strip()
        if not feature:
            return "selfgrow_plan: 缺少 feature 参数。"
        if not self.provider:
            return "selfgrow_plan: 当前上下文没有可用的 provider，无法生成方案。"

        arch_summary = self._read_arch_summary()
        prompt = (
            "你是 research-claw 的资深架构师。用户希望把一个在外部 AI-research-agent 项目里看到的能力"
            "接入到 research-claw。请基于下面提供的 research-claw 关键源码摘要，产出一份**可执行、"
            "面向本仓库**的接入方案（中文 markdown）。\n\n"
            f"## 待接入能力\n{feature}\n"
            + (f"\n来源: {source_url}\n" if source_url else "")
            + (f"\n补充说明: {context}\n" if context else "")
            + "\n## research-claw 关键源码摘要（接入点参考）\n"
            f"{arch_summary}\n\n"
            "## 方案要求（严格按以下结构输出，不要寒暄）\n"
            "1. **能力解读**：用 2-3 句说清这个能力的本质，以及它能给 research-claw 补齐什么。\n"
            "2. **接入点**：明确应该改/新增哪些文件或模块（用真实路径，参考上面的源码摘要，"
            "如新增 radar 任务→core/automation/radar_defaults.py，新增工具→agent/tools/ + config/tools.json + profile）。\n"
            "3. **任务拆解**：3-7 个有序步骤，每步一句话，可直接作为 task_planner 的输入。\n"
            "4. **风险与权衡**：沙箱安全、与现有 radar/loop 的耦合、token 成本、是否需要新依赖或外部 token。\n"
            "5. **验证方式**：如何确认接入成功（最小验证手段）。\n"
            "保持务实，不确定处明确标注「待确认」，不要编造仓库里不存在的模块。"
        )

        try:
            resp = await self.provider.chat(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                tools=None,
            )
            plan = (resp.content or "").strip()
        except Exception as e:
            logger.error(f"selfgrow_plan LLM call failed: {e}")
            return f"selfgrow_plan: 生成方案失败 - {e}"

        if not plan:
            return "selfgrow_plan: 模型未返回内容。"

        # 写入 docs/selfgrow/{slug}.md（仓库内，非沙箱）。
        slug = self._slug(feature)
        stamp = datetime.now().strftime("%Y%m%d_%H%M")
        out_dir = _REPO_ROOT / "docs" / "selfgrow"
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"{stamp}_{slug}.md"
        header = (
            f"# Self-grow 接入方案: {feature}\n\n"
            f"- 生成时间: {datetime.now().isoformat(timespec='seconds')}\n"
            + (f"- 来源: {source_url}\n" if source_url else "")
            + "- 状态: 待 review（本方案不会自动改代码）\n\n---\n\n"
        )
        try:
            out_path.write_text(header + plan, encoding="utf-8")
        except Exception as e:
            logger.warning(f"selfgrow_plan: failed to write plan file: {e}")
            out_path = None

        rel = out_path.relative_to(_REPO_ROOT) if out_path else None
        result = plan
        if rel:
            result += f"\n\n---\n已保存接入方案到 `{rel}`（仅供 review，未改动任何代码）。"
        return result
