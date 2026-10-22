---
id: frontend-routing-auth
title: Frontend routing and auth
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
  - auth
sources: []
code_references:
  - src/App.tsx
  - src/context/AuthContext.tsx
  - src/components/RoleRoute.tsx
related:
  - ../architecture/components.md
  - ../security/firestore-rules-and-roles.md
---

## Summary

`AuthProvider` tracks Firebase Auth session + a live Firestore profile
document; `RoleRoute` gates every protected route on both.

## Responsibilities

- `src/context/AuthContext.tsx`: exposes `usuarioAuth` (Firebase `User`),
  `perfil` (`UsuarioPerfil` from Firestore `users/{uid}`), `cargando` (auth
  state still resolving), `cargandoPerfil` (profile doc still loading),
  `cerrarSesion`.
- `src/components/RoleRoute.tsx`: given `roles: Rol[]`, renders a loading
  state, redirects unauthenticated users to `/login`, shows a "no profile"
  or "account disabled" message when applicable, redirects to `/` if the
  user's role isn't in `roles`, otherwise renders `children`.
- `src/App.tsx`: defines the route tree and which `roles` each route
  requires; `Inicio` redirects `/` based on `perfil.rol`.

## How it works

The profile is **not** read once — `AuthContext` keeps a live `onSnapshot`
subscription on `users/{uid}` so a role change or deactivation by an admin
propagates to the signed-in user without a page reload
(`src/context/AuthContext.tsx`, comment: "si el admin cambia un rol o
desactiva a alguien, se refleje sin recargar").

## Dependencies

- Firebase Auth (`onAuthStateChanged`, `signOut`).
- Firestore (`onSnapshot` on `users/{uid}`).
- `src/types/index.ts#UsuarioPerfil`, `#Rol`.

## Evidence

- `src/context/AuthContext.tsx`
- `src/components/RoleRoute.tsx`
- `src/App.tsx`

## Risks

- `useAuth()` throws if called outside `AuthProvider` (by design — fail
  fast) — `src/context/AuthContext.tsx`.

## Related links

- [Firestore rules and roles](../security/firestore-rules-and-roles.md)
