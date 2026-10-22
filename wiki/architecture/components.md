---
id: components
title: Component inventory
type: architecture
status: current
created: 2026-10-22
updated: 2026-10-22
last_verified_commit: n/a (no git repository initialized)
owners:
  - wiki-maintainer
tags:
  - architecture
  - frontend
sources: []
code_references:
  - src/App.tsx
  - src/components
  - src/pages
  - functions/src/index.ts
related:
  - system-context.md
  - data-flow.md
  - ../modules/frontend-routing-auth.md
  - ../modules/stock-dispatch-ui.md
  - ../modules/excel-upload.md
  - ../modules/user-management.md
  - ../modules/cloud-functions.md
---

## Summary

Full inventory of frontend components/pages and backend Cloud Functions, with
line counts and responsibility, as found at bootstrap time.

## Routing shell

- `src/App.tsx` — top-level `<Routes>`, wraps everything in `AuthProvider`,
  redirects `/` based on `perfil.rol` (admin → `/admin`, comercial →
  `/comercial/stock`).
- `src/components/Layout.tsx` (13 lines) — shell with `Navbar` + `<Outlet />`.
- `src/components/Navbar.tsx` (44 lines) — role-aware nav links + sign out.
- `src/components/RoleRoute.tsx` (42 lines) — route guard: redirects to
  `/login` if unauthenticated, shows "no profile" / "disabled" messages, or
  redirects to `/` if role not allowed. See [Frontend routing & auth](../modules/frontend-routing-auth.md).
- `src/context/AuthContext.tsx` (71 lines) — `AuthProvider`/`useAuth`; listens
  to Firebase Auth state and live-subscribes to the user's own `users/{uid}`
  Firestore doc for role/active-status.

## Pages (`src/pages/`)

| Page | Lines | Role | Renders |
|---|---|---|---|
| `LoginPage.tsx` | 73 | public | email/password sign-in, maps Firebase auth error codes to Spanish messages |
| `AdminDashboardPage.tsx` | 70 | admin | summary: live stock snapshot + last Excel upload log |
| `AdminUploadPage.tsx` | 5 | admin | wraps `UploadExcelForm` |
| `AdminStockPage.tsx` | 5 | admin | wraps `StockTable` with `permiteDespacho` |
| `AdminHistoryPage.tsx` | 5 | admin | wraps `HistorialMovimientos` |
| `AdminUsersPage.tsx` | 126 | admin | user list + create-user form, calls `crearUsuario` |
| `ComercialStockPage.tsx` | 5 | comercial+admin | wraps `StockTable` |
| `ComercialHistoryPage.tsx` | 5 | comercial+admin | wraps `HistorialMovimientos` |

> [!INFERENCE]
> Admin and Comercial stock/history pages render the exact same shared
> component (`StockTable`, `HistorialMovimientos`) — the split exists purely
> for route-guard granularity in `src/App.tsx`, not for different UI.

## Shared components (`src/components/`)

- `StockTable.tsx` (108 lines) — live `onSnapshot` query on `stock` ordered
  by `producto`, client-side search filter, opens `DispatchForm` per row.
  See [Stock & dispatch UI](../modules/stock-dispatch-ui.md).
- `DispatchForm.tsx` (102 lines) — calls the `registrarDespacho` Cloud
  Function via `httpsCallable`.
- `HistorialMovimientos.tsx` (60 lines) — live `onSnapshot` on `movimientos`,
  ordered by date, limited.
- `UploadExcelForm.tsx` (239 lines) — the largest component: file read →
  column-mapping confirmation → row validation → Firestore batch write. See
  [Excel upload](../modules/excel-upload.md).

## Cloud Functions (`functions/src/index.ts`)

- `registrarDespacho` (onCall) — the only legal path to decrement
  `cantidadDisponible`; runs inside a Firestore transaction.
- `crearUsuario` (onCall) — admin-only; creates the Auth user + Firestore
  profile + sets the `role` custom claim.
- `syncUserRoleClaim` (onDocumentWritten on `users/{uid}`) — keeps the Auth
  custom claim (`role`) and `disabled` state in sync whenever the Firestore
  `users/{uid}` document changes.

See [Cloud Functions](../modules/cloud-functions.md) for the trust-boundary
rationale.

## Utilities (`src/utils/`)

- `excelParser.ts` — `leerExcel` (reads the file via `xlsx`), `sugerirMapeo`
  (keyword-based column-mapping guesser).
- `validarFila.ts` — `validarCantidad` (never invents a number for bad
  input), `normalizarReferencia` (stable Firestore doc id from a raw
  reference string).
- `interpretarDisponibilidad.ts` — maps a `StockItem` to the user-facing
  availability message (`disponible` / `sin_stock` / `por_verificar`).

## Evidence

- `src/App.tsx`
- `src/pages/*.tsx` (line counts from direct read at bootstrap time)
- `src/components/*.tsx`
- `functions/src/index.ts`

## Related links

- [Data flow](data-flow.md)
- [Data model](../data/data-model.md)
