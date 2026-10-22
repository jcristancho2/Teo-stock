---
id: firestore-rules-and-roles
title: Firestore rules and role model
type: security
status: current
created: 2026-10-22
updated: 2026-10-22
last_verified_commit: n/a (no git repository initialized)
owners:
  - wiki-maintainer
tags:
  - security
  - firestore
  - auth
sources: []
code_references:
  - firestore.rules
  - functions/src/index.ts#syncUserRoleClaim
related:
  - ../data/data-model.md
  - ../modules/cloud-functions.md
  - ../decisions/dispatch-via-cloud-function.md
  - ../decisions/dual-role-storage.md
---

## Summary

Two roles (`admin`, `comercial`), read from the Auth custom claim
`request.auth.token.role` inside Firestore rules — never from the Firestore
`users` document directly (rules can't trust client-controlled document
content for authorization).

## How it works

`firestore.rules` defines three helper functions: `estaAutenticado()`,
`esAdmin()` (`role == 'admin'`), `esComercialOAdmin()` (`role in
['comercial','admin']`). Per collection:

| Collection | read | create | update/delete |
|---|---|---|---|
| `users/{userId}` | own doc or admin | admin only | admin only (write rule covers all) |
| `stock/{ref}` | comercial or admin | admin only | **blocked for everyone** (`false`) |
| `excelUploads/{id}` | comercial or admin | admin only | **blocked for everyone** |
| `movimientos/{id}` | comercial or admin | **blocked for everyone** | **blocked for everyone** |
| `config/{doc}` | admin only | — | admin only |

The comments in `firestore.rules` state explicitly *why* `stock` update and
`movimientos` create are both `false`: the only legitimate writer is the
Cloud Functions Admin SDK (`registrarDespacho`), which is not subject to
these rules at all — blocking the client path is what makes that guarantee
hold.

## Why claims, not the Firestore document

> [!INFERENCE]
> Firestore security rules can read `request.auth.token.*` (the ID token's
> custom claims) but cannot safely read another document's content as an
> authorization source without an extra `get()` call per request (cost and
> staleness). Using the custom claim avoids both. This project keeps the
> claim and the Firestore `users/{uid}.rol` field in sync via
> `syncUserRoleClaim` specifically so the rules can trust the claim. See
> [Roles live in both Firestore and Auth custom claims](../decisions/dual-role-storage.md).

## Evidence

- `firestore.rules`
- `functions/src/index.ts#syncUserRoleClaim`

## Risks

- If `syncUserRoleClaim` fails silently (e.g. the swallowed
  `auth.updateUser` catch, see [Cloud Functions](../modules/cloud-functions.md#risks)),
  the Auth claim and the Firestore profile can drift out of sync, and the
  claim — not the Firestore doc — is what the rules actually enforce.

## Related links

- [Data model](../data/data-model.md)
- [Cloud Functions](../modules/cloud-functions.md)
