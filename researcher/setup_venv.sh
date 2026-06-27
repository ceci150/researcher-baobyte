#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="${VENV_DIR:-${ROOT_DIR}/.venv}"

if [[ -n "${PYTHON_BIN:-}" ]]; then
    PYTHON="${PYTHON_BIN}"
elif command -v python3.12 >/dev/null 2>&1; then
    PYTHON="python3.12"
elif command -v python3.11 >/dev/null 2>&1; then
    PYTHON="python3.11"
else
    echo "Error: Python 3.11 or 3.12 is required." >&2
    echo "Install one of these versions, or set PYTHON_BIN explicitly." >&2
    exit 1
fi

"${PYTHON}" - <<'PY'
import sys

if not ((3, 11) <= sys.version_info[:2] <= (3, 12)):
    raise SystemExit(
        f"Python 3.11 or 3.12 is required; found {sys.version.split()[0]}"
    )
PY

if [[ ! -x "${VENV_DIR}/bin/python" ]]; then
    echo "Creating virtual environment with ${PYTHON}: ${VENV_DIR}"
    "${PYTHON}" -m venv "${VENV_DIR}"
else
    echo "Reusing virtual environment: ${VENV_DIR}"
fi

VENV_PYTHON="${VENV_DIR}/bin/python"

echo "Upgrading packaging tools"
"${VENV_PYTHON}" -m pip install --upgrade pip "setuptools<82" wheel

echo "Installing ai-researcher and its Python dependencies"
"${VENV_PYTHON}" -m pip install \
    "docling==2.70.0" \
    "docling-core==2.50.1" \
    --editable "${ROOT_DIR}"

if [[ "${INSTALL_PLAYWRIGHT_BROWSER:-1}" == "1" ]]; then
    echo "Installing Playwright Chromium"
    "${VENV_PYTHON}" -m playwright install chromium
fi

echo
echo "Virtual environment is ready."
echo "Activate it with:"
echo "  source \"${VENV_DIR}/bin/activate\""

for command_name in docker pdflatex; do
    if ! command -v "${command_name}" >/dev/null 2>&1; then
        echo "Warning: ${command_name} is not installed; related workflow stages will not run." >&2
    fi
done
