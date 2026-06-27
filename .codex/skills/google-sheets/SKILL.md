---
name: google-sheets
description: Read, write, append, and analyze data in Google Sheets via the official Python API. Use when user wants to access, edit, update, read, or analyze Google Sheets, collect experiment results into spreadsheets, or mentions a spreadsheet ID.
---

# Google Sheets

## Prerequisites

- Python packages: `google-api-python-client google-auth-httplib2 google-auth-oauthlib`
- A `token.json` file (OAuth2 credentials) — ask the user for its path if not found

## Configuration

All defaults are in `config.json` (same directory as this skill):

```json
{
    "token_path": "/pfss/mlde/workspaces/mlde_wsp_WuestA/sc82jenu/ossfuse/.env_gsheet_token.json",
    "default_spreadsheet_id": "1vxdXt2xSAzNtRdT3G9UOajkLffo3pLpYI25tJNcDVOo",
    "tabs": {
        "OriginalLLM-UtilityEval": { "comment": "Original LLM Utility Evaluation" },
        "OriginalLLM-BenignFT": { "comment": "Original LLM Benign Fine-Tuning" },
        "OriginalLLM-HarmfulFT": { "comment": "Original LLM Harmful Fine-Tuning" }
    }
}
```

- `token_path`: default location of OAuth2 token
- `default_spreadsheet_id`: used when `--spreadsheet-id` is not passed
- `tabs`: known tab names with descriptions (first tab is default if `--tab` omitted)

## Quick start

```bash
HELPER=.claude/skills/google-sheets/scripts/sheets_helper.py

# Show spreadsheet info and all tabs
python $HELPER info

# Read from a specific tab
python $HELPER read --tab "OriginalLLM-HarmfulFT" --range "A1:F10"

# Append experiment results to a tab
python $HELPER append --tab "OriginalLLM-HarmfulFT" --values '[["model","ASR","MMLU"]]'

# Write to a specific cell range
python $HELPER write --tab "OriginalLLM-UtilityEval" --range "A1" --values '[["header1","header2"]]'

# Clear a range (keep headers, clear data)
python $HELPER clear --tab "OriginalLLM-BenignFT" --range "A2:Z"
```

## Commands

| Command | Purpose | Key flags |
|---|---|---|
| `info` | List tabs and metadata | — |
| `read` | Read cell values | `--tab`, `--range` |
| `write` | Overwrite cells | `--tab`, `--range`, `--values` |
| `append` | Add rows after table | `--tab`, `--values` |
| `clear` | Clear cell values | `--tab`, `--range` |
| `create` | New spreadsheet | `--title` |

## Flag resolution

All flags are optional when config.json provides defaults:

| Flag | Fallback |
|---|---|
| `--token` | `config.json → token_path` |
| `--spreadsheet-id` | `config.json → default_spreadsheet_id` |
| `--tab` | First tab in `config.json → tabs` |
| `--range` | `A:ZZ` (entire tab) |

The `--tab` flag is prepended to the range automatically. If your `--range` already contains a tab (`Sheet1!A1:B2`), `--tab` is ignored.

## Safety limits

- Never delete a spreadsheet or tab — only clear cell values if explicitly asked
- Before writing, read the tab first to identify header rows (may span multiple rows). Never overwrite header rows unless the user explicitly asks to rewrite them
- Before writing/appending, confirm with the user: which tab, what data, how many rows
- Never batch-write more than 500 rows without user confirmation
- Do not modify `config.json` without user approval

## Extending the helper

If the helper script doesn't support a needed operation, extend it directly rather than writing one-off inline code. Keep the existing CLI interface stable.

## Authentication

Uses an existing `token.json`. Never triggers interactive OAuth flow. If token is missing or expired without refresh_token, asks the user to provide a fresh one.

## Reference docs

- [doc-read-write-cell.md](doc-read-write-cell.md) — values API (get/update/append/batch)
- [doc-create-manage-spreadsheets.md](doc-create-manage-spreadsheets.md) — create/get
- [doc-update-spreadsheets.md](doc-update-spreadsheets.md) — batchUpdate (formatting)
- [doc-date-number-formats.md](doc-date-number-formats.md) — format patterns
