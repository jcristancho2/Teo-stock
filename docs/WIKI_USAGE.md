# Using the project wiki

Teo — Disponibilidad de stock (Extrucol). React + Vite + TypeScript frontend, Firebase (Auth, Firestore, Cloud Functions, Hosting) backend. No git repository was initialized in this project as of bootstrap (2026-10-22) — the `wiki-sync.yml`/`wiki-check.yml` workflows below only run once this becomes a GitHub repo.

## For new team members

This project keeps a living knowledge map under `wiki/`, maintained mostly by Claude via the `llm-wiki` skill. It exists so nobody — human or AI — has to rediscover the whole codebase from scratch every time.

- Start at [`wiki/index.md`](../wiki/index.md).
- You (a human) can edit any page directly — it's just Markdown.
- Claude maintains it automatically via the `wiki-maintainer` agent and the skills below.
- Open `wiki/` in Obsidian if you want graph view / backlinks — no plugins required.
- Using a different AI tool on this repo (Cursor, Copilot, Windsurf, Cline, Gemini)? It'll pick up the same knowledge map automatically — see "Multi-tool support" below.

## Multi-tool support

The wiki itself is plain Markdown, readable by anything with file access. What's automated per-tool is the entry point — each assistant reads its own project-instructions file, all pointing back to `wiki/index.md`:

| Tool | Entry point installed |
|---|---|
| Claude Code | `CLAUDE.md` (full protocol + `wiki-maintainer` agent + `/wiki-*` skills) |
| Any other assistant that honors it | `AGENTS.md` (tool-agnostic summary) |
| Cursor | `.cursor/rules/wiki.mdc` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Windsurf | `.windsurfrules` |
| Cline | `.clinerules` |
| Gemini CLI / Code Assist | `GEMINI.md` |

Only Claude Code gets the enforced hook and the automated `/wiki-sync`, `/wiki-ingest`, etc. — other tools get the same map and the same "read the index, verify against code, don't invent" instruction, but updating the wiki after their own changes depends on that tool actually following its instructions file (quality varies by tool). `wiki-check.yml` and `wiki-sync.yml` in CI don't care which tool made the change — they validate and (for sync) update the wiki regardless of what produced the commit.

## Manual operations

```
/wiki-bootstrap                                       # (re)build the wiki from scratch
/wiki-ingest knowledge/raw/documents/example.md        # ingest one source
/wiki-ingest knowledge/raw/research/                   # ingest a whole folder
/wiki-sync                                             # sync wiki with uncommitted/recent changes
/wiki-sync HEAD~3..HEAD                                # sync for a specific commit range
/wiki-query How does the users module work?            # ask a question
/wiki-file-analysis src/users/                          # deep-dive a file or folder
/wiki-lint                                             # audit wiki health
```

## Adding a new source

1. Copy the file into `knowledge/raw/<category>/` (documents, research, meetings, requirements).
2. Make sure it has no secrets.
3. Optionally add a `.meta.yml` sidecar (see `knowledge/raw/README.md`).
4. Run `/wiki-ingest <path>`.
5. Review what changed — the run will say which pages were created/updated and any contradictions found.
6. Run `/wiki-lint` if you want a full consistency check.
7. Commit the changes (the original source + any wiki updates) through your normal workflow.

## After developing a feature

1. Run your tests.
2. Run `/wiki-sync`.
3. Review the diff under `wiki/`.
4. Run `/wiki-lint` if the change was large or touched many areas.
5. Confirm `wiki/log.md` picked up a new entry.

## Automation

- **Local hook**: a `Stop` hook (`.claude/settings.json`) runs `scripts/wiki/changed_files.py` at the end of every session and prints `WIKI_SYNC_SUGGESTED` with the list of substantively-changed files when a sync looks warranted, or `WIKI_SYNC_NOT_NEEDED` otherwise.
- **`wiki-check.yml`**: runs link/reference/index validation on every PR and push to main. Read-only, no API key needed.
- **`wiki-sync.yml`**: runs after pushes to main (ignoring wiki-only changes), uses the `wiki-sync` skill via the Claude Code GitHub Action, and opens a PR with the result — never pushes directly to main. Requires the `ANTHROPIC_API_KEY` secret (set in repo/org settings; this workflow never stores or prints its value). Ignores its own PRs to avoid recursion.

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Broken link reported by `wiki-check` | A page was renamed/moved without updating links — run `/wiki-lint`. |
| Missing reference | `code_references` points to a deleted/moved file — update the page. |
| Wiki feels outdated | Run `/wiki-sync HEAD~N..HEAD` covering the missed commits. |
| Duplicate page on the same topic | Merge manually, or ask Claude to consolidate via `/wiki-lint`. |
| Contradiction flagged | Check `> [!CONTRADICTION]` callouts on the affected page — resolve per the authority hierarchy in the agent definition. |
| Source never processed | Check `wiki/sources/manifest.yml` for its status; re-run `/wiki-ingest`. |
| `wiki-sync.yml` fails on missing API key | Add `ANTHROPIC_API_KEY` as a repository/organization secret. |
| Hook doesn't fire | Check this Claude Code version's supported hook events; see the note above. |
| Answers feel stale | The page's `last_verified_commit` is old relative to recent changes — run `/wiki-sync`. |
