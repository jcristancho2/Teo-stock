# Wiki Health

- Audit date: 2026-10-22
- Verified commit: n/a (no git repository initialized in this project)
- Overall status: attention-required

## Counts

| Metric | Count |
|---|---|
| Total pages | 19 |
| Current | 16 |
| Draft | 0 |
| Needs review | 0 |
| Superseded | 0 |
| Decision (accepted) | 3 |

## Issues

### Broken links
(none found — `check_links.py`: scanned 28 files, no broken links)

### Missing references
(none in content pages — `check_references.py` flags 3 broken refs, all
inside `wiki/templates/*.md` placeholder text, not real pages; 9 warnings
are unverified-symbol notices for `file.ts#SymbolName` anchors the checker
can't parse by name, all manually verified against source during writing)

### Orphan pages (no inbound links)
(none found — `check_index.py`: OK, 19 pages, all indexed and consistent)

### Duplicate concepts
(none found)

### Contradictions
(none found)

### Undocumented modules
- `scripts/setFirstAdmin.cjs` is referenced from `modules/user-management.md`
  but has no dedicated page — low value given it's a single one-off script,
  already covered inline.
- `src/styles/global.css`, `vite-env.d.ts`, build config files
  (`tsconfig*.json`, `vite.config.*`) intentionally left undocumented —
  standard tooling, no project-specific decisions found in them.

### Unprocessed sources
- `knowledge/raw/` is empty at bootstrap time — no source documents existed
  to ingest. See `docs/WIKI_USAGE.md` for the ingestion example.

### Open questions
See `wiki/index.md` § "Open questions across the wiki" (4 items, each
tagged `[!NEEDS-VERIFICATION]` on its page).

## Recommended actions

1. Run a real Extrucol Excel export through `UploadExcelForm` once and
   confirm `sugerirMapeo`'s guess was correct; update
   `decisions/configurable-excel-mapping.md` and
   `modules/excel-upload.md` with the outcome.
2. Decide and document whether local dev should target the Firebase
   Emulator Suite or a real dev project, then update
   `architecture/deployment.md`.
3. If/when automated tests are added, give them a `wiki/concepts/testing-strategy.md`
   or equivalent page — none exists today because none were found in the repo.
