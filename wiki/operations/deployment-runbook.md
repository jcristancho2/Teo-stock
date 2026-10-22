---
id: deployment-runbook
title: Deployment runbook
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
  - deployment
sources:
  - README.md
code_references:
  - firebase.json
  - package.json
related:
  - ../architecture/deployment.md
  - local-development.md
---

## Summary

Manual two-step deploy: rules/functions, then the built frontend. No CI/CD
pipeline runs this automatically as of this bootstrap.

## Steps

1. Deploy Firestore rules and Cloud Functions:
   ```
   firebase deploy --only firestore:rules,functions
   ```
2. Build the frontend:
   ```
   npm run build
   ```
   (`tsc -b && vite build`, per `package.json`)
3. Deploy hosting:
   ```
   firebase deploy --only hosting
   ```

## Evidence

- `README.md` ("Desplegar reglas y funciones", "Publicar el frontend")
- `firebase.json`
- `package.json`

## Risks

- No automated check gates this deploy (no test suite, no CI workflow for
  the app itself found in this repository). A broken build or a rules
  regression would only be caught manually.

## Related links

- [Deployment architecture](../architecture/deployment.md)
- [Local development](local-development.md)
