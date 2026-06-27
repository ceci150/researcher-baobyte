#!/usr/bin/env python3
"""Google Sheets helper — CLI for read/write/append/create/info/clear operations.

Loads config from .claude/skills/google-sheets/config.json for defaults
(token_path, default_spreadsheet_id, tabs). CLI flags override config.

Usage:
    python sheets_helper.py info
    python sheets_helper.py read --tab OriginalLLM-HarmfulFT --range "A1:D10"
    python sheets_helper.py write --tab OriginalLLM-HarmfulFT --range "A1" --values '[["a","b"]]'
    python sheets_helper.py append --tab OriginalLLM-HarmfulFT --values '[["a","b"]]'
    python sheets_helper.py clear --tab OriginalLLM-HarmfulFT --range "A2:Z"
    python sheets_helper.py create --title "My Sheet"
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
CONFIG_PATH = Path(__file__).parent.parent / "config.json"


def load_config() -> dict:
    if CONFIG_PATH.exists():
        return json.loads(CONFIG_PATH.read_text())
    return {}


def get_credentials(token_path: str) -> Credentials:
    token_file = Path(token_path)
    if not token_file.exists():
        print(f"ERROR: token.json not found at '{token_path}'.", file=sys.stderr)
        print("Please provide a valid token.json path with --token.", file=sys.stderr)
        sys.exit(1)

    creds = Credentials.from_authorized_user_file(str(token_file), SCOPES)

    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        token_file.write_text(creds.to_json())

    if not creds or not creds.valid:
        print("ERROR: token.json is invalid or expired and cannot be refreshed.", file=sys.stderr)
        print("Please provide a fresh token.json.", file=sys.stderr)
        sys.exit(1)

    return creds


def get_service(token_path: str):
    creds = get_credentials(token_path)
    return build("sheets", "v4", credentials=creds)


def resolve_range(args, config: dict) -> str:
    """Build the full range string: 'TabName!A1:D10'.

    Priority: --range with explicit tab > --tab + --range > config default_tab + --range.
    """
    range_str = getattr(args, "range", None) or "A:ZZ"

    if "!" in range_str:
        return range_str

    tab = getattr(args, "tab", None)
    if not tab:
        tabs = config.get("tabs", {})
        tab = next(iter(tabs), None) if tabs else None

    if tab:
        return f"{tab}!{range_str}"
    return range_str


def resolve_spreadsheet_id(args, config: dict) -> str:
    sid = getattr(args, "spreadsheet_id", None)
    if sid:
        return sid
    sid = config.get("default_spreadsheet_id")
    if sid:
        return sid
    print("ERROR: No spreadsheet ID. Set in config.json or pass --spreadsheet-id.", file=sys.stderr)
    sys.exit(1)


def resolve_token(args, config: dict) -> str:
    if args.token != "token.json":
        return args.token
    return config.get("token_path", "token.json")


def cmd_info(args, config: dict):
    token_path = resolve_token(args, config)
    sid = resolve_spreadsheet_id(args, config)
    service = get_service(token_path)
    result = service.spreadsheets().get(spreadsheetId=sid, fields="properties.title,sheets.properties").execute()

    print(f"Spreadsheet: {result['properties']['title']}")
    print(f"ID: {sid}")
    print(f"\nTabs:")
    for sheet in result.get("sheets", []):
        props = sheet["properties"]
        print(f"  - {props['title']} (rows: {props.get('gridProperties', {}).get('rowCount', '?')}, "
              f"cols: {props.get('gridProperties', {}).get('columnCount', '?')})")

    configured_tabs = config.get("tabs", {})
    if configured_tabs:
        print(f"\nConfigured tabs in config.json:")
        for name, meta in configured_tabs.items():
            comment = meta.get("comment", "")
            print(f"  - {name}: {comment}")


def cmd_read(args, config: dict):
    token_path = resolve_token(args, config)
    sid = resolve_spreadsheet_id(args, config)
    range_str = resolve_range(args, config)
    service = get_service(token_path)
    result = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=sid, range=range_str)
        .execute()
    )
    rows = result.get("values", [])
    print(json.dumps(rows, indent=2, ensure_ascii=False))
    print(f"\n# {len(rows)} rows retrieved from {range_str}", file=sys.stderr)


def cmd_write(args, config: dict):
    token_path = resolve_token(args, config)
    sid = resolve_spreadsheet_id(args, config)
    range_str = resolve_range(args, config)
    service = get_service(token_path)
    values = json.loads(args.values)
    body = {"values": values}
    result = (
        service.spreadsheets()
        .values()
        .update(
            spreadsheetId=sid,
            range=range_str,
            valueInputOption=args.input_option,
            body=body,
        )
        .execute()
    )
    print(f"{result.get('updatedCells')} cells updated in {range_str}.")


def cmd_append(args, config: dict):
    token_path = resolve_token(args, config)
    sid = resolve_spreadsheet_id(args, config)
    range_str = resolve_range(args, config)
    service = get_service(token_path)
    values = json.loads(args.values)
    body = {"values": values}
    result = (
        service.spreadsheets()
        .values()
        .append(
            spreadsheetId=sid,
            range=range_str,
            valueInputOption=args.input_option,
            body=body,
        )
        .execute()
    )
    updates = result.get("updates", {})
    print(f"{updates.get('updatedCells', 0)} cells appended to {range_str}.")


def cmd_clear(args, config: dict):
    token_path = resolve_token(args, config)
    sid = resolve_spreadsheet_id(args, config)
    range_str = resolve_range(args, config)
    service = get_service(token_path)
    result = (
        service.spreadsheets()
        .values()
        .clear(spreadsheetId=sid, range=range_str, body={})
        .execute()
    )
    print(f"Cleared range: {result.get('clearedRange', range_str)}")


def cmd_create(args, config: dict):
    token_path = resolve_token(args, config)
    service = get_service(token_path)
    spreadsheet = {"properties": {"title": args.title}}
    result = service.spreadsheets().create(body=spreadsheet, fields="spreadsheetId,spreadsheetUrl").execute()
    print(f"Created spreadsheet:")
    print(f"  ID:  {result['spreadsheetId']}")
    print(f"  URL: {result['spreadsheetUrl']}")


def main():
    config = load_config()

    parser = argparse.ArgumentParser(description="Google Sheets CLI helper")
    parser.add_argument("--token", default="token.json", help="Path to token.json (overrides config)")
    parser.add_argument("--spreadsheet-id", default=None, help="Spreadsheet ID (overrides config)")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # info
    subparsers.add_parser("info", help="Show spreadsheet metadata and tabs")

    # read
    p_read = subparsers.add_parser("read", help="Read values from a range")
    p_read.add_argument("--tab", default=None, help="Tab name (overrides default)")
    p_read.add_argument("--range", default="A:ZZ", help="Range in A1 notation")

    # write
    p_write = subparsers.add_parser("write", help="Write values to a range")
    p_write.add_argument("--tab", default=None, help="Tab name")
    p_write.add_argument("--range", required=True, help="Range in A1 notation")
    p_write.add_argument("--values", required=True, help='JSON 2D array, e.g. \'[["a","b"]]\'')
    p_write.add_argument("--input-option", default="USER_ENTERED", choices=["USER_ENTERED", "RAW"])

    # append
    p_append = subparsers.add_parser("append", help="Append rows after existing data")
    p_append.add_argument("--tab", default=None, help="Tab name")
    p_append.add_argument("--range", default="A:ZZ", help="Range to find table in")
    p_append.add_argument("--values", required=True, help='JSON 2D array, e.g. \'[["a","b"]]\'')
    p_append.add_argument("--input-option", default="USER_ENTERED", choices=["USER_ENTERED", "RAW"])

    # clear
    p_clear = subparsers.add_parser("clear", help="Clear values in a range")
    p_clear.add_argument("--tab", default=None, help="Tab name")
    p_clear.add_argument("--range", required=True, help="Range in A1 notation")

    # create
    p_create = subparsers.add_parser("create", help="Create a new spreadsheet")
    p_create.add_argument("--title", required=True)

    args = parser.parse_args()

    commands = {
        "info": cmd_info,
        "read": cmd_read,
        "write": cmd_write,
        "append": cmd_append,
        "clear": cmd_clear,
        "create": cmd_create,
    }

    try:
        commands[args.command](args, config)
    except HttpError as e:
        print(f"Google Sheets API error: {e}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Invalid JSON in --values: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
