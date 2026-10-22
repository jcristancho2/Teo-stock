---
name: wiki-sync
description: Synchronizes the wiki with recent code changes — inspects git status/diff (or a given commit range), determines whether changes are substantive, and updates only the affected wiki pages. Use after finishing a development task that changed behavior, architecture, an API, the data model, config, security, or a technical decision. Invoke as /wiki-sync or /wiki-sync <git-range>.
---

# wiki-sync

Keeps the wiki current with the real codebase after changes, touching only what actually needs updating.

## Usage

```
/wiki-sync                  # uncommitted changes + recent relevant commits
/wiki-sync HEAD~1..HEAD      # a specific commit range
/wiki-sync HEAD~3..HEAD
```

## Process

1. Run `python3 scripts/wiki/changed_files.py [range] --json` to get a classified list of changed files (`substantive` / `wiki_infra` / `generated`). Changes limited to `wiki_infra` or `generated` need no sync — say so and stop.
2. For `substantive` changes, read the actual diff (`git diff [range] -- <files>`), not just filenames. Classification from the script is a starting heuristic, not a verdict.
3. Decide whether the change is semantically substantive: did it change behavior, architecture, a public API, the data model, an integration, a dependency, configuration, security, build, deployment, an operational procedure, a technical decision, or a test that defines a new contract? Purely cosmetic, formatting, comment-only, or internal-rename changes don't need a sync — say so and stop.
4. Identify which existing wiki pages are affected. Search before assuming — don't create a duplicate page when one already covers the area.
5. Update only the necessary pages. Create a new page only when no suitable category/page already exists.
6. Update cross-references and `wiki/index.md` if pages were added, removed, or re-scoped.
7. If the sync surfaces a contradiction between the wiki and the new code, resolve it per the authority hierarchy and record it with `> [!CONTRADICTION]`.
8. Append a `sync` entry to `wiki/log.md` — list pages created/updated/marked obsolete, contradictions, open questions.
9. Run validations.

## Output

Always report explicitly: semantic changes detected, pages created, pages updated, pages marked obsolete, contradictions, open questions, and — importantly — the reason when no update was required. "Nothing to sync" is a valid and useful result; say why.
