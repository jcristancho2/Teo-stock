---
id: deployment
title: Deployment architecture
type: architecture
status: current
created: 2026-10-22
updated: 2026-10-22
last_verified_commit: n/a (no git repository initialized)
owners:
  - wiki-maintainer
tags:
  - architecture
  - deployment
  - firebase
sources:
  - README.md
code_references:
  - firebase.json
  - package.json
related:
  - system-context.md
  - ../operations/deployment-runbook.md
---

## Summary

Firebase Hosting serves the static Vite build; Firestore rules and Cloud
Functions deploy separately via the Firebase CLI. No CI/CD pipeline exists
in this repository as of this bootstrap (no `.github/workflows` for the app
itself, beyond the wiki's own workflows added by this bootstrap).

## Components deployed

- **Hosting**: `public: "dist"` (`firebase.json`), built with `npm run
  build` (`tsc -b && vite build`, `package.json`).
- **Firestore**: rules from `firestore.rules`, indexes from
  `firestore.indexes.json`.
- **Functions**: the `functions/` package, codebase `default`
  (`firebase.json`).

## Deploy commands

From `README.md`:
```
firebase deploy --only firestore:rules,functions
npm run build
firebase deploy --only hosting
```

## Local emulation

`firebase.json` defines emulator ports for `auth` (9099), `firestore`
(8080), `functions` (5001), `hosting` (5000), with the Emulator UI enabled —
but the frontend (`src/firebase/config.ts`) always talks to the real
Firebase project unless something explicitly points it at the emulator
suite; no emulator-connection code (`connectFirestoreEmulator`, etc.) was
found in `src/firebase/config.ts` during this bootstrap.

> [!NEEDS-VERIFICATION]
> Confirm whether local development is expected to run against the emulator
> suite or a real (dev) Firebase project — the emulator ports are declared
> but nothing in the frontend wires up to them.

## Evidence

- `firebase.json`
- `README.md`
- `package.json`

## Related links

- [Deployment runbook](../operations/deployment-runbook.md)
