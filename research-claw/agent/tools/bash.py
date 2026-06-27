"""Bash execution tool."""

import subprocess
import asyncio
from pathlib import Path
from typing import Any, Dict, Optional

from core.tools.base import BaseTool
# Try to import security helper, fall back to local implementation if circular import
class BashTool(BaseTool):
    """
    Tool to execute bash commands via Session-anchored environment.
    """

    def __init__(self, session: Any = None, workspace: Any = None, block_git: bool = False, **kwargs):
        self.session = session
        self.workspace = Path(workspace) if workspace else None
        self.block_git = block_git

    @property
    def name(self) -> str:
        return "bash"

    @property
    def description(self) -> str:
        return "Execute a bash command. Working directory is automatically anchored to your isolated session/project."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "command": {
                    "type": "string",
                    "description": "The full bash command to execute."
                },
                "cwd": {
                    "type": "string",
                    "description": "Optional working directory relative to your virtual root."
                }
            },
            "required": ["command"]
        }

    def _build_env(self) -> dict:
        """Inherit the parent environment plus:
          1. The LLM credentials configured in settings.json, so subprocess
             scripts (e.g. OpenAI experiments) can authenticate.
          2. A per-project virtual environment on PATH, so `python`/`pip`
             resolve to an isolated, reproducible interpreter for the project.
        """
        import os
        env = os.environ.copy()

        # --- LLM credentials (settings.json is the source of truth) ---
        try:
            from config.loader import load_config
            cfg = load_config()
            key = cfg.get_api_key()
            base = cfg.get_api_base()
            # Override any inherited value: the parent shell may carry a stale
            # OPENAI_API_KEY, but settings.json is the configured source of truth.
            if key:
                env["OPENAI_API_KEY"] = key
            if base:
                env["OPENAI_BASE_URL"] = base
        except Exception:
            # Never let credential resolution break command execution.
            pass

        # --- Per-project virtual environment ---
        venv_bin = self._ensure_project_venv()
        if venv_bin:
            env["VIRTUAL_ENV"] = str(venv_bin.parent)
            env["PATH"] = f"{venv_bin}{os.pathsep}{env.get('PATH', '')}"
        return env

    def _ensure_project_venv(self):
        """Lazily create a project-level venv (workspace/{project}/.venv) using
        uv and seed it with the common scientific deps. Returns the venv's bin
        directory Path, or None if unavailable.

        The venv lives at the project root (NOT inside a worker overlay) so it
        is shared across worker sessions and never copied/merged."""
        import shutil
        from pathlib import Path as _Path
        try:
            project = getattr(self.session, "project", None) if self.session else None
            project_root = getattr(project, "root", None)
            if project_root is None:
                return None
            venv_dir = _Path(project_root) / ".venv"
            venv_bin = venv_dir / "bin"
            marker = venv_dir / ".seeded"
            if marker.exists() and (venv_bin / "python").exists():
                return venv_bin

            uv = shutil.which("uv")
            if not uv:
                # No uv available — fall back to whatever python is on PATH.
                return venv_bin if (venv_bin / "python").exists() else None

            import subprocess as _sp
            if not (venv_bin / "python").exists():
                _sp.run([uv, "venv", str(venv_dir)], capture_output=True, text=True, timeout=120)
            # Seed common deps (cached by uv, so this is fast on repeat runs).
            seed_env = {**__import__("os").environ, "VIRTUAL_ENV": str(venv_dir)}
            _sp.run(
                [uv, "pip", "install", "openai", "matplotlib", "numpy"],
                capture_output=True, text=True, timeout=300, env=seed_env,
            )
            try:
                marker.write_text("seeded\n", encoding="utf-8")
            except Exception:
                pass
            return venv_bin if (venv_bin / "python").exists() else None
        except Exception:
            return None

    def execute(self, command: str, cwd: Optional[str] = None, **kwargs) -> str:
        """Execute a bash command via VFS."""
        try:
            import shlex, re
            try:
                tokens = shlex.split(command)
            except ValueError:
                tokens = command.split()

            # Block git commands in task mode (has auto-commit, git ops would interfere)
            if self.block_git:
                first_cmd = tokens[0] if tokens else ""
                if first_cmd == "git" or re.search(r'(?:^|[;&|]\s*)git\s', command):
                    return "[ERROR] Git commands are not available in Task mode. Git is managed automatically."

            # [STRICT PROTOCOL] Block direct TODO.md modifications
            if "TODO.md" in command and (">" in command or "sed" in command or "rm" in command or "mv" in command):
                return "[ERROR] [Protocol Violation] Direct modification of 'TODO.md' via bash is forbidden."

            # [ROBUSTNESS] Intercept Malformed Brace Expansion in mkdir
            # Agents often hallucinate "mkdir {a, b}" (with space) which Bash treats as literals "{a," and "b}"
            import re
            if "mkdir" in command and re.search(r'\{.*, .*\}', command):
                return (
                    "[ERROR] Malformed brace expansion detected (space after comma in curly braces). "
                    "Bash treats '{a, b}' as literal filenames '{a,' and 'b}'. "
                    "Please use 'mkdir a b' or 'mkdir {a,b}' (no spaces), or separate commands."
                )

            # [SECURITY FIX] Sanitize command against '..' escapes that could escape workspace
            if ".." in command:
                # Basic check: resolve current workdir and check if command could leak
                # This is heuristic but the CWD anchoring below is the primary boundary.
                # We block it for extra safety.
                return "[ERROR] [Security Violation] '..' navigation in bash commands is restricted to prevent sandbox escape."

            # Determine working directory via Session, fallback to workspace
            try:
                if self.session:
                    working_dir = self.session.resolve(cwd or ".")
                elif self.workspace:
                    if cwd and (".." in Path(cwd).parts or Path(cwd).is_absolute()):
                        return "[ERROR] Path traversal or absolute path blocked."
                    working_dir = self.workspace / (cwd or ".")
                else:
                    return "[ERROR] No session or workspace context available for path resolution."
                if not working_dir.exists():
                    working_dir.mkdir(parents=True, exist_ok=True)

                # Relative path for display
                try:
                    if self.session:
                        rel_cwd = working_dir.relative_to(self.session.project.core)
                    elif self.workspace:
                        rel_cwd = working_dir.relative_to(self.workspace)
                    else:
                        rel_cwd = working_dir
                except Exception:
                    rel_cwd = working_dir
            except Exception as e:
                return f"[ERROR] Path resolution failed: {str(e)}"

            # [SECURITY FIX] In CHAT mode, ensure we use a separate subprocess isolation
            # and prefix logs for visibility.
            # ... (prefixing logic already handled by AgentLoop mostly, but we can add more here)

            # Run command synchronously.
            # Inject the configured LLM credentials so experiment scripts that
            # call the OpenAI SDK can authenticate (the key lives in
            # settings.json, not the parent process environment).
            result = subprocess.run(
                command,
                shell=True,
                cwd=str(working_dir),
                capture_output=True,
                text=True,
                timeout=300, # Changed timeout from 60 to 300
                env=self._build_env(),
            )

            # Prepare output with sandbox context
            if self.session:
                session_id = self.session.id
            else:
                session_id = "default"
            header = f"[🛡️ SANDBOX: {session_id}]\n"

            output = f"{header}sandbox:{rel_cwd}$ {command}\n"
            if result.stdout:
                output += f"STDOUT:\n{result.stdout.strip()}\n"
            if result.stderr:
                output += f"STDERR:\n{result.stderr.strip()}\n"

            if result.returncode != 0:
                output += f"\nCommand failed with exit code {result.returncode}"

            # Truncation
            MAX_CHARS = 32000
            if len(output) > MAX_CHARS:
                output = f"{output[:MAX_CHARS]}\n... [OUTPUT TRUNCATED]"

            return output.strip() if output.strip() else "Command executed successfully (no output)."

        except subprocess.TimeoutExpired:
            return "[ERROR] Command timed out after 60 seconds."
        except Exception as e:
            return f"[ERROR] executing bash command: {str(e)}"
