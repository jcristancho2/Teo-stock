---
id: integrations
title: External integrations
type: architecture
status: current
created: 2026-10-22
updated: 2026-10-22
last_verified_commit: n/a (no git repository initialized)
owners:
  - wiki-maintainer
tags:
  - architecture
  - integrations
sources:
  - README.md
code_references:
  - src/firebase/config.ts
related:
  - system-context.md
---

## Summary

Only one real external integration: Firebase itself. The Excel file is a
manual human input, not an automated integration, as of this bootstrap.

## Firebase (the only integration)

- Authentication: email/password sign-in only (`README.md` step 1.2).
- Firestore: primary datastore, see [Data model](../data/data-model.md).
- Cloud Functions v2: `registrarDespacho`, `crearUsuario`,
  `syncUserRoleClaim` (`functions/src/index.ts`).
- Hosting: serves the Vite `dist/` build (`firebase.json`).
- Config is 100% environment-driven on the client
  (`VITE_FIREBASE_*`, `src/firebase/config.ts`) and via the Firebase Admin
  SDK default credentials on the server (Cloud Functions runtime).

## Not yet integrated

> [!INFERENCE]
> README explicitly names a possible future integration — pulling the Excel
> automatically from Extrucol's system, Google Drive/Sheets, or an API
> ("Pendiente para afinar con datos reales") — and states it would be added
> as an additional source without changing validation/dispatch/history
> logic. This is a stated intention, not implemented code.

## Evidence

- `README.md`
- `src/firebase/config.ts`
- `firebase.json`

## Related links

- [System context](system-context.md)
