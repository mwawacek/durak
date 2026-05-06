# Durak — Online Multiplayer

Russian card game **Durak**, online multiplayer. NestJS backend + React Native (Expo) mobile client, sharing TypeScript contracts.

## The one rule that matters

**All game logic lives in `apps/backend`.** The mobile client only renders state and forwards user intents over Socket.IO. Never re-implement rule checks on the client (anti-cheat). When in doubt: ask the server.

## Repo layout (npm workspaces)

```
apps/
├── backend/      # NestJS 10 + Socket.IO gateway, in-memory game state
└── mobile/       # Expo SDK 54 + React Native client
packages/
└── shared/       # Card, GameState, SocketEvents — typed contracts
tools/
└── bot.mjs       # CLI bot opponent for solo testing
docs/superpowers/ # Specs and implementation plans (brainstorming output)
```

Each app has its own `CLAUDE.md` with stack-specific notes — read those when working in that subtree.

## Daily commands

```bash
# Bootstrap (once)
npm install
npm run build:shared      # MUST run before backend/mobile typecheck

# Development (separate terminals)
npm run dev:backend       # NestJS on :3000
npm run dev:mobile        # Expo Metro bundler

# Solo testing — bot opponent (Durak needs ≥ 2 players)
npm run bot -- TestBot --host-room   # Bot hosts; you join from the app
npm run bot -- TestBot               # Bot joins your existing room

# Full stack incl. Postgres (optional — game state is in-memory anyway)
npm run docker:up
npm run docker:logs
npm run docker:down

# Sanity
npm run typecheck         # All workspaces
```

## Key gotcha: shared must be built first

`@durak/shared` is consumed as a workspace dep with a real `dist/` build (not just TS source). After editing `packages/shared/`:

```bash
npm run build:shared       # Or: npm run dev:shared (watch mode)
```

Otherwise `npm run typecheck` may pass while runtime fails on missing `dist/`.

## Architecture in one paragraph

Mobile establishes a Socket.IO connection to the backend on app start (LobbyScreen → `services/socket.ts`). All gameplay flows through ack-based events defined in `packages/shared/src/events.ts`. The backend `GameGateway` (`apps/backend/src/gateways/game.gateway.ts`) validates payloads, calls `GameEngine` pure functions, and broadcasts `GAME_STATE_UPDATE` to room members. Game state is in-memory per `RoomService`. Postgres (TypeORM) only persists player profiles — never game state.

## Testing approach

No automated tests yet. Verify changes by:
1. `npm run typecheck` (catches contract drift between shared/backend/mobile)
2. Run backend + bot + mobile, play a round to "Durak!" alert.

When adding socket events: change `packages/shared/src/events.ts` first, then both consumers will fail typecheck until updated. That's the feature — embrace it.

## Where to look first

| Need to… | Open this |
|---|---|
| Add or change a socket event | `packages/shared/src/events.ts` |
| Change a game rule | `apps/backend/src/game/game.engine.ts` |
| Change UI / theme | `apps/mobile/src/theme/colors.ts` and `src/components/` |
| Debug why a move was rejected | `apps/backend/src/game/game.engine.ts` (throws `GameRuleError` with `ErrorCode`) |
| Understand current visual design | `docs/superpowers/specs/2026-05-06-durak-mobile-redesign-design.md` |

## Conventions

- TypeScript strict mode everywhere. No `any` without a comment explaining why.
- German user-facing strings in mobile (`"Du verteidigst"`, `"Bito"`). Code/comments in English.
- Commit style: `feat(scope): …`, `fix(scope): …`, `docs(scope): …`. Scope = `backend`, `mobile`, `shared`, or `repo`.
- The repo is a monorepo by design (see this discussion in conversation history). Do **not** propose splitting into separate repos or migrating to Nx without an explicit reason that 3 packages can't solve.
