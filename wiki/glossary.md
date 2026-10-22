---
id: glossary
title: Glossary
type: glossary
status: current
created: 2026-10-22
updated: 2026-10-22
last_verified_commit: n/a (no git repository initialized)
owners:
  - wiki-maintainer
tags:
  - glossary
sources:
  - src/types/index.ts
code_references: []
related:
  - data/data-model.md
---

## Summary

Spanish business terms used throughout the codebase (types, variables,
UI text), as noted in `src/types/index.ts`: "los nombres siguen los
términos del negocio ... tal como los usa el equipo comercial de Extrucol."

## Terms

- **Referencia** — the SKU/product code; normalized (uppercase, trimmed)
  via `normalizarReferencia` to form the Firestore `stock` document id.
- **Producto** — the product's human-readable description/name.
- **Bodega** — warehouse/storage location.
- **Disponible / cantidadDisponible** — the quantity currently available to
  dispatch for a reference.
- **Despacho / despachar** — to dispatch: separate units for a customer,
  decrementing `cantidadDisponible` via `registrarDespacho`.
- **Por verificar** — "to be verified": the trust state a `stock` row gets
  when its source Excel value was empty, non-numeric, or negative; cannot
  be dispatched until the next Excel upload replaces it.
- **Movimiento** — a dispatch record in the `movimientos` collection
  (before/after quantity, actor, client, note, timestamp).
- **Comercial** — the sales-team role; can view stock and dispatch, cannot
  upload Excel or manage users.
- **Admin** — the administrator role; can do everything comercial can, plus
  upload Excel and manage users.

## Evidence

- `src/types/index.ts`
- `src/utils/validarFila.ts`
- `src/utils/interpretarDisponibilidad.ts`

## Related links

- [Data model](data/data-model.md)
