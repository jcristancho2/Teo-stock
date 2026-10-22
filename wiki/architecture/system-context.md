---
id: system-context
title: System context
type: architecture
status: current
created: 2026-10-22
updated: 2026-10-22
last_verified_commit: n/a (no git repository initialized)
owners:
  - wiki-maintainer
tags:
  - architecture
  - firebase
sources: []
code_references:
  - firebase.json
  - src/firebase/config.ts
  - functions/src/index.ts
related:
  - components.md
  - data-flow.md
  - integrations.md
  - deployment.md
  - ../security/firestore-rules-and-roles.md
---

## Summary

Single SPA frontend + Firebase backend, two human actor types, one external
input (the daily Excel file). No other external systems are integrated yet.

## Actors

- **Admin** (Extrucol staff): uploads the daily Excel, manages users, can do
  everything a comercial user can (`src/components/RoleRoute.tsx` grants
  `comercial/*` routes to `['comercial', 'admin']`).
- **Comercial** (sales team): reads stock, registers dispatches, reads
  history. Cannot upload Excel or manage users (route guards in `src/App.tsx`
  restrict `admin/*` to `['admin']`).
- **Excel file**: the one external input, manually downloaded by the admin
  from Extrucol's own system and uploaded through the browser
  (`src/components/UploadExcelForm.tsx`). Not fetched automatically — see
  `README.md` "Pendiente para afinar con datos reales" for a stated future
  option (Drive/Sheets/API source) that is explicitly *not yet built*.

## Boundary

```
 Admin / Comercial (browser)
        │  React SPA (Vite build, hosted on Firebase Hosting)
        │  Firebase Web SDK (auth, firestore listeners, httpsCallable)
        ▼
 Firebase project
   ├─ Authentication (email/password)
   ├─ Firestore (users, stock, movimientos, excelUploads, config)
   └─ Cloud Functions v2 (registrarDespacho, crearUsuario, syncUserRoleClaim)
```

## Evidence

- `firebase.json` — hosting/firestore/functions wiring, local emulator ports.
- `src/firebase/config.ts` — client SDK initialization, all config from env.
- `functions/src/index.ts` — the three Cloud Functions and their trust boundary.

## Constraints

- Firebase Blaze (pay-as-you-go) plan is required for Cloud Functions to run
  at all (`README.md`, step 1.6) — a hard operational constraint, not optional.
- Region pinned to `us-east1` for all Cloud Functions
  (`functions/src/index.ts`, `setGlobalOptions({ region: 'us-east1' })`).

## Related links

- [Component inventory](components.md)
- [Data flow](data-flow.md)
- [Deployment](deployment.md)
