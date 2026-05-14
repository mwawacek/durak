# Backend Notes (Refactor: mobile → web)

This file collects backend findings encountered during the mobile → web refactor. The constraint is **no backend changes** — bugs and friction points are logged here for later, not fixed now.

## Findings so far

_(none yet — backend audit during Phase 1 found `enableCors({ origin: '*' })` in `main.ts` and a `@WebSocketGateway({ cors: { origin: '*', credentials: true } })` in `game.gateway.ts`, which is exactly what the new web client needs. No friction.)_

## 2026-05-15 — NestJS 10 → 11 upgrade

Bumped all `@nestjs/*` packages from the 10.x line to 11.x:
- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`,
  `@nestjs/platform-socket.io`, `@nestjs/websockets` → ^11.1
- `@nestjs/typeorm` → ^11.0
- `@nestjs/config` → ^4.0 (NestJS 11 ecosystem peer)
- `@nestjs/cli`, `@nestjs/schematics` (dev) → ^11.0

Rationale: the high-severity Multer DoS advisories
(`GHSA-xf7r-hgr6-v32p`, `GHSA-v52c-386h-88mc`, `GHSA-5528-5vmv-3xc2`)
required `multer >= 2.0`, which `@nestjs/platform-express` 10.x pinned to
1.x. After upgrade `multer@2.1.1` is in the tree and the three
high-severity advisories are gone.

No source-code changes were necessary — the backend doesn't use any APIs
removed in NestJS 11 (no `HttpModule`, no microservices transport, no
`Multer` file-upload endpoints, no `PartialType` from `@nestjs/mapped-types`).

Quality gates: `npm run typecheck`, `npm run lint`, `npm run test`,
`npm run build:backend`, `npm run build:web` all green. Smoke test:
backend boots, `GET /health` → 200, bot connects, joins lobby, hosts
room — full socket cycle works.

Remaining audit findings after `npm audit fix`:
- 2 moderate (esbuild via Vite, dev-server-only). Fix needs Vite 6 major
  upgrade — deferred.
