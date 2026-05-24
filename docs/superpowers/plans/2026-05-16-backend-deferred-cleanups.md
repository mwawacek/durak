# Backend Deferred Cleanups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the six high-value deferred items from `BACKEND_NOTES.md` — runtime payload validation, engine deduplication, gateway broadcast unification, and one shared constant.

**Architecture:** Backend-only refactors plus a single new shared constant. Engine changes preserve behaviour (existing 21 tests are the regression spec); gateway changes go through manual smoke; DTOs add a real runtime validation layer that the ValidationPipe in `main.ts` will now actually enforce.

**Tech Stack:** NestJS 11, class-validator, class-transformer, Socket.IO, TypeScript strict, Jest for engine tests, the existing bot for smoke testing.

---

## Scope check

UX-flavour deferred items (landscape hint, iPad max-width, iOS keyboard, ActionBar crowding, ConnectionBadge retry, cross-package symbol moves) are intentionally out of scope: they're either polish without proven need, iOS-specific quirks needing on-device verification, or low-value cross-package churn. This plan covers only the backend / shared correctness items.

## File map

| File | Role | Action |
|---|---|---|
| `packages/shared/src/events.ts`            | New `SOCKET_ACK_TIMEOUT_MS` constant alongside existing event names | Modify |
| `apps/web/src/services/socket.ts`          | Consume the shared timeout constant                                | Modify |
| `tools/bot.mjs`                            | Consume the shared timeout constant                                | Modify |
| `apps/backend/src/game/game.engine.ts`     | `setConnected` helper + `eligibleAttackerIndices` extraction + `takeCards` reuses `commitTake` | Modify |
| `apps/backend/src/game/game.engine.spec.ts`| Already covers the refactored paths via existing tests             | No change |
| `apps/backend/src/gateways/game.gateway.ts`| New `afterGameMutation` private helper used by 5 gameplay handlers | Modify |
| `apps/backend/src/gateways/dto/*.ts`       | New class-validator DTOs for every socket payload                   | Create |
| `apps/backend/src/gateways/game.gateway.ts`| `@MessageBody()` typed against DTO classes; drop `requireRoomId` / `requireCard` after | Modify |
| `BACKEND_NOTES.md`                          | Strike the items as we land them                                    | Modify |

---

## Task 1: Shared `SOCKET_ACK_TIMEOUT_MS`

**Files:**
- Modify: `packages/shared/src/events.ts`
- Modify: `apps/web/src/services/socket.ts`
- Modify: `tools/bot.mjs`

- [ ] **Step 1: Add the constant to shared**

In `packages/shared/src/events.ts`, after the `SOCKET_EVENTS` object, add:

```ts
/** Default ack timeout (ms) used by all socket-emit helpers. */
export const SOCKET_ACK_TIMEOUT_MS = 10_000;
```

- [ ] **Step 2: Build shared**

Run: `npm run build:shared`
Expected: `tsc -p tsconfig.json` exits 0.

- [ ] **Step 3: Consume in web client**

In `apps/web/src/services/socket.ts`, change the import to add `SOCKET_ACK_TIMEOUT_MS` and replace the inline `10_000` in `emitAck`:

```ts
import {
  type AckResult,
  ERROR_CODES,
  SOCKET_ACK_TIMEOUT_MS,
  type SocketEventName,
} from '@durak/shared';
```

```ts
return (await s.timeout(SOCKET_ACK_TIMEOUT_MS).emitWithAck(event, ...args)) as AckResult<unknown>;
```

- [ ] **Step 4: Consume in bot**

In `tools/bot.mjs`, add `SOCKET_ACK_TIMEOUT_MS` to the destructured shared import and use it in the `ack` helper:

```js
import {
  SOCKET_EVENTS,
  RANK_ORDER,
  beats,
  canPileOn,
  MAX_TABLE_PAIRS,
  SOCKET_ACK_TIMEOUT_MS,
} from '../packages/shared/dist/index.js';
```

```js
const ack = (socket, event, ...payload) =>
  new Promise((resolve, reject) => {
    socket.timeout(SOCKET_ACK_TIMEOUT_MS).emit(event, ...payload, (err, res) =>
      err ? reject(err) : resolve(res),
    );
  });
```

- [ ] **Step 5: Verify**

Run: `npm run typecheck && npm run lint && npm run test`
Expected: all green, 21/21 tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(shared): SOCKET_ACK_TIMEOUT_MS lives in shared, consumed by web + bot"
```

---

## Task 2: `setConnected` helper in engine

**Files:**
- Modify: `apps/backend/src/game/game.engine.ts`

`markDisconnected` and `markConnected` differ only by a boolean. Engine tests don't reference them by name (gateway calls them), so existing tests continue to pass; we add a parametrised helper and keep the two named exports as thin wrappers for the gateway's call-site spelling.

- [ ] **Step 1: Locate the pair**

Run: `grep -nA 8 "markDisconnected\|markConnected" apps/backend/src/game/game.engine.ts | head -25`
Expected: two near-identical functions around lines 523–535.

- [ ] **Step 2: Replace both with the parametrised helper**

In `apps/backend/src/game/game.engine.ts`, replace the two functions with:

```ts
const setConnected = (
  state: GameStateInternal,
  playerId: string,
  isConnected: boolean,
): GameStateInternal => {
  const s = cloneState(state);
  const idx = s.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return state;
  s.players[idx]!.isConnected = isConnected;
  return s;
};

export const markDisconnected = (
  state: GameStateInternal,
  playerId: string,
): GameStateInternal => setConnected(state, playerId, false);

export const markConnected = (
  state: GameStateInternal,
  playerId: string,
): GameStateInternal => setConnected(state, playerId, true);
```

- [ ] **Step 3: Verify**

Run: `npm run test --workspace @durak/backend`
Expected: all engine tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/game/game.engine.ts
git commit -m "refactor(backend): collapse markDisconnected/markConnected via setConnected helper"
```

---

## Task 3: Extract `eligibleAttackerIndices`

**Files:**
- Modify: `apps/backend/src/game/game.engine.ts`

`computePendingIndices` and `pileOnCapableIndices` share the iteration body (skip-confirmed, skip-finished, has-pile-on-card). Only the front-guard differs (`tableFullyDefended` for pending).

- [ ] **Step 1: Add the shared helper above the two callers**

In `apps/backend/src/game/game.engine.ts`, just above `computePendingIndices`:

```ts
/** Attackers (eligible neighbours + main attacker) who can still pile on
 *  given the table capacity and the defender's hand. Used by both
 *  computePendingIndices (filtered further by tableFullyDefended) and
 *  pileOnCapableIndices. */
const eligibleAttackerIndices = (s: GameStateInternal): Set<number> => {
  const out = new Set<number>();
  const defender = s.players[s.defenderIdx];
  if (!defender || defender.hand.length === 0) return out;
  if (s.table.length >= MAX_TABLE_PAIRS) return out;
  for (const idx of neighborAttackers(s)) {
    if (s.passConfirmations.has(idx)) continue;
    const player = s.players[idx]!;
    if (player.hasFinished) continue;
    if (!playerHasPileOnCard(player, s.table)) continue;
    out.add(idx);
  }
  return out;
};
```

- [ ] **Step 2: Replace both consumers**

Replace `computePendingIndices` with:

```ts
const computePendingIndices = (s: GameStateInternal): Set<number> => {
  if (s.table.length === 0 || !tableFullyDefended(s.table)) return new Set();
  return eligibleAttackerIndices(s);
};
```

Replace `pileOnCapableIndices` with:

```ts
const pileOnCapableIndices = (s: GameStateInternal): Set<number> =>
  eligibleAttackerIndices(s);
```

- [ ] **Step 3: Verify**

Run: `npm run test --workspace @durak/backend`
Expected: all 21 engine tests pass — the refactor is behaviour-preserving and the Bito / auto-take / auto-commit scenarios in the spec exercise both code paths.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/game/game.engine.ts
git commit -m "refactor(backend): share eligibleAttackerIndices between pending + pileOnCapable"
```

---

## Task 4: `takeCards` reuses `commitTake`

**Files:**
- Modify: `apps/backend/src/game/game.engine.ts`

Currently `takeCards` (public) duplicates the body of `commitTake` (private). The defended-by-auto-take and explicit-take paths must commit identically — drift here would be a real rule bug.

- [ ] **Step 1: Inspect both paths**

Run: `grep -nA 10 "const commitTake\|export const takeCards" apps/backend/src/game/game.engine.ts`
Expected: see both bodies, confirm they push table cards into the defender hand, clear table, refill, and rotate.

- [ ] **Step 2: Strip the duplication**

In `apps/backend/src/game/game.engine.ts`, replace `takeCards`'s body so that after its validation guards it delegates to `commitTake`:

```ts
export const takeCards = (state: GameStateInternal, playerId: string): GameStateInternal => {
  const s = cloneState(state);
  requireTurn(s, playerId, 'defender');
  if (s.table.length === 0) {
    throw new GameRuleError(ERROR_CODES.INVALID_MOVE, 'Tisch ist leer');
  }
  commitTake(s);
  return s;
};
```

Note: `commitTake` mutates `s` in place (it's an internal helper); the wrapper clones first so the public contract still returns a fresh state.

- [ ] **Step 3: Verify**

Run: `npm run test --workspace @durak/backend`
Expected: all 21 tests pass, including the take-cards + auto-take paths.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/game/game.engine.ts
git commit -m "refactor(backend): takeCards delegates to commitTake (no drift)"
```

---

## Task 5: `afterGameMutation` gateway helper

**Files:**
- Modify: `apps/backend/src/gateways/game.gateway.ts`

The 5 gameplay handlers (`onPlayCard`, `onDefendCard`, `onRedirectAttack`, `onEndTurn`, `onTakeCards`) share `broadcastGameState(roomId) → broadcastRoomState(roomId) → maybeFinishGame(roomId)`. Two of them additionally broadcast `ROUND_STARTED`.

- [ ] **Step 1: Add the helper near the other broadcast methods**

In `apps/backend/src/gateways/game.gateway.ts`, add this private method near `broadcastRoomList`:

```ts
/** After every successful engine mutation, broadcast the per-player game
 *  state, refresh the room-state cache, optionally emit ROUND_STARTED, and
 *  finalise the game if it ended. Centralises a flow that was duplicated
 *  across all five gameplay handlers. */
private afterGameMutation(
  roomId: string,
  state: GameStateInternal,
  options?: { attackerId?: string; defenderId?: string },
): void {
  this.broadcastGameState(roomId);
  this.broadcastRoomState(roomId);
  if (options?.attackerId && options?.defenderId) {
    this.server.to(roomId).emit(SOCKET_EVENTS.ROUND_STARTED, {
      roomId,
      attackerId: options.attackerId,
      defenderId: options.defenderId,
    });
  }
  if (state.phase === 'finished') this.maybeFinishGame(roomId, state);
}
```

- [ ] **Step 2: Replace the inline post-mutation block in each handler**

In each of `onPlayCard`, `onDefendCard`, `onRedirectAttack`, `onEndTurn`, `onTakeCards`, replace the post-mutation block (`broadcastGameState` + `broadcastRoomState` + optional `ROUND_STARTED` emit + `maybeFinishGame`) with a single call:

```ts
this.afterGameMutation(payload.roomId, newState);
// — or, for handlers that triggered a round rotation:
this.afterGameMutation(payload.roomId, newState, {
  attackerId: newState.players[newState.attackerIdx].id,
  defenderId: newState.players[newState.defenderIdx].id,
});
```

The exact attackerId/defenderId for ROUND_STARTED follows the rules already in those two handlers — preserve them verbatim.

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint && npm run test`
Expected: all green, 21 tests pass.

- [ ] **Step 4: Smoke test**

```bash
# Terminal A
PID=$(lsof -i :3010 -t 2>/dev/null | head -1); [ -n "$PID" ] && kill -9 $PID
npm run dev:backend
```
```bash
# Terminal B
node tools/bot.mjs SmokeBot --host-room
```
Expected: bot logs "joined lobby", "hosted room", no errors. Stop processes.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/gateways/game.gateway.ts
git commit -m "refactor(backend): afterGameMutation helper unifies handler broadcasts"
```

---

## Task 6: Class-validator DTOs for socket payloads

**Files:**
- Create: `apps/backend/src/gateways/dto/index.ts` (re-exports)
- Create: `apps/backend/src/gateways/dto/card.dto.ts`
- Create: `apps/backend/src/gateways/dto/payloads.dto.ts`
- Modify: `apps/backend/src/gateways/game.gateway.ts`

ValidationPipe is configured globally (`main.ts`) but currently does nothing at runtime — TS interfaces erase. We add class DTOs with class-validator decorators that the ValidationPipe will enforce automatically because `@MessageBody()` accepts a class.

- [ ] **Step 1: Card DTO**

Create `apps/backend/src/gateways/dto/card.dto.ts`:

```ts
import { IsIn, IsString, Matches } from 'class-validator';
import { RANKS, SUITS, type Rank, type Suit } from '@durak/shared';

export class CardDto {
  @IsIn(SUITS as unknown as readonly string[])
  suit!: Suit;

  @IsIn(RANKS as unknown as readonly string[])
  rank!: Rank;

  /** Server-assigned id like "8-hearts" — we still validate the shape. */
  @IsString()
  @Matches(/^(2|3|4|5|6|7|8|9|10|J|Q|K|A)-(hearts|diamonds|spades|clubs)$/)
  id!: string;
}
```

- [ ] **Step 2: Payload DTOs**

Create `apps/backend/src/gateways/dto/payloads.dto.ts`:

```ts
import { Type } from 'class-transformer';
import { IsInt, IsString, Length, Max, Min, ValidateNested } from 'class-validator';
import { MAX_PLAYERS, MIN_PLAYERS } from '@durak/shared';
import { CardDto } from './card.dto';

export class JoinLobbyDto {
  @IsString()
  @Length(2, 32)
  playerName!: string;
}

export class CreateRoomDto {
  @IsString()
  @Length(1, 48)
  name!: string;

  @IsInt()
  @Min(MIN_PLAYERS)
  @Max(MAX_PLAYERS)
  maxPlayers!: number;
}

export class RoomRefDto {
  @IsString()
  @Length(1, 128)
  roomId!: string;
}

export class PlayCardDto extends RoomRefDto {
  @ValidateNested()
  @Type(() => CardDto)
  card!: CardDto;
}

export class DefendCardDto extends RoomRefDto {
  @IsString()
  @Length(1, 32)
  attackCardId!: string;

  @ValidateNested()
  @Type(() => CardDto)
  defenseCard!: CardDto;
}

export class RedirectAttackDto extends RoomRefDto {
  @ValidateNested()
  @Type(() => CardDto)
  card!: CardDto;
}
```

`JoinRoom`, `LeaveRoom`, `StartGame`, `EndTurn`, `TakeCards` all share the `{ roomId }` shape — they reuse `RoomRefDto`.

- [ ] **Step 3: Barrel**

Create `apps/backend/src/gateways/dto/index.ts`:

```ts
export * from './card.dto';
export * from './payloads.dto';
```

- [ ] **Step 4: Wire DTOs in the gateway**

In `apps/backend/src/gateways/game.gateway.ts`:

1. Import the DTOs:
   ```ts
   import {
     JoinLobbyDto,
     CreateRoomDto,
     RoomRefDto,
     PlayCardDto,
     DefendCardDto,
     RedirectAttackDto,
   } from './dto';
   ```
2. Change each `@MessageBody() payload: JoinLobbyPayload` etc. to reference the corresponding DTO class. The contract types from `@durak/shared` (e.g. `JoinLobbyPayload`) stay as the runtime shape — DTOs match them structurally, so consumers in the handler bodies are unchanged.
3. Delete the bespoke `requireRoomId(payload)` / `requireCard(payload?.card)` helpers and their call-sites — ValidationPipe now rejects malformed input before the handler runs.

- [ ] **Step 5: Verify typecheck**

Run: `npm run typecheck && npm run lint`
Expected: green.

- [ ] **Step 6: Verify tests**

Run: `npm run test`
Expected: 21/21 pass.

- [ ] **Step 7: Smoke test runtime validation**

```bash
PID=$(lsof -i :3010 -t 2>/dev/null | head -1); [ -n "$PID" ] && kill -9 $PID
npm run dev:backend &
sleep 8
# Bot uses well-formed payloads, so it should still work fine:
node tools/bot.mjs SmokeBot --host-room
sleep 3
```

Expected: bot logs "joined lobby" and "hosted room". Stop processes.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(backend): runtime DTO validation for every socket payload"
```

---

## Task 7: Update `BACKEND_NOTES.md`

**Files:**
- Modify: `BACKEND_NOTES.md`

- [ ] **Step 1: Strike the deferred items that landed**

In `BACKEND_NOTES.md`, replace the deferred-follow-ups section with a "landed on 2026-05-16" note that lists the six items as done and links them to the commits.

- [ ] **Step 2: Commit**

```bash
git add BACKEND_NOTES.md
git commit -m "docs(repo): mark 2026-05-15 deferred items as landed"
```

---

## Self-review

1. **Spec coverage:** every BACKEND_NOTES.md deferred item from the 2026-05-15 review is covered by Tasks 1–6, except the explicitly out-of-scope UX items called out in Scope check.
2. **No placeholders:** every code step contains the actual code; commands are exact; expected outputs are stated.
3. **Type consistency:** `eligibleAttackerIndices` / `computePendingIndices` / `pileOnCapableIndices` all return `Set<number>` consistently; `afterGameMutation`'s `options` shape is consistent between the helper signature and the call-sites; DTO field names match `@durak/shared` payload interfaces (verified against `events.ts`).
