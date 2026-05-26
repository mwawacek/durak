---
name: durak-rules
description: Authoritative reference for Russian Durak rules and this project's specific implementation choices. Use when changing game mechanics, adding rule variants, debugging unexpected rule interactions, or writing tests that depend on rule behavior.
---

# Russian Durak — Rules Reference

This skill is the single source of truth for the rules implemented in
`apps/backend/src/game/game.engine.ts` and the shared helpers in
`packages/shared/src/rules.ts`. Whenever a rule is modified, **update this
file in the same change** so future sessions don't drift.

## Game modes

There is **only one mode today: Standard**. Everything below describes
Standard. Future custom modes (e.g. "Podkidnoy with translations off",
"Throwing-in only from main attacker", "Schwert / Sword variant",
"Trumpless") will live as documented deltas under a `## Variants`
section once they exist. Before adding a variant:

1. Decide whether the variant is a runtime toggle on `GameStateInternal`
   (preferred — single engine, branching helpers) or a parallel engine.
2. Add a `mode: 'standard' | '<variant>'` field to the room/game create
   payload (`packages/shared/src/events.ts` → CreateRoomPayload).
3. Engine branches on `state.mode` inside the affected mutators. Keep
   the rule helpers (`beats`, `canRedirectWith`, …) pure — pass `mode`
   in if needed instead of reading global state.
4. Document the delta here under `## Variants` with: name, payload key,
   diff vs Standard, affected engine functions, affected UI affordances.

Tests for variants live next to the standard tests in
`game.engine.spec.ts` with `describe('<variant> mode', …)` blocks.

## Setup

- 36-card deck (6 through Ace, 4 suits).
- 2–6 players (`MIN_PLAYERS`, `MAX_PLAYERS` in `@durak/shared`).
- Each player is dealt 6 cards (`STARTING_HAND_SIZE = 6`).
- After the deal the **bottom card of the deck is revealed** — its suit becomes
  the trump for the rest of the game (`trumpSuit`). The trump card itself
  remains in the deck and is the last card to be drawn.
- **First attacker:** standard Russian Durak rule — the player holding the
  **lowest trump card in their hand**. If the deck is so small that no trump
  was dealt to anyone (extreme edge case, mathematically impossible at
  STARTING_HAND_SIZE=6 with the trump sitting at deck bottom but possible if
  the engine is invoked with custom decks in tests), the fallback is the
  player after the dealer.

## Roles per round

- **Attacker** (`attackerIdx`): opens the round with the first card.
- **Defender** (`defenderIdx`): the player to the attacker's left (clockwise).
- **Pile-on attackers / "neighbours"**: the active players on either side of
  the defender (`prevActiveIdx`, `nextActiveIdx`) PLUS the main attacker.
  Together, this set is `neighborAttackers(state)` in the engine. Only these
  players may pile on once a round is in progress.

## Attack

- The attacker plays any card to open. Subsequent attacks (pile-ons) must
  match a **rank already on the table** — either an attack rank or a defense
  rank (`ranksOnTable`).
- **Capacity cap:** at any moment, the number of *undefended* attacks may
  never exceed the defender's current hand size. (This stops attackers from
  piling on more than the defender could possibly cover.)
- **Hard cap:** maximum 6 attack pairs per round (`MAX_TABLE_PAIRS = 6`).

## Defend

- The defender plays a card to "beat" each attack:
  - Same suit, higher rank → beats.
  - Trump card on a non-trump attack → beats.
  - Trump-on-trump must beat by rank.
  - Anything else does not beat.
- Implemented in `beats(attack, defense, trumpSuit)` in
  `packages/shared/src/rules.ts`.

## "Weiterschieben" (Perevodnoy / pass-on)

- Defender may, **before playing any defense card**, throw a same-rank card
  onto the table to redirect the whole attack to the next active player.
- Conditions:
  - All current attacks share one rank (no defenses played yet).
  - Defender holds a same-rank card.
  - The new defender (next active player) has at least as many cards as
    `table.length + 1` (must be able to defend everything).
  - Defender keeps at least one card after the redirect.
- Implemented in `redirectAttack` (engine) and `canRedirectWith` (shared).

## "Bito" — round end / confirmation

- A defended round (every pair has a defense card) does **not** commit
  immediately. Any pile-on-eligible attacker may still throw in cards on
  matching ranks until everyone confirms.
- **Confirmation model** (project-specific implementation, matches canonical
  Durak):
  - The set of attackers whose explicit Bito is awaited equals the eligible
    attackers (main + defender's neighbours), MINUS those who can't pile on
    anyway (no rank match in hand) — those auto-pass.
  - When all required confirmations are in (or no one can pile on at all),
    the round commits: table cards go to discard, hands refill from the deck
    (attacker first, defender last), and the defender becomes the next
    attacker.
- Exposed publicly via `GameStatePublic.pendingConfirmations: string[]`.
- Implemented in `endTurn`, `computePendingIndices`, and `commitRoundEnd`
  in the engine. The auto-pass case (no eligible attacker can pile on)
  no longer commits inline — it is scheduled by the gateway as a
  delayed auto-resolution (see **Auto-resolution timing** below).

## "Take" — defender concedes

- If the defender can't (or chooses not to) beat an attack, they take **all**
  cards on the table — both attacks and defenses — into their hand.
- Turn rotates: the defender is **skipped** for the next round; the next
  active player after the (former) defender becomes the new attacker.
- Implemented in `takeCards` (engine) and `rotateAfterFailure`.

### Auto-take

The server commits a take automatically when the defender has zero legal
moves left:

- At least one undefended attack on the table, AND
- Defender holds no card in hand that beats any undefended attack
  (`defenderCanBeatAnyUndefended` is false), AND
- No eligible attacker has a pile-on-capable card
  (`pileOnCapableIndices(s).size === 0`).

The engine exposes this as a **pure predicate** —
`checkAutoResolution(state): 'take' | 'bito' | null` — and the actual
commit lives in separate explicit mutators `commitAutoTake(state)` /
`commitAutoBito(state)`. The mutators throw if the predicate no longer
holds (defensive: the gateway always re-checks before calling them).

Mutators (`playAttack`, `playDefense`, `redirectAttack`, `endTurn`,
`takeCards`, `leaveGame`) do **not** chain into auto-resolution
themselves — that runs through the gateway timer (see next section).

Defender keeps agency in two cases:

1. They *could* defend but choose to take strategically → must press
   "Nehmen" manually (auto-take predicate is false because
   `defenderCanBeatAnyUndefended` is still true).
2. They could redirect (Weiterschieben) → handled separately; redirect
   precondition (uniform-rank, no defenses yet) is independent of
   auto-take.

## Auto-resolution timing (gateway-scheduled)

Auto-take and auto-bito are **delayed**, not instant. After every state
mutation `GameGateway.afterGameMutation` runs
`maybeScheduleAutoResolution`:

1. Cancel any pending auto-resolution timer for the room.
2. Ask the engine via `checkAutoResolution(state)`. If `null`, stop.
3. Otherwise schedule a `setTimeout` for
   `AUTO_RESOLVE_DELAY_MS (3500) + Math.random() * AUTO_RESOLVE_JITTER_MS (500)`
   — i.e. **3.5 – 4.0 seconds**.
4. On fire, re-check `pendingAutoResolution`. If the kind still matches,
   call `commitAutoTake` / `commitAutoBito` and broadcast. If the state
   has moved on (defender manually took, pile-on landed and removed the
   stuck condition, etc.), do nothing — the next `afterGameMutation`
   already scheduled the correct follow-up.

**Why the delay** — without it, a stuck round used to resolve in the
same socket round-trip as the move that made it stuck, leaking
information ("opponent had no card → auto-take fired instantly →
they were trapped"). The 3.5 – 4.0 s window with re-evaluation on every
intervening action makes trap timing indistinguishable from a normal
"thinking" pause. Pile-ons during the window cancel and reschedule the
same 3.5 s baseline — the clock never gets shorter.

`maybeFinishGame` cancels the auto-resolution timer when the game ends.
Constants live at the top of `game.gateway.ts`.

## Refill order

- After every commit (Bito or take), hands are refilled to 6 cards from the
  deck in this order: main attacker first, then clockwise, defender last
  (`refillHands`).
- The deck's bottom card (= trump card) is the last to be drawn — whoever's
  turn it is in the refill order at that moment gets it. Once drawn, the
  engine nulls out `state.trumpCard` (the trump-reservoir peek on the UI
  disappears). `state.trumpSuit` stays for the rest of the game.
- After the deck is empty, players who run out of cards are marked `hasFinished`.

## Game end

- Game ends when at most one active (non-finished) player remains AND the
  deck is empty.
- The remaining player is the **Durak** (loser).
- Edge case: if the last move makes everyone finish on the same step (deck
  empty + every hand emptied via the same refill), the player whose
  `finishedAt` is the most recent is named the Durak.
- Implemented in `checkFinished` (engine).

## Disconnect / reconnect / leave

- Players who disconnect are marked `isConnected: false` but keep their
  seat for `RECONNECT_GRACE_MS = 30_000`.
- Reconnect: same player ID (for guests, derived from the slugified name —
  same name reclaims the seat) → grace timer cleared, seat restored.
- After grace expires: lobby rooms drop the player; in-game rooms drop the
  player via the engine (`leaveGame`) AND, if no connected member remains,
  the room is finished and the in-memory game state is freed.

### Explicit leave during a game

There is no dedicated `LEAVE_GAME` socket event — the existing
`LEAVE_ROOM` event handles both lobby and in-game cases. When fired
while the room is `in-game`, the gateway calls `dropFromGame` →
`GameService.leave` → `leaveGame(state, playerId)` engine mutator
(`game.engine.ts:584`). Same path is taken when grace expires (see
`finalizeDisconnect`).

`leaveGame` mutator behaviour (Standard mode):

- Player is marked `hasLeft = true`. Their hand is dumped to the
  discard pile (not redistributed). Seat stays in `players[]` so seat
  indices never shift.
- **If the leaver was the defender**: any cards already on the table
  are forfeited to the discard, the round resets with the same main
  attacker continuing, and the defender role advances to the next
  active seat. Hands refill so the next round opens clean.
- **If the leaver was the main attacker**: defender keeps defending
  the existing table; main-attacker role moves to the next active
  seat (excluding the defender, via `nextActiveIdx(s, idx, defenderIdx)`).
- **If the leaver was a pile-on neighbour**: no structural fix needed —
  `nextActiveIdx` and `eligibleAttackerIndices` already skip `hasLeft`.
- `checkFinished` runs at the end. Auto-resolution is **not** chained
  inline — the gateway picks it up via `maybeScheduleAutoResolution`
  (same delayed path as any other mutation).
- Idempotent: calling `leaveGame` for a player who already left, has
  finished, or where the game is over → no-op.

## Implementation invariants worth knowing

- All engine mutators take `GameStateInternal` and return a **new** state
  (via `cloneState`). They throw `GameRuleError(code, message)` on rule
  violations; the gateway translates that into an `AckResult`.
- `passConfirmations: Set<number>` is **always cleared** when a new card
  lands on the table — pile-on or defense — because every new card may
  invite new pile-ons and stale confirmations would be misleading.
- The web client computes `playableCardIds` and `candidateAttackIds` from
  the same shared rule helpers (`beats`, `ranksOnTable`, `tableFullyDefended`,
  `canRedirectWith`) — no client-side rule reimplementation. If a rule
  changes in shared, both engine and web pick it up.
- `MAX_TABLE_PAIRS`, `MIN_PLAYERS`, `MAX_PLAYERS`, `STARTING_HAND_SIZE`
  live in `@durak/shared` so engine, web, and bot agree.

## Player count layout (web client)

- The May-2026 redesign dropped the oval-table polar geometry. Opponents
  now sit in a horizontal strip above the play area
  (`apps/web/src/features/game/OpponentRow.tsx`).
- 1–3 opponents: full chip (avatar 22 px, name + role status, 90 px row).
- 4+ opponents: `COMPACT_THRESHOLD = 4` flips the row into compact mode
  (avatar 18 px, name only, 80 px row, smaller card-fan backs). Fits the
  worst-case 5-opponent row on a 390 px viewport.
- Edit `OpponentRow.tsx` if seat ordering or sizing needs to change —
  the per-count case is encapsulated there. There is no longer a
  separate seat-angle config file.

## When to invoke this skill

- About to change anything in `apps/backend/src/game/game.engine.ts`.
- About to change anything in `packages/shared/src/rules.ts` or
  `packages/shared/src/cards.ts`.
- Adding tests that need to construct realistic game states (use this as
  the spec of what "realistic" means).
- Player reports a rule-feel bug ("this should/shouldn't have worked").
- Rebalancing the seat layout / mobile UI for different player counts.
- **Adding a new game mode / variant** — read the `## Game modes`
  section first, then add the delta under a new `## Variants` section.
  The Standard rules above describe the *baseline* every variant
  diverges from.
