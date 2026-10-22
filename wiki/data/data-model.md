---
id: data-model
title: Firestore data model
type: data
status: current
created: 2026-10-22
updated: 2026-10-22
last_verified_commit: n/a (no git repository initialized)
owners:
  - wiki-maintainer
tags:
  - data
  - firestore
sources: []
code_references:
  - src/types/index.ts
  - firestore.rules
related:
  - ../architecture/data-flow.md
  - ../security/firestore-rules-and-roles.md
---

## Summary

Five Firestore collections, all typed in `src/types/index.ts`. No other
datastore exists — Firestore is the single source of truth.

## Collections

### `users/{uid}`

`UsuarioPerfil`: `uid`, `email`, `nombre`, `rol: 'admin' | 'comercial'`,
`activo: boolean`, `creadoEn?`. Written by `crearUsuario` (create) and admin
edits (role/active changes); `syncUserRoleClaim` reacts to every write.

### `stock/{referencia}`

`StockItem`: doc id = normalized reference (`normalizarReferencia`).
`referencia`, `referenciaOriginal` (as it appeared in the Excel), `producto`,
`bodega`, `unidad`, `cantidadDisponible: number`, `estado: 'ok' |
'por_verificar'`, `motivoVerificar?`, `ultimaActualizacion?`,
`actualizadoPorExcelId?`. Created/overwritten only by the Excel upload
(`create` in `firestore.rules`); `update`/`delete` are blocked for every
client — the Admin SDK inside `registrarDespacho` is the only writer that
can change `cantidadDisponible` after creation.

### `movimientos/{autoId}`

`Movimiento`: `referencia`, `producto`, `cantidadDespachada`,
`cantidadAntes`, `cantidadDespues`, `usuarioUid`, `usuarioNombre`,
`cliente?`, `nota?`, `fecha?`. Written exclusively by `registrarDespacho`
inside its transaction — `firestore.rules` blocks `create`/`update`/`delete`
for every client.

### `excelUploads/{autoId}`

`ExcelUploadLog`: `nombreArchivo`, `subidoPorUid`, `subidoPorNombre`,
`fecha?`, `totalFilas`, `filasValidas`, `filasPorVerificar`. One doc per
upload, for traceability; read by `AdminDashboardPage` to show the last
upload.

### `config/excelMapping`

`MapeoColumnasExcel`: `referencia`, `producto`, `cantidadDisponible`,
`bodega?`, `unidad?` — the confirmed Excel→field column mapping, reused
across uploads. Admin-only read/write.

## Relationships

```
excelUploads ──(logs)──> stock (batch overwrite on each upload)
stock ──(read + transaction)──> movimientos (one movimiento per dispatch)
users ──(role/activo)──> Auth custom claims (via syncUserRoleClaim)
```

`stock` documents are **replaced wholesale** per reference on each upload,
not incrementally merged — the daily Excel is authoritative for everything
except the live decrements applied by dispatches since the last upload.

> [!NEEDS-VERIFICATION]
> Confirm whether an upload that omits a previously-known reference leaves
> the old `stock` doc untouched (stale) or whether any cleanup/zeroing logic
> exists — not found in `src/components/UploadExcelForm.tsx` during this
> bootstrap; appears to be upsert-only, no deletion of references absent
> from the new file.

## Evidence

- `src/types/index.ts`
- `firestore.rules`

## Related links

- [Firestore rules and roles](../security/firestore-rules-and-roles.md)
- [Excel upload](../modules/excel-upload.md)
