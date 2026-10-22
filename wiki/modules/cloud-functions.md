---
id: cloud-functions
title: Cloud Functions (server trust boundary)
type: module
status: current
created: 2026-10-22
updated: 2026-10-22
last_verified_commit: n/a (no git repository initialized)
owners:
  - wiki-maintainer
tags:
  - module
  - backend
  - firebase
sources: []
code_references:
  - functions/src/index.ts
related:
  - ../architecture/data-flow.md
  - ../security/firestore-rules-and-roles.md
  - ../decisions/dispatch-via-cloud-function.md
  - ../decisions/dual-role-storage.md
---

## Summary

Three Firebase Cloud Functions v2, all in `functions/src/index.ts`, region
`us-east1`. Together they are the entire server-side trust boundary of the
app — everything a plain Firestore rule can't safely express goes here.

## Responsibilities

- `registrarDespacho` (`onCall`): the only legal path to decrement
  `stock.cantidadDisponible`. Auth required; role must be `admin` or
  `comercial`. Validates `referencia`/`cantidad` shape, then runs a single
  Firestore `runTransaction` that re-reads the stock doc, rejects on
  not-found / `por_verificar` / non-finite-or-negative quantity /
  insufficient stock, otherwise decrements and writes a `movimientos`
  record with before/after quantities and actor identity.
- `crearUsuario` (`onCall`): admin-only. Creates the Firebase Auth user
  (`auth.createUser`), sets the `role` custom claim
  (`auth.setCustomUserClaims`), and writes the Firestore `users/{uid}`
  profile. Maps `auth/email-already-exists` to a friendly `already-exists`
  error.
- `syncUserRoleClaim` (`onDocumentWritten` on `users/{uid}`): on every write
  to a user profile, re-sets the Auth custom claim from `despues.rol` and
  disables/enables the Auth account from `despues.activo`. On document
  deletion, clears the role claim (best-effort, errors swallowed with
  `.catch(() => undefined)`).

## Error flow

Every function throws `HttpsError` with a specific code
(`unauthenticated`, `permission-denied`, `invalid-argument`, `not-found`,
`failed-precondition`, `already-exists`, `internal`) and a Spanish,
user-facing message — the frontend relies on `.message` directly rather than
re-mapping codes (`src/components/DispatchForm.tsx`,
`src/pages/AdminUsersPage.tsx`).

## Configuration

`setGlobalOptions({ region: 'us-east1' })` applies to all three functions —
chosen, per a code comment, as the closest Cloud Functions v2 region to
Colombia.

## Evidence

- `functions/src/index.ts`

## Risks

- `syncUserRoleClaim`'s `.catch(() => undefined)` on `auth.updateUser`
  silently swallows failures to disable/enable a user — a failed disable
  would not surface anywhere.

## Related decisions

- [Dispatch goes through a Cloud Function, never direct writes](../decisions/dispatch-via-cloud-function.md)
- [Roles live in both Firestore and Auth custom claims](../decisions/dual-role-storage.md)

## Related links

- [Firestore rules and roles](../security/firestore-rules-and-roles.md)
