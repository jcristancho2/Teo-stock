---
name: wiki-ingest
description: Ingests one or more documents from knowledge/raw/ (research, meeting notes, requirements, reports) into the wiki — creates a source page, extracts claims, links related concepts/modules, and detects contradictions with existing wiki content. Use whenever a new file is added under knowledge/raw/ or the user asks to process/ingest a source. Invoke as /wiki-ingest <path>.
---

# wiki-ingest

Processes one or more files under `knowledge/raw/` into the wiki. Never modifies the original source files.

## Usage

```
/wiki-ingest knowledge/raw/documents/file.md       # single file
/wiki-ingest knowledge/raw/research/                # whole directory — process each file independently
```

## Process

1. Read the source file (and its `.meta.yml` sidecar if present — metadata is optional; if missing, infer only what's clearly evident and mark the rest unknown rather than inventing an author or date).
2. Create or update a page under `wiki/sources/` using `wiki/templates/source-template.md`: summary, metadata, key claims extracted, related concepts/entities, contradictions.
3. For each extracted claim: check whether an existing page in `wiki/concepts/`, `wiki/modules/`, `wiki/entities/`, or `wiki/analyses/` already covers it.
   - If yes, update that page (strengthen, weaken, or add nuance to the existing claim) and cross-reference the new source.
   - If no suitable page exists, consider whether one is warranted — don't create a page for a single trivial mention.
4. Detect contradictions between the new source and existing wiki content. Record any with a `> [!CONTRADICTION]` callout, citing both sides, and note which one the authority hierarchy favors (external sources rank below code, tests, and recorded decisions — see `wiki-maintainer`'s authority hierarchy).
5. Update `wiki/index.md` with the new/changed pages.
6. Record the source's state in `wiki/sources/manifest.yml` (path, content hash, processed date, source page, status, commit, affected pages) — never edit the original file to mark it processed.
7. Append a `ingest` entry to `wiki/log.md`.
8. Run validations (`check_links.py`, `check_references.py`, `check_index.py`).

## Batch ingestion

When given a directory: process each file independently, keep evidence traceable per-source (don't blend claims from different sources without attribution), flag any file you can't meaningfully process (binary, empty, unreadable), and end with one consolidated summary across all files processed in the run.
