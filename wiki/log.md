# Wiki Log

Append-only. Never rewrite or delete previous entries — if something was wrong, add a new entry that corrects it and reference the old one.

Every heading begins exactly with `## [` so it can be greped:

```
grep "^## \[" wiki/log.md | tail -10
```

Allowed `type` values: `bootstrap`, `ingest`, `sync`, `query`, `analysis`, `lint`, `decision`, `repair`.

Format:

```
## [YYYY-MM-DD HH:mm] type | title

- Operation:
- Verified commit:
- Files analyzed:
- Sources processed:
- Pages created:
- Pages updated:
- Pages marked obsolete:
- Contradictions detected:
- Decisions recorded:
- Open questions:
- Result:
```

---

## [2026-10-22 00:00] bootstrap | Initial LLM Wiki bootstrap

- Operation: Full bootstrap (structure, content, automation) via llm-wiki skill.
- Verified commit: n/a (no git repository initialized in this project)
- Files analyzed: README.md, package.json, firebase.json, firestore.rules, src/App.tsx, src/context/AuthContext.tsx, src/components/*.tsx, src/pages/*.tsx, src/utils/*.ts, src/types/index.ts, src/firebase/config.ts, functions/src/index.ts, .env.example
- Sources processed: none (knowledge/raw/ empty at bootstrap time)
- Pages created: overview, architecture/{system-context,components,data-flow,integrations,deployment}, modules/{frontend-routing-auth,stock-dispatch-ui,excel-upload,user-management,cloud-functions}, data/data-model, security/firestore-rules-and-roles, decisions/{dispatch-via-cloud-function,dual-role-storage,configurable-excel-mapping}, operations/{local-development,deployment-runbook}, glossary, index
- Pages updated: none (first run)
- Pages marked obsolete: none
- Contradictions detected: none
- Decisions recorded: 3 (dispatch-via-cloud-function, dual-role-storage, configurable-excel-mapping) — all reconstructed from README + code at bootstrap, not from a prior decision log.
- Open questions: 4 (see wiki/index.md § "Open questions across the wiki")
- Result: READY_WITH_WARNINGS — no automated tests exist in the repo to verify behavior claims against; emulator-vs-real-project local dev flow unconfirmed.
