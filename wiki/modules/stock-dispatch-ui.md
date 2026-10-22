---
id: stock-dispatch-ui
title: Stock table and dispatch UI
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
sources: []
code_references:
  - src/components/StockTable.tsx
  - src/components/DispatchForm.tsx
  - src/components/HistorialMovimientos.tsx
  - src/utils/interpretarDisponibilidad.ts
related:
  - ../architecture/data-flow.md
  - ../modules/cloud-functions.md
  - ../data/data-model.md
---

## Summary

Shared, real-time UI used by both admin and comercial roles to see stock and
register dispatches; reused verbatim across `Admin*`/`Comercial*` page pairs.

## Responsibilities

- `StockTable.tsx` (108 lines): live `onSnapshot` query on `stock` ordered by
  `producto`; `useMemo`-filtered client-side search over reference/product;
  renders `interpretarDisponibilidad` message per row; opens `DispatchForm`
  for a selected item when `permiteDespacho` is true.
- `DispatchForm.tsx` (102 lines): quantity (+ optional client/note) form;
  calls `registrarDespacho` via `httpsCallable(functions, 'registrarDespacho')`
  and surfaces the function's `HttpsError.message` on failure.
- `HistorialMovimientos.tsx` (60 lines): live `onSnapshot` on `movimientos`,
  `orderBy` date, `limit`-bounded; formats Firestore timestamps with
  `toLocaleString('es-CO')`.

## How it works

All three components subscribe directly to Firestore collections with
`onSnapshot` — there is no intermediate state-management library (no Redux/
Zustand/TanStack Query dependency in `package.json`). Each component owns
its own `useState` + `useEffect` subscription lifecycle.

## Inputs and outputs

- `StockTable({ permiteDespacho: boolean })` — the only prop; both
  `Admin*StockPage` and `Comercial*StockPage` pass `permiteDespacho` (always
  true in current usage, per `src/pages/AdminStockPage.tsx` and
  `src/pages/ComercialStockPage.tsx`).
- `DispatchForm({ item, onCerrar, onDespachado })`.

## Evidence

- `src/components/StockTable.tsx`
- `src/components/DispatchForm.tsx`
- `src/components/HistorialMovimientos.tsx`
- `src/utils/interpretarDisponibilidad.ts`

## Open questions

> [!NEEDS-VERIFICATION]
> `permiteDespacho` is passed as `true` by every current caller
> (`src/pages/AdminStockPage.tsx`, `src/pages/ComercialStockPage.tsx`) — the
> prop exists but no current route actually sets it to `false`. Confirm
> whether a read-only stock view is still a planned use case.

## Related links

- [Data flow](../architecture/data-flow.md)
- [Cloud Functions](cloud-functions.md)
