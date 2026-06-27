# researcher-baobyte

## Test Entire

This repository is configured for Entire session tracking through `.entire/`,
`.codex/`, and `.claude/`.

To verify the local Entire setup:

```sh
entire status --detailed
entire doctor
```

To confirm checkpoint search works, run a non-interactive JSON search:

```sh
entire search --json --limit 5 "repo:researcher-baobyte"
```

If `entire` is not installed or not on `PATH`, install the CLI first:

```sh
entire --help
```

Search requires authentication. If the JSON search reports an auth error, run:

```sh
entire login
```
