---
id: configurable-excel-mapping
title: Excel column mapping is configurable, not hardcoded
type: decision
status: accepted
created: 2026-10-22
updated: 2026-10-22
last_verified_commit: n/a (no git repository initialized)
owners:
  - wiki-maintainer
tags: [decision, data-ingestion]
aliases: []
sources:
  - README.md
code_references:
  - src/utils/excelParser.ts#sugerirMapeo
  - src/types/index.ts#MapeoColumnasExcel
related:
  - ../modules/excel-upload.md
  - ../architecture/data-flow.md
---

## Context

At build time, no real Extrucol Excel export was available to hardcode
exact column names/order against (`README.md`, "todavía no había un
ejemplo real del Excel de Extrucol al construir esto").

## Problem

The app needs to map arbitrary Excel column headers to the fixed fields
`StockItem` requires (referencia, producto, cantidadDisponible, bodega,
unidad) — without knowing the real header names in advance, and without
needing a code change if Extrucol's system later renames a column.

## Options considered

1. Hardcode expected column names/positions — rejected: no real sample to
   verify against, and brittle to any future rename on Extrucol's side.
2. **Admin confirms the mapping once (with a keyword-based auto-suggestion),
   the app remembers it in Firestore (`config/excelMapping`), and reuses it
   on every subsequent upload until the admin changes it.** Chosen.

## Decision

`sugerirMapeo` (`src/utils/excelParser.ts`) guesses each field from header
keywords (e.g. "disponible"/"stock"/"existencia" → `cantidadDisponible`).
The admin confirms or corrects this mapping on first upload; it is persisted
to the Firestore `config/excelMapping` document and reused on every later
upload without re-asking, per the `MapeoColumnasExcel` type
(`src/types/index.ts`).

## Consequences

- No code change needed if Extrucol renames a column — just re-confirm the
  mapping in the UI.
- First-ever upload requires a human to check the suggested mapping before
  trusting the data.
- The mapping quality is only as good as the keyword list in `PISTAS`
  (`src/utils/excelParser.ts`) — an unusual header naming convention could
  require a manual correction every time if it never matches a keyword.

## Evidence

- `src/utils/excelParser.ts#sugerirMapeo`, `#PISTAS`
- `src/types/index.ts#MapeoColumnasExcel`
- `README.md` ("El mapeo de columnas del Excel es configurable")

## Status history

- No prior decision superseded; captured at bootstrap time from README +
  code.
