#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
venv_dir="${VENV_DIR:-$repo_root/.venv}"
python_version="${PYTHON_VERSION:-3.11}"

if ! command -v uv >/dev/null 2>&1; then
  echo "Error: uv is not installed or not on PATH." >&2
  echo "Install it from https://docs.astral.sh/uv/getting-started/installation/" >&2
  exit 1
fi

cd "$repo_root"

echo "Creating virtual environment at: $venv_dir"
uv venv "$venv_dir" --python "$python_version"

echo "Installing Research Claw and its dependencies"
uv pip install \
  --python "$venv_dir/bin/python" \
  --requirement requirements.txt \
  --editable .

echo
echo "Environment ready."
echo "Activate it with:"
echo "  source \"$venv_dir/bin/activate\""
