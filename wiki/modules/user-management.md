---
id: user-management
title: User management
type: module
status: current
created: 2026-10-22
updated: 2026-10-22
last_verified_commit: n/a (no git repository initialized)
owners:
  - wiki-maintainer
tags:
  - module
  - frontend
  - auth
sources:
  - README.md
code_references:
  - src/pages/AdminUsersPage.tsx
  - functions/src/index.ts#crearUsuario
  - functions/src/index.ts#syncUserRoleClaim
  - scripts/setFirstAdmin.cjs
related:
  - ../modules/cloud-functions.md
  - ../security/firestore-rules-and-roles.md
  - ../decisions/dual-role-storage.md
---

## Summary

Admin-only UI to list users and create new ones; the very first admin has
no in-app bootstrap and must be created with a standalone script.

## Responsibilities

- `AdminUsersPage.tsx` (126 lines): live list of `users` (Firestore
  `onSnapshot`), a create-user form (nombre/email/password/rol) that calls
  the `crearUsuario` Cloud Function, and (per README) role edits directly on
  the `users/{uid}` document that `syncUserRoleClaim` then propagates to the
  Auth custom claim automatically.
- `functions/src/index.ts#crearUsuario`: admin-only guard
  (`auth_.token.role !== 'admin'` → `permission-denied`); creates the
  Firebase Auth user, sets the `role` custom claim, writes the Firestore
  `users/{uid}` profile — all server-side so the admin's own session is
  never swapped out by `createUserWithEmailAndPassword` client-side (which
  would otherwise sign the admin out and into the new account).
- `scripts/setFirstAdmin.cjs`: one-time bootstrap for the very first admin,
  run with a Firebase service-account key (`FIREBASE_SERVICE_ACCOUNT` env
  var), documented in `README.md` step 5. Has its own `scripts/package.json`.

## Why `crearUsuario` exists server-side

> [!INFERENCE]
> Creating a Firebase Auth user from the client SDK
> (`createUserWithEmailAndPassword`) signs the browser into the new account,
> which would kick the admin out of their own session. Routing creation
> through a Cloud Function with the Admin SDK avoids that side effect. This
> is inferred from the code's shape (admin-only `onCall`, no client-side
> Auth user-creation call anywhere in `src/`) — not stated explicitly in a
> comment.

## Evidence

- `src/pages/AdminUsersPage.tsx`
- `functions/src/index.ts#crearUsuario`
- `functions/src/index.ts#syncUserRoleClaim`
- `scripts/setFirstAdmin.cjs`
- `README.md` (step 5, "Crear el primer administrador")

## Related decisions

- [Roles live in both Firestore and Auth custom claims](../decisions/dual-role-storage.md)

## Related links

- [Cloud Functions](cloud-functions.md)
