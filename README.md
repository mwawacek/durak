# Durak — Online Multiplayer

Production-grade online multiplayer implementation of the Russian card game **Durak**.

## Stack

| Layer        | Technology                                                     |
| ------------ | -------------------------------------------------------------- |
| Web client   | Vite + React 18 + TypeScript, Zustand, TailwindCSS, Framer Motion, Socket.IO client |
| Backend      | NestJS 10, Socket.IO Gateway, REST (health/auth)               |
| Persistence  | PostgreSQL 16 (TypeORM), optional — game state is in-memory    |
| Shared Types | `@durak/shared` — Card, GameState, Socket event contracts      |

**All game logic lives in the backend** (anti-cheat). The client only renders state and forwards user intents. Game state is authoritative in-memory on the server; Postgres stores player profiles and stats only.

The client is **mobile-first** — primary target is iPhone Safari (iPhone 12 and newer). Desktop / tablet work; portrait is the design canvas.

## Monorepo layout

```
durak/
├── apps/
│   ├── backend/      # NestJS server + Socket.IO gateway
│   └── web/          # Vite + React mobile-first web client
└── packages/
    └── shared/       # Typed contracts (Card, GameState, SocketEvents)
```

Managed via **npm workspaces**.

## Quick start

### Prerequisites
- Node.js 20.11+ and npm 10.2+
- (optional) Docker + Docker Compose for the full stack including Postgres
- A modern browser (Chrome / Safari / Firefox)

### Install
```bash
npm install
npm run build:shared
```

### Run the backend (no DB)
```bash
npm run dev:backend
# → listens on :3010, visit http://localhost:3010/health
```

### Run the backend with Postgres
```bash
npm run docker:up           # starts postgres + backend
npm run docker:logs         # tails backend logs
npm run docker:down         # tears it down
```

### Run the web client
```bash
npm run dev:web
# → Vite dev server on http://localhost:5173
```

Vite binds to `0.0.0.0`, so you can also open it from your phone over LAN at `http://<your-laptop-ip>:5173`. The web client auto-resolves the backend URL to the same host on port 3010.

To override the backend URL, set `VITE_API_URL` in `apps/web/.env.local`:

```bash
echo "VITE_API_URL=http://192.168.1.23:3010" > apps/web/.env.local
```

### Testing alone — the Bot

Since Durak needs ≥ 2 players, you can run a CLI bot as your opponent:

```bash
# Terminal 1 — backend (must be running):
npm run dev:backend

# Terminal 2 — bot that hosts a room and waits for you to join:
npm run bot -- MyBot --host-room

# Terminal 3 — web client:
npm run dev:web
# → open http://localhost:5173 in a browser tab, enter a name, you'll see
#   "MyBot's Bot-Tisch" in the lobby. Tap to join — the bot auto-starts the
#   game as soon as you're in.
```

Alternative bot modes:

```bash
# Bot auto-joins the first open lobby room (you host, bot joins):
npm run bot -- MyBot

# Bot targets a specific room id:
npm run bot -- MyBot --room <roomId>

# Bot targets a non-default backend (LAN IP / prod):
npm run bot -- MyBot --host http://192.168.1.23:3010 --host-room
```

The bot uses a simple heuristic (lowest non-trump for attacks, cheapest legal defense, take-cards if no defense). Enough to exercise all engine paths and play through entire games.

## Shareable room URLs

Each room has a permalink: `/r/<roomId>`. Send it via WhatsApp / iMessage and the recipient lands in the join flow directly — no login. If they have never played, the app asks for a display name (persisted in LocalStorage) before joining.

## Socket protocol

All events and payload types live in `packages/shared/src/events.ts` and are imported as typed contracts in both apps.

**Client → Server** (all acked with `AckResult<T>`):
| Event          | Payload                                                 |
| -------------- | ------------------------------------------------------- |
| `joinLobby`    | `{ playerName }`                                        |
| `createRoom`   | `{ name, maxPlayers }`                                  |
| `joinRoom`     | `{ roomId }`                                            |
| `leaveRoom`    | `{ roomId }`                                            |
| `startGame`    | `{ roomId }`                                            |
| `playCard`     | `{ roomId, card }`                                      |
| `defendCard`   | `{ roomId, attackCardId, defenseCard }`                 |
| `endTurn`      | `{ roomId }`                                            |
| `takeCards`    | `{ roomId }`                                            |

**Server → Client**:
| Event              | Payload                              |
| ------------------ | ------------------------------------ |
| `gameStateUpdate`  | `GameStatePrivate` (you-view)         |
| `roomListUpdate`   | `RoomPublic[]`                       |
| `playerJoined`     | `{ roomId, playerId, playerName }`   |
| `playerLeft`       | `{ roomId, playerId }`               |
| `roundStarted`     | `{ roomId, attackerId, defenderId }` |
| `errorMessage`     | `{ code, message }`                  |

## Game rules implemented

- 36-card deck (6..10, J, Q, K, A × 4 suits)
- 2–6 players
- 6 cards dealt per player; bottom card is revealed as trump
- First attacker = player holding 8♥; fallback = player after dealer
- Attack, defend (higher same-suit or trump), pile-on by matching ranks
- Table capped at 6 pairs or defender's hand size
- "Bito" (end turn) by attacker: cards to discard, defender becomes next attacker
- "Take" by defender: picks up all on table, turn skips past them
- Refill from deck to 6 in order (attacker → rest → defender)
- Loser (`durak`) = last player with cards when deck is empty

## Architecture invariants

- `GameService` is the sole owner of authoritative `GameStateInternal` per room.
- Every mutation goes through a pure function in `game.engine.ts` that returns a new state.
- `GameGateway` is transport-only — validates identity, forwards to services, broadcasts per-player projections via `projectPrivate`.
- Clients never see other players' hands.

## Development scripts

| Script                   | What it does                                     |
| ------------------------ | ------------------------------------------------ |
| `npm run build:shared`   | Compile `@durak/shared` once                     |
| `npm run dev:shared`     | Watch-build `@durak/shared`                      |
| `npm run dev:backend`    | NestJS in watch mode                             |
| `npm run dev:web`        | Vite dev server                                  |
| `npm run build:web`      | Production build of the web client               |
| `npm run typecheck`      | TypeScript check across all workspaces           |
| `npm run lint`           | ESLint across all workspaces                     |
| `npm run docker:up`      | Build + start backend + postgres                 |

## Roadmap

1. ✅ Monorepo setup
2. ✅ NestJS backend
3. ✅ Web client (Vite + React, mobile-first)
4. ✅ Socket connection (typed)
5. ✅ Lobby & Room system
6. ✅ Shareable room URLs (`/r/:roomId`)
7. ✅ Card model + game state
8. ✅ Deck shuffle + deal
9. ✅ Trump logic
10. ✅ Attack logic
11. ✅ Defense logic
12. ✅ Round resolution (bito / take)
13. ✅ Game sync (per-player projections)
14. ✅ Reconnect handling (30s grace)
15. ✅ PostgreSQL integration (optional, profile stats)
16. ✅ Deployment (Dockerfile + compose)
