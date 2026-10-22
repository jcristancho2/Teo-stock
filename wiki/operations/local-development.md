---
id: local-development
title: Local development setup
type: runbook
status: current
created: 2026-10-22
updated: 2026-10-22
last_verified_commit: n/a (no git repository initialized)
owners:
  - wiki-maintainer
tags:
  - operations
  - runbook
sources:
  - README.md
code_references:
  - package.json
  - .env.example
  - firebase.json
related:
  - ../architecture/deployment.md
  - deployment-runbook.md
---

## Summary

Steps to run Teo locally against a real Firebase project (no emulator
wiring found in the frontend code — see
[Deployment § Local emulation](../architecture/deployment.md#local-emulation)).

## Steps

1. Create/choose a Firebase project (Auth email/password enabled, Firestore
   in production mode, Blaze billing plan) — `README.md` step 1.
2. Install dependencies:
   ```
   npm install
   npm install --prefix scripts
   npm install --prefix functions
   ```
3. Copy `.env.example` to `.env` and fill in the Firebase Web app config
   values (`VITE_FIREBASE_*`).
4. `npm install -g firebase-tools && firebase login && firebase use --add`.
5. Create the first admin (requires a downloaded service-account key):
   ```
   FIREBASE_SERVICE_ACCOUNT=./service-account.json \
     node scripts/setFirstAdmin.cjs tu-correo@extrucol.com "Tu Nombre" "unaClaveTemporalSegura"
   ```
6. Deploy rules + functions once: `firebase deploy --only firestore:rules,functions`.
7. Run the dev server: `npm run dev` (Vite).

## Evidence

- `README.md`
- `package.json` (`scripts.dev`)
- `.env.example`

## Open questions

> [!NEEDS-VERIFICATION]
> Whether developers are expected to point at a dedicated dev Firebase
> project vs. production for local work — not stated in `README.md`.

## Related links

- [Deployment architecture](../architecture/deployment.md)
- [Deployment runbook](deployment-runbook.md)
