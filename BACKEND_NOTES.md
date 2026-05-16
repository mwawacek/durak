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

## 2026-05-16 — deferred follow-ups landed

All six items from the 2026-05-15 deferred list shipped today. Plan was
written to `docs/superpowers/plans/2026-05-16-backend-deferred-cleanups.md`
and executed task-by-task with a subagent per task.

| # | Item | Commit |
|---|---|---|
| 1 | `SOCKET_ACK_TIMEOUT_MS` in `@durak/shared`, consumed by web + bot | `1ff6cc2` |
| 2 | `setConnected` helper folds `markDisconnected` / `markConnected` | `96d41c4` |
| 3 | `eligibleAttackerIndices` shared between pending + pileOnCapable | `459e14a` |
| 4 | `takeCards` delegates to `commitTake` (no drift) | `9868881` |
| 5 | `afterGameMutation` unifies gateway post-mutation broadcasts | `3a1077d` |
| 6 | Class-validator DTOs validate every socket payload at runtime | `6bc94b4` |

Notes on Task 6 (DTOs):
- A naive "swap interface for class on `@MessageBody`" doesn't work in
  NestJS 11's WS context: the global `ValidationPipe`'s
  `BadRequestException` gets caught by `WsProxy` and routed to the
  exception filter, which emits an `exception` event but never fires the
  ack. The client times out instead of getting a structured error.
- Fix: gateway now calls `this.validate(Dto, raw)` inside each `tryAck`
  block. The pipe runs synchronously, throws on bad input, and the
  resulting `BadRequestException` is converted to a `GameRuleError`
  (`ERROR_CODES.INVALID_PAYLOAD`) before reaching `toAckError`. Bad
  payloads now ack with `{ ok: false, error: { code, message } }`.
- `main.ts` keeps `app.useGlobalPipes(new ValidationPipe(...))` — still
  useful for future HTTP routes; not load-bearing for the gateway.

Notes on Task 6 (cont.):
- `RECONNECT_GRACE_MS` was not moved to shared because no consumer
  outside the gateway needs it; the web client has its own
  reconnection-attempt budget on `socket.io-client`. Keeping
  workspace-local.

Remaining open items (lower-priority polish, not blocking):
- Landscape "rotate device" hint (web).
- iPad max-width container (web).
- iOS visualViewport keyboard handling (web).
- ConnectionBadge "retry" button after N failed reconnects (web).
- Cross-package symbol moves (`RANK_LABEL`, `SUIT_NAME_DE`,
  `SUIT_GLYPH`) — debatable, low value while only the web renders cards.

Remaining `npm audit` findings: 2 moderate, both `esbuild` via Vite
(dev-server-only). Fix requires Vite 6 major — still deferred.
