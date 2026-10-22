---
id: index
title: Wiki index — Teo (Extrucol)
type: overview
status: current
created: 2026-10-22
updated: 2026-10-22
last_verified_commit: n/a (no git repository initialized)
owners:
  - wiki-maintainer
tags:
  - index
sources: []
code_references: []
related: []
---

Knowledge map for Teo — Disponibilidad de stock. Read this first, then open
only the pages you need. See `wiki/README.md` for conventions,
`AGENTS.md`/`CLAUDE.md` for the full protocol.

| Page | Description | Status | Updated |
|---|---|---|---|
| [overview.md](overview.md) | What the app is, who uses it, how it's built | current | 2026-10-22 |
| [architecture/system-context.md](architecture/system-context.md) | Actors, external boundary, Firebase project shape | current | 2026-10-22 |
| [architecture/components.md](architecture/components.md) | Full inventory of pages/components/functions | current | 2026-10-22 |
| [architecture/data-flow.md](architecture/data-flow.md) | Excel upload flow and dispatch flow, step by step | current | 2026-10-22 |
| [architecture/integrations.md](architecture/integrations.md) | Firebase as the only integration; what's not built yet | current | 2026-10-22 |
| [architecture/deployment.md](architecture/deployment.md) | Hosting/Firestore/Functions deploy shape, emulator ports | current | 2026-10-22 |
| [modules/frontend-routing-auth.md](modules/frontend-routing-auth.md) | AuthContext, RoleRoute, route tree | current | 2026-10-22 |
| [modules/stock-dispatch-ui.md](modules/stock-dispatch-ui.md) | StockTable, DispatchForm, HistorialMovimientos | current | 2026-10-22 |
| [modules/excel-upload.md](modules/excel-upload.md) | UploadExcelForm, column mapping, row validation | current | 2026-10-22 |
| [modules/user-management.md](modules/user-management.md) | AdminUsersPage, crearUsuario, first-admin bootstrap | current | 2026-10-22 |
| [modules/cloud-functions.md](modules/cloud-functions.md) | registrarDespacho, crearUsuario, syncUserRoleClaim | current | 2026-10-22 |
| [data/data-model.md](data/data-model.md) | The 5 Firestore collections and their relationships | current | 2026-10-22 |
| [security/firestore-rules-and-roles.md](security/firestore-rules-and-roles.md) | Role model, firestore.rules walkthrough | current | 2026-10-22 |
| [decisions/dispatch-via-cloud-function.md](decisions/dispatch-via-cloud-function.md) | Why dispatch can't be a direct client write | accepted | 2026-10-22 |
| [decisions/dual-role-storage.md](decisions/dual-role-storage.md) | Why role lives in both Firestore and Auth claims | accepted | 2026-10-22 |
| [decisions/configurable-excel-mapping.md](decisions/configurable-excel-mapping.md) | Why Excel column mapping isn't hardcoded | accepted | 2026-10-22 |
| [operations/local-development.md](operations/local-development.md) | How to run the app locally | current | 2026-10-22 |
| [operations/deployment-runbook.md](operations/deployment-runbook.md) | How to deploy rules, functions, hosting | current | 2026-10-22 |
| [glossary.md](glossary.md) | Spanish business terms (referencia, despacho, por verificar...) | current | 2026-10-22 |
| [health.md](health.md) | Wiki self-audit status | current | 2026-10-22 |

## Open questions across the wiki

- Real Extrucol Excel export not yet run through the mapping suggestion (`overview.md`).
- Whether local dev is meant to target the emulator suite or a real Firebase project (`architecture/deployment.md`).
- Whether `stock` cleans up references absent from a new upload (`data/data-model.md`).
- Whether a read-only (`permiteDespacho=false`) stock view is still planned (`modules/stock-dispatch-ui.md`).
