---
id: data-flow
title: Data flow — Excel upload and dispatch
type: architecture
status: current
created: 2026-10-22
updated: 2026-10-22
last_verified_commit: n/a (no git repository initialized)
owners:
  - wiki-maintainer
tags:
  - architecture
  - data-flow
sources: []
code_references:
  - src/components/UploadExcelForm.tsx
  - src/utils/excelParser.ts
  - src/utils/validarFila.ts
  - functions/src/index.ts#registrarDespacho
related:
  - components.md
  - ../modules/excel-upload.md
  - ../modules/cloud-functions.md
  - ../data/data-model.md
  - ../decisions/dispatch-via-cloud-function.md
---

## Summary

Two main flows: (1) admin loads the daily Excel into Firestore `stock`, and
(2) a commercial user dispatches units, which must go through a server-side
transaction.

## Main flow — Excel upload

1. Admin picks a file → `leerExcel` (`src/utils/excelParser.ts`) reads sheet 1
   via `xlsx`, returns headers + rows as objects.
2. First upload only: `sugerirMapeo` guesses which header is which field by
   keyword match; admin confirms/corrects the mapping
   (`src/components/UploadExcelForm.tsx`). The confirmed mapping is persisted
   to `config/excelMapping` in Firestore and reused on later uploads.
3. Each row → `normalizarReferencia` (stable uppercase id) +
   `validarCantidad` (`src/utils/validarFila.ts`). A bad value (empty,
   non-numeric, negative) is never coerced to a number — the row is marked
   `estado: 'por_verificar'` with a `motivoVerificar`.
4. All rows are written to Firestore `stock/{referencia}` in a batch
   (`writeBatch`, `src/components/UploadExcelForm.tsx`), and a summary row is
   written to `excelUploads` (filename, uploader, totals).

> [!NEEDS-VERIFICATION]
> The exact batching strategy (single `writeBatch` vs. chunked batches for
> large sheets) was not re-verified line-by-line against Firestore's 500-op
> batch limit during this bootstrap — worth checking if Extrucol's real
> export has more than ~500 distinct references.

## Main flow — Dispatch

1. Comercial (or admin) opens `DispatchForm` from a `StockTable` row and
   enters a quantity (+ optional client/note).
2. `DispatchForm` calls the `registrarDespacho` Cloud Function via
   `httpsCallable` — **never** writes to Firestore directly.
3. Server-side (`functions/src/index.ts#registrarDespacho`), inside a single
   `runTransaction`:
   - Reject if the reference doesn't exist, is `por_verificar`, or has a
     non-finite/negative `cantidadDisponible`.
   - Reject if the requested quantity exceeds what's available.
   - Otherwise: decrement `stock/{referencia}.cantidadDisponible` and create
     a `movimientos` document with before/after quantities, user, client,
     note, and server timestamp.
4. UI reflects the new quantity immediately via the live `onSnapshot`
   listener on `stock` (no manual refetch needed).

## Error flow

- Any failure (not-found, por_verificar, insufficient stock, bad input) is
  surfaced as an `HttpsError` with a Spanish, user-facing message
  (`functions/src/index.ts`), caught by `DispatchForm` and shown inline.
- Firestore security rules (`firestore.rules`) make `stock`/`movimientos`
  direct client writes impossible regardless of UI bugs — see
  [Firestore rules and roles](../security/firestore-rules-and-roles.md).

## Evidence

- `src/components/UploadExcelForm.tsx`
- `src/utils/excelParser.ts`
- `src/utils/validarFila.ts`
- `functions/src/index.ts#registrarDespacho`
- `firestore.rules`

## Related decisions

- [Dispatch goes through a Cloud Function, never direct writes](../decisions/dispatch-via-cloud-function.md)
- [Excel column mapping is configurable, not hardcoded](../decisions/configurable-excel-mapping.md)

## Related links

- [Data model](../data/data-model.md)
