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

## 2026-05-15 — code-review deferred follow-ups

Identified during the 2026-05-15 full-codebase review but skipped to keep
this PR atomic. None are urgent.

1. **Class-validator DTOs for socket payloads.** Every `@MessageBody()`
   in `apps/backend/src/gateways/game.gateway.ts` is typed as a TS
   interface (`JoinLobbyPayload`, `CreateRoomPayload`, …). The global
   `ValidationPipe({whitelist, forbidNonWhitelisted, transform})` in
   `main.ts` is configured but does nothing at runtime because TS
   interfaces erase. Only the ad-hoc `requireRoomId` / `requireCard`
   helpers (gateway:382-403) catch malformed input. Convert each payload
   shape to a class in `apps/backend/src/gateways/dto/` with
   class-validator decorators (`@IsString`, `@IsUUID`, `@ValidateNested`,
   `@Type(() => CardDto)`); reference them from `@MessageBody`; delete
   the bespoke require-helpers afterwards.

2. **`commitTake` reuse in `takeCards`.** `game.engine.ts:155-164` and
   the exported `takeCards` (`:432-450`) both push attack+defense into
   the defender's hand, clear the table, refill, and rotate. Wrap
   `takeCards` around `commitTake` so the two paths can't drift.

3. **Extract `eligibleAttackerIndices`.** `computePendingIndices`
   (engine:84-100) and `pileOnCapableIndices` (engine:128-141) share the
   exact iteration: skip-confirmed, skip-finished, has-pile-on-card. Only
   the up-front `tableFullyDefended` guard differs. Extract the common
   loop into a private `eligibleAttackerIndices(s): Set<number>`.

4. **`setConnected(state, playerId, isConnected: boolean)`.** Today
   `markDisconnected` and `markConnected` (engine:523-535) are mirror
   functions differing by one boolean.

5. **`afterGameMutation` gateway helper.** The five gameplay handlers in
   the gateway share the `broadcastGameState` + `emitRoundStarted` +
   `maybeFinishGame` post-mutation flow. A single
   `private afterGameMutation(roomId, state, { roundStarted })` helper
   would centralise the contract.

6. **Move `RECONNECT_GRACE_MS` (and `SOCKET_ACK_TIMEOUT_MS`) into
   `@durak/shared`.** Today they live in `game.gateway.ts` and
   `apps/web/src/services/socket.ts` / `tools/bot.mjs` respectively with
   independent values. Moving them to shared lets engine, web, and bot
   agree.
