# knowledge/raw/

Original source documents for the wiki: research, meeting notes, requirements, external reports, transcripts.

## Rules

- **Treat everything here as immutable.** Claude reads, summarizes, and cites these files but never rewrites or deletes them during normal wiki operations. If a source needs replacing, add a new file rather than overwriting — see "Replacing a source" below.
- **No secrets.** Never add files containing API keys, passwords, tokens, or credentials of any kind.
- **No personal data** beyond what's genuinely needed for the project's context.

## Folders

- `documents/` — general reference documents
- `research/` — research papers, articles, competitive analysis
- `meetings/` — meeting notes and minutes
- `requirements/` — requirements docs, specs, briefs
- `assets/` — images or other non-text files referenced by the above

## Naming

Use descriptive, stable, kebab-case filenames: `2026-10-customer-interview-acme.md`, not `notes.md` or `doc1.md`.

## Optional metadata sidecar

You can add a `.meta.yml` file next to any source with the same base name:

```
customer-interview-acme.md
customer-interview-acme.meta.yml
```

```yaml
title: Customer interview — Acme Corp
author: Jane Doe
published: 2026-10-01
added: 2026-10-15
source_url: https://example.com/notes
source_type: meeting | article | paper | requirement | report | note | transcript
topics:
  - onboarding
  - billing
status: pending
```

Metadata is optional. If it's missing, Claude infers only what's clearly evident from the file itself and marks the rest as unknown — it never invents an author or date.

## Running ingestion

```
/llm-wiki ingest knowledge/raw/documents/example.md
/llm-wiki ingest knowledge/raw/research/
```

This creates or updates a page under `wiki/sources/`, extracts claims, links related concepts/modules, detects contradictions with the existing wiki, and records the result in `wiki/log.md`. See `wiki/sources/manifest.yml` for processing status — the manifest tracks state, not the original file (which is never modified to mark it as processed).

## Images

Put images under `raw/assets/` and reference them from the relevant source page using a relative link.
