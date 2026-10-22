---
id: overview
title: Teo — Disponibilidad de stock (Extrucol)
type: overview
status: current
created: 2026-10-22
updated: 2026-10-22
last_verified_commit: n/a (no git repository initialized)
owners:
  - wiki-maintainer
tags:
  - overview
  - inventory
  - firebase
aliases:
  - Teo stock app
sources:
  - README.md
code_references:
  - package.json
  - src/App.tsx
related:
  - architecture/system-context.md
  - architecture/components.md
  - data/data-model.md
  - security/firestore-rules-and-roles.md
---

## Summary

Teo is a small internal web app for Extrucol: the admin uploads a daily
Excel export of inventory, and the commercial team checks availability and
registers dispatches ("despachos") against it in real time, with the stock
decrement done server-side so concurrent dispatches never corrupt the count.

## Purpose

Replace "open the Excel from the system every time" with a live, shared
view of stock, while keeping the daily Excel as the ground-truth source of
availability (`README.md`).

## Responsibilities

- Daily Excel ingestion with configurable column mapping (`src/utils/excelParser.ts`, `src/components/UploadExcelForm.tsx`).
- Row-level validation that never invents numbers for bad data (`src/utils/validarFila.ts`).
- Real-time stock display and search (`src/components/StockTable.tsx`).
- Atomic, server-side stock dispatch with full audit trail (`functions/src/index.ts#registrarDespacho`).
- Role-based access (admin / comercial) enforced both in UI and in Firestore rules (`src/components/RoleRoute.tsx`, `firestore.rules`).
- User management (create admin/comercial accounts) (`src/pages/AdminUsersPage.tsx`, `functions/src/index.ts#crearUsuario`).

## How it works

Frontend: React 18 + TypeScript + Vite, routed with `react-router-dom`
(`src/App.tsx`). All data access goes through the Firebase Web SDK
(`src/firebase/config.ts`): Firestore for reads/listeners, Firebase Auth for
sessions, Cloud Functions (`httpsCallable`) for the two mutations that must
be trusted (dispatch, user creation).

Backend: Firebase project with Firestore, Auth, and 3 Cloud Functions v2
(`functions/src/index.ts`), deployed via `firebase.json`. No custom server;
Firestore security rules (`firestore.rules`) are the authorization layer for
direct reads/writes, and the Admin SDK inside Cloud Functions is the only
path allowed to mutate `stock` and `movimientos`.

## Components involved

See [Component inventory](architecture/components.md) for the full map.

## Dependencies

- Runtime: `react` ^18.3.1, `react-dom` ^18.3.1, `react-router-dom` ^6.27.0, `firebase` ^11.0.2 (client SDK), `xlsx` ^0.18.5 (`package.json`).
- Build: `vite` ^5.4.10, `@vitejs/plugin-react` ^4.3.3, `typescript` ^5.6.3 (`package.json`).
- Cloud Functions package (`functions/package.json`): `firebase-admin`, `firebase-functions` (v2 API, confirmed by `onCall`/`onDocumentWritten`/`setGlobalOptions` imports in `functions/src/index.ts`).
- One-off admin bootstrap script with its own `scripts/package.json` (`scripts/setFirstAdmin.cjs`).

## Configuration

Frontend Firebase config comes entirely from Vite env vars
(`VITE_FIREBASE_*`, see `.env.example` and `src/firebase/config.ts`) — never
hardcoded, so the same build works against any Firebase project.

## Evidence

- `README.md`
- `package.json`
- `src/App.tsx`
- `functions/src/index.ts`
- `firestore.rules`

## Risks

- There is no automated test suite in this repository as of this bootstrap
  (no test runner dependency in `package.json`, no `*.test.*` files found).
- README itself flags the Excel column mapping as unverified against a real
  Extrucol export (`README.md`, "Pendiente para afinar con datos reales").

## Open questions

> [!NEEDS-VERIFICATION]
> Whether a real Extrucol Excel export has been run through the mapping
> suggestion (`sugerirMapeo` in `src/utils/excelParser.ts`) and confirmed
> correct — README marks this as still pending.

## Related links

- [System context](architecture/system-context.md)
- [Component inventory](architecture/components.md)
- [Data flow: Excel upload → dispatch](architecture/data-flow.md)
- [Data model](data/data-model.md)
- [Firestore rules and roles](security/firestore-rules-and-roles.md)
- [Local development](operations/local-development.md)
- [Deployment runbook](operations/deployment-runbook.md)
