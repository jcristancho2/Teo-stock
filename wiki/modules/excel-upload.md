---
id: excel-upload
title: Excel upload and column mapping
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
  - data-ingestion
sources: []
code_references:
  - src/components/UploadExcelForm.tsx
  - src/utils/excelParser.ts
  - src/utils/validarFila.ts
  - src/types/index.ts#MapeoColumnasExcel
related:
  - ../architecture/data-flow.md
  - ../decisions/configurable-excel-mapping.md
  - ../data/data-model.md
---

## Summary

The largest frontend component (239 lines): reads the admin's daily Excel,
confirms/remembers a column mapping, validates every row, and writes the
whole snapshot to Firestore in one batch.

## Responsibilities

- `UploadExcelForm.tsx`: orchestrates the whole flow — file pick, mapping
  confirmation (first time only, persisted to `config/excelMapping`), row
  validation, batch write to `stock`, and an `excelUploads` log entry.
- `excelParser.ts#leerExcel`: reads the file as an array buffer via
  `FileReader`, parses sheet 1 with the `xlsx` library, returns headers +
  rows as plain objects (`defval: ''` so missing cells become empty strings,
  not `undefined`).
- `excelParser.ts#sugerirMapeo`: keyword-based guesser
  (`PISTAS` record: referencia→codigo/sku/item/cod, producto→descripcion/
  nombre/articulo, cantidadDisponible→disponible/stock/existencia/saldo,
  bodega→almacen/deposito, unidad→um/medida) — a heuristic, not a guarantee.
- `validarFila.ts#validarCantidad`: never coerces bad data to a number —
  empty/non-numeric → `por_verificar` with `cantidad: 0`; negative →
  `por_verificar` but keeps the actual negative number for visibility.
- `validarFila.ts#normalizarReferencia`: uppercases, trims, collapses
  whitespace, and replaces Firestore-illegal id characters (`/\.#$[]`) with
  `-`, so the same physical reference always maps to the same Firestore
  document id across daily uploads.

## Main flow

See [Data flow — Excel upload](../architecture/data-flow.md#main-flow--excel-upload).

## Dependencies

- `xlsx` ^0.18.5 npm package.
- Firestore `writeBatch`, `doc`, `getDoc`, `setDoc`, `collection`,
  `serverTimestamp` (`src/components/UploadExcelForm.tsx` imports).

## Evidence

- `src/components/UploadExcelForm.tsx`
- `src/utils/excelParser.ts`
- `src/utils/validarFila.ts`
- `src/types/index.ts#MapeoColumnasExcel`

## Related decisions

- [Excel column mapping is configurable, not hardcoded](../decisions/configurable-excel-mapping.md)

## Related links

- [Data model](../data/data-model.md)
