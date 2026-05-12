---
name: durak-rules
description: Authoritative reference for Russian Durak rules and this project's specific implementation choices. Use when changing game mechanics, adding rule variants, debugging unexpected rule interactions, or writing tests that depend on rule behavior.
---

# Russian Durak — Rules Reference

This skill is the single source of truth for the rules implemented in
`apps/backend/src/game/game.engine.ts` and the shared helpers in
`packages/shared/src/rules.ts`. Whenever a rule is modified, **update this
file in the same change** so future sessions don't drift.

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
- Implemented in `endTurn`, `computePendingIndices`, `commitRoundEnd`, and
  `tryAutoCommit` in the engine. `tryAutoCommit` is also called from
  `playDefense` so that the auto-pass case (no one can pile on) commits the
  round instantly when the last defense lands — no UI button required.

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

Implemented in `tryAutoTake(s)`. Called from `playAttack`, `playDefense`,
`redirectAttack`, and `endTurn` — i.e. after every event that might bring
the round into a stuck state. Defender keeps agency in two cases:

1. They *could* defend but choose to take strategically → must press
   "Nehmen" manually (auto-take won't fire because
   `defenderCanBeatAnyUndefended` is still true).
2. They could redirect (Weiterschieben) → handled separately; redirect
   precondition (uniform-rank, no defenses yet) is independent of
   auto-take.

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

## Disconnect / reconnect / forfeit

- Players who disconnect are marked `isConnected: false` but keep their
  seat for `RECONNECT_GRACE_MS = 30_000`.
- Reconnect: same player ID (for guests, derived from the slugified name —
  same name reclaims the seat) → grace timer cleared, seat restored.
- After grace expires: lobby rooms drop the player; in-game rooms drop the
  player AND, if no connected member remains, the room is finished and the
  in-memory game state is freed.
- **Forfeit (giving up mid-game)** is currently expressed as "close the
  app and let the grace expire" — there is no explicit `LEAVE_GAME` event
  in the protocol. Add one if/when single-player vs. group-of-bots becomes
  a feature people use to escape losing positions.

## Implementation invariants worth knowing

- All engine mutators take `GameStateInternal` and return a **new** state
  (via `cloneState`). They throw `GameRuleError(code, message)` on rule
  violations; the gateway translates that into an `AckResult`.
- `passConfirmations: Set<number>` is **always cleared** when a new card
  lands on the table — pile-on or defense — because every new card may
  invite new pile-ons and stale confirmations would be misleading.
- The mobile client computes `playableCardIds` and `candidateAttackIds` from
  the same shared rule helpers (`beats`, `ranksOnTable`, `tableFullyDefended`,
  `canRedirectWith`) — no client-side rule reimplementation. If a rule
  changes in shared, both engine and mobile pick it up.
- `MAX_TABLE_PAIRS`, `MIN_PLAYERS`, `MAX_PLAYERS`, `STARTING_HAND_SIZE`
  live in `@durak/shared` so engine, mobile, and bot agree.

## Player count layout (mobile)

- 2–3 players (1–2 opponents): seats are full-size (`size="normal"`,
  100 px box width). Plenty of room.
- 4 players (3 opponents): same.
- 5–6 players (4–5 opponents): seats automatically switch to
  `size="compact"` (smaller card-back stack, smaller avatar, narrower
  box width 70–84 px) so they don't overlap on a 390 px screen.
- The choice is in `apps/mobile/src/screens/GameScreen.tsx` (`seatSize`,
  `seatBoxWidth`).
- Opponent angle distribution is in
  `apps/mobile/src/hooks/useTableLayout.ts` (`ANGLES_BY_COUNT`). Edit
  there if seat positions need rebalancing.

## When to invoke this skill

- About to change anything in `apps/backend/src/game/game.engine.ts`.
- About to change anything in `packages/shared/src/rules.ts` or
  `packages/shared/src/cards.ts`.
- Adding tests that need to construct realistic game states (use this as
  the spec of what "realistic" means).
- Player reports a rule-feel bug ("this should/shouldn't have worked").
- Rebalancing the seat layout / mobile UI for different player counts.
