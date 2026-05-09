# Durak Backend (NestJS + Socket.IO)

NestJS 10 service that owns **all** game logic. Mobile client only renders state.

## Run

```bash
npm run dev:backend          # nest start --watch on :3000
npm run start:backend        # production (after `npm run build:backend`)
curl localhost:3000/health   # liveness
```

Env: `apps/backend/.env` (copy from `.env.example`). For game-only mode skip Postgres entirely — `DB_*` vars are only consumed by the player module.

## Module map

```
src/
├── main.ts                 # bootstrap, CORS, global pipes
├── app.module.ts           # wires everything together
├── health.controller.ts    # GET /health
├── auth/                   # REST stub (currently no real auth)
├── config/                 # @nestjs/config schema
├── player/                 # PlayerService + TypeORM Player entity (Postgres)
├── room/                   # RoomService — lobby + room lifecycle (in-memory)
├── game/
│   ├── game.engine.ts      # PURE rule functions; throws GameRuleError
│   ├── game.service.ts     # State manager per room (in-memory Map<roomId, state>)
│   ├── deck.service.ts     # Shuffled-deck factory
│   └── game.types.ts       # Internal-only types (full hands, deck, etc.)
└── gateways/
    └── game.gateway.ts     # @WebSocketGateway — socket entrypoint
```

## State lives in memory

`RoomService` and `GameService` keep state in plain Maps. **A backend restart drops all in-progress games.** That's intentional for this stage; for production consider Redis-backed state (not yet implemented).

Postgres is only used for player profile persistence (`Player` entity in `player/`). The game itself never touches the DB.

## Adding a new socket event — the 4-place dance

Whenever you add or change a real-time event:

1. **`packages/shared/src/events.ts`** — add the constant in `SOCKET_EVENTS`, the payload interface, and entries in `ClientToServerEvents` / `ServerToClientEvents`.
2. **`packages/shared/`** — `npm run build:shared` (or run watch mode).
3. **`apps/backend/src/gateways/game.gateway.ts`** — add `@SubscribeMessage(SOCKET_EVENTS.X)` handler. Always `return ok(...)` / `return fail(code, msg)` shaped as `AckResult<T>`.
4. **`apps/mobile/src/screens/...`** — emit via `emitAck(SOCKET_EVENTS.X, payload)`.

After (1) the typecheck on (3) and (4) will fail until both sides match — that's the safety net. Don't bypass it.

## GameEngine pattern

Pure functions, no NestJS. Each rule mutator (`playCard`, `defendCard`, `endTurn`, …) takes a `GameStateInternal`, returns a new state, throws `GameRuleError(code, message)` on rule violations. The gateway catches `GameRuleError` and converts it to an `AckResult` with the matching `ErrorCode` from `@durak/shared`.

**Never** put rule checks anywhere else (gateway, service, …). All rules → `game.engine.ts`. This keeps the rules unit-testable and the rest of the code dumb plumbing.

## Russian Durak quirks worth knowing

- `MAX_TABLE_PAIRS = 6` — defender can never face more than 6 simultaneous attacks.
- `REDIRECT_ATTACK` ("Weiterschieben") = defender plays a same-rank card before defending → next player becomes defender. Only legal when nothing on the table is yet defended.
- Trump suit beats any non-trump regardless of rank.
- `RANK_ORDER` from `@durak/shared/cards.ts` is the only source of truth for card values (6 < 7 < … < J < Q < K < A).
- The "Durak" (loser) is whoever ends up with cards when all others are empty AND the deck is empty.

## Disconnect handling

Sockets that drop are kept in their room for `RECONNECT_GRACE_MS = 30_000` (see `game.gateway.ts:41`). After that the player is removed and their cards go to discard. If you change this, also update mobile's reconnection retry budget.

## Testing

Jest unit tests live next to source files as `*.spec.ts`. The engine
spec in `src/game/game.engine.spec.ts` covers all rule mutators
(playAttack, playDefense, redirectAttack, endTurn / Bito confirmation,
takeCards, pendingConfirmationIds) plus the lowest-trump first-attacker
rule. Builders in `src/game/_test-helpers.ts` (`c('7s')`, `player(i,
{hand:[...]})`, `state({...})`) keep tests AAA-clean.

```bash
npm run test --workspace @durak/backend         # all engine specs
npm run test --workspace @durak/backend -- -t "Bito"  # single test
npm run test:watch --workspace @durak/backend   # watch mode
```

Conventions (AAA pattern, what to test / what not) are in
`.claude/skills/testing/SKILL.md`.

NestJS gateway/controller wiring is intentionally NOT unit-tested —
covered by the bot smoke test (`npm run bot -- TestBot --host-room`)
end-to-end.
