---
name: wiki-lint
description: Audits the wiki for broken links, missing index entries, orphan pages, duplicate or contradictory claims, invalid frontmatter, stale verification commits, unprocessed sources, undocumented modules, and exposed sensitive information — then fixes what's safely fixable and updates wiki/health.md. Use periodically or whenever the wiki might have drifted. Invoke as /wiki-lint.
---

# wiki-lint

Audits the wiki's health and fixes what's safe to fix automatically.

## Usage

```
/wiki-lint
```

## Checks

- Broken links and references to missing files (`check_links.py`, `check_references.py`)
- Pages missing from `wiki/index.md`, or index entries pointing to missing pages (`check_index.py`)
- Orphan pages (nothing links to them)
- Duplicate concepts covered by more than one page
- Contradictory claims not flagged with `> [!CONTRADICTION]`
- Pages with unsupported claims (no `Evidence` section / no citations)
- Invalid or incomplete frontmatter
- Stale `last_verified_commit` values (page not touched in a long time relative to the area it covers)
- Unprocessed sources under `knowledge/raw/` not reflected in `wiki/sources/manifest.yml`
- Undocumented modules that clearly warrant a page
- Integrations without a corresponding `wiki/architecture/integrations.md` entry
- Superseded decisions not marked `status: superseded`
- Open questions that recent code/commits may have resolved
- Inconsistent file naming (not kebab-case, ambiguous names)
- Oversized or overly generic pages
- Problematic circular references
- Accidentally exposed secrets, tokens, or credential values anywhere in `wiki/`

## Process

1. Run `check_links.py`, `check_references.py`, `check_index.py`.
2. Walk `wiki/` for the remaining checks above.
3. Fix safe, mechanical problems directly (a dead link to a page that was renamed, a missing index entry, obvious frontmatter typos).
4. Never invent content to fill a gap — record what can't be fixed automatically as an open question or health issue instead.
5. Update `wiki/health.md` with the full audit result (counts, issues by category, overall status, recommended actions).
6. Append a `lint` entry to `wiki/log.md`.

If you find an exposed secret value, do not print it in your report — redact it, name the file and line, and recommend removing the value and rotating the credential.
