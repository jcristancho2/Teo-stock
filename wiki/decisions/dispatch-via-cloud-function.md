---
id: dispatch-via-cloud-function
title: Stock dispatch goes through a Cloud Function, never direct writes
type: decision
status: accepted
created: 2026-10-22
updated: 2026-10-22
last_verified_commit: n/a (no git repository initialized)
owners:
  - wiki-maintainer
tags: [decision, security, concurrency]
aliases: []
sources:
  - README.md
code_references:
  - functions/src/index.ts#registrarDespacho
  - firestore.rules
related:
  - ../modules/cloud-functions.md
  - ../architecture/data-flow.md
---

## Context

Multiple commercial users can try to dispatch the same reference at nearly
the same time. A naive client-side read-then-write (`get` the quantity,
subtract, `set`) has a race: two simultaneous dispatches can both read the
same starting quantity and overwrite each other, double-counting stock.

## Problem

Guarantee that concurrent dispatches against the same reference can never
leave `cantidadDisponible` wrong, without building a separate backend
server.

## Options considered

1. Client writes directly to Firestore with an optimistic-lock field —
   rejected: still requires trusting the client to retry correctly, and
   Firestore security rules can't express "decrement by exactly X and never
   go negative" as cleanly as server code can.
2. Firestore transaction run from the client SDK — rejected: the client
   would still need write access to `stock`/`movimientos`, which also means
   a buggy or malicious client could write arbitrary values.
3. **Cloud Function (`registrarDespacho`) running a Firestore
   `runTransaction` with the Admin SDK, with direct client writes to
   `stock`/`movimientos` blocked by `firestore.rules`.** Chosen.

## Decision

All stock decrements go through `registrarDespacho`
(`functions/src/index.ts`), which re-reads the stock doc inside a
transaction, validates it (`por_verificar`, non-finite/negative, exceeds
available), decrements, and writes the `movimientos` record — atomically.
`firestore.rules` makes `stock` `update`/`delete` and `movimientos`
`create`/`update`/`delete` unconditionally `false` for every client, so this
is the *only* path, not just the intended one.

## Consequences

- Makes concurrent dispatches safe by construction — no client-side retry
  logic needed.
- Makes every dispatch auditable (one `movimientos` doc per transaction,
  with before/after quantities and actor identity).
- Adds one network hop (Cloud Function invocation) vs. a direct Firestore
  write, and ties dispatch latency to Cloud Functions cold starts.
- Any future bulk-dispatch or offline-dispatch feature must also go through
  this function or an equivalent — it cannot be bypassed by writing to
  Firestore directly, even by the admin role.

## Evidence

- `functions/src/index.ts#registrarDespacho`
- `firestore.rules` (`stock` and `movimientos` match blocks)
- `README.md` ("El descuento de stock nunca se escribe directo desde el navegador")

## Status history

- No prior decision superseded; this is the original design captured at
  bootstrap time from README + code, not from a recorded decision log.
