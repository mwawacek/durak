# Durak — Online Multiplayer

Russian card game **Durak**, online multiplayer. NestJS backend + Vite/React mobile-first web client, sharing TypeScript contracts.

## The one rule that matters

**All game logic lives in `apps/backend`.** The mobile client only renders state and forwards user intents over Socket.IO. Never re-implement rule checks on the client (anti-cheat). When in doubt: ask the server.

## Repo layout (npm workspaces)

```
apps/
├── backend/      # NestJS 10 + Socket.IO gateway, in-memory game state
└── web/          # Vite + React 18 + TypeScript (mobile-first) client
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
npm run dev:backend       # NestJS on :3010
npm run dev:web           # Vite dev server on :5173

# Solo testing — bot opponent (Durak needs ≥ 2 players)
npm run bot -- TestBot --host-room   # Bot hosts; you join from the browser
npm run bot -- TestBot               # Bot joins your existing room

# Full stack incl. Postgres (optional — game state is in-memory anyway)
npm run docker:up
npm run docker:logs
npm run docker:down

# Sanity
npm run typecheck         # All workspaces
```

## Key gotcha: shared has two consumers

`@durak/shared` is consumed two ways:

1. **Backend + bot** → import from the compiled `dist/` (CommonJS). After editing `packages/shared/`:
   ```bash
   npm run build:shared       # Or: npm run dev:shared (watch mode)
   ```
2. **Web client** → Vite aliases `@durak/shared` directly to the TS source (`packages/shared/src/index.ts`). Tree-shaking + named imports work natively without a build step. Typecheck still resolves via the package's `types` field so contracts stay strict.

Both consumers see the same source of truth; only the build pipeline differs.

## Architecture in one paragraph

The web client establishes a Socket.IO connection to the backend on app start (`App.tsx` → `services/socket.ts`). All gameplay flows through ack-based events defined in `packages/shared/src/events.ts`. The backend `GameGateway` (`apps/backend/src/gateways/game.gateway.ts`) validates payloads, calls `GameEngine` pure functions, and broadcasts `GAME_STATE_UPDATE` to room members. Game state is in-memory per `RoomService`. Postgres (TypeORM) only persists player profiles — never game state.

## Testing approach

Jest unit tests live next to source as `*.spec.ts`. Conventions
(AAA pattern, builders, what to test) are in
`.claude/skills/testing/SKILL.md`. Rules reference is in
`.claude/skills/durak-rules/SKILL.md`.

```bash
npm run test                           # all workspaces (rebuilds shared first)
npm run test --workspace @durak/backend # engine + projection tests
npm run test --workspace @durak/shared  # rules / helpers tests
npm run typecheck                      # catches contract drift between shared/backend/mobile
```

In addition to tests, run a smoke game with the bot
(`npm run bot -- TestBot --host-room`) before shipping any
gameplay-affecting change.

When adding socket events: change `packages/shared/src/events.ts` first, then both consumers will fail typecheck until updated. That's the feature — embrace it.

## Where to look first

| Need to… | Open this |
|---|---|
| Add or change a socket event | `packages/shared/src/events.ts` |
| Change a game rule | `apps/backend/src/game/game.engine.ts` |
| Change UI / theme tokens | `apps/web/tailwind.config.ts` (Tailwind tokens) and `apps/web/src/theme/tokens.ts` (mirrors for inline SVG) |
| Debug why a move was rejected | `apps/backend/src/game/game.engine.ts` (throws `GameRuleError` with `ErrorCode`) |
| Understand current visual design | `docs/superpowers/specs/2026-05-06-durak-mobile-redesign-design.md` (originated for mobile; design language carried over to the web client) |

## Conventions

- TypeScript strict mode everywhere. No `any` without a comment explaining why.
- German user-facing strings (`"Du verteidigst"`, `"Bito"`). Code/comments in English.
- Commit style: `feat(scope): …`, `fix(scope): …`, `docs(scope): …`. Scope = `backend`, `web`, `shared`, or `repo`.
- The repo is a monorepo by design. Do **not** propose splitting into separate repos or migrating to Nx without an explicit reason that 3 packages can't solve.
