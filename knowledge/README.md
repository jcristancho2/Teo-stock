# knowledge/

This folder holds supporting material about the project that doesn't live in the codebase itself: research, meeting notes, requirements documents, reports.

- `README.md` — this file.
- `raw/` — original source documents. See `raw/README.md` for how to add one.

Claude's wiki-maintainer agent reads from here during ingestion (`/llm-wiki ingest`) but never rewrites or deletes what's inside `raw/`.
