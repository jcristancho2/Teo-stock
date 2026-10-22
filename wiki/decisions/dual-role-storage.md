---
id: dual-role-storage
title: Roles live in both Firestore and Auth custom claims, kept in sync
type: decision
status: accepted
created: 2026-10-22
updated: 2026-10-22
last_verified_commit: n/a (no git repository initialized)
owners:
  - wiki-maintainer
tags: [decision, security, auth]
aliases: []
sources:
  - README.md
code_references:
  - functions/src/index.ts#syncUserRoleClaim
  - firestore.rules
related:
  - ../security/firestore-rules-and-roles.md
  - ../modules/user-management.md
---

## Context

The app needs to (a) display and let an admin easily edit a user's role in
the UI, and (b) let Firestore security rules and Cloud Functions check that
role on every request without an extra read.

## Problem

A single source of truth for role would force a choice: either Firestore
rules need an extra `get()` per request to check the role document (cost +
latency + staleness), or the UI loses an easy, queryable, editable
representation of users and their roles.

## Options considered

1. Role only in Auth custom claims — rejected: custom claims aren't easily
   listable/queryable/editable from a simple Firestore-backed admin UI.
2. Role only in a Firestore `users` document, checked via `get()` inside
   every rule — rejected: extra read cost and latency on every rule
   evaluation; also not usable from Firestore rules without that read.
3. **Both, kept in sync by a Cloud Function trigger.** Chosen.

## Decision

`users/{uid}.rol` is the editable, queryable source the UI uses. Every
write to that document fires `syncUserRoleClaim`
(`onDocumentWritten('users/{uid}')`), which sets the Auth custom claim
`role` to match, and disables/enables the Auth account based on `activo`.
Firestore rules and Cloud Functions (`registrarDespacho`, `crearUsuario`)
read `request.auth.token.role` / `request.auth.token.role` — the claim, not
the document — as the actual authorization source.

## Consequences

- UI stays simple (edit a Firestore document) while authorization checks
  stay cheap (read the token, no extra `get()`).
- Introduces a sync lag: a role/activo change only takes effect in rules
  once the trigger runs and the user's ID token is refreshed (Firebase
  clients normally refresh tokens periodically or on next sign-in).
- Introduces a drift risk if the trigger fails silently — see
  [Firestore rules and roles § Risks](../security/firestore-rules-and-roles.md#risks).

## Evidence

- `functions/src/index.ts#syncUserRoleClaim`
- `firestore.rules` (`esAdmin()`, `esComercialOAdmin()` read `request.auth.token.role`)
- `README.md` ("Los roles viven en dos lugares sincronizados")

## Status history

- No prior decision superseded; captured at bootstrap time from README +
  code.
