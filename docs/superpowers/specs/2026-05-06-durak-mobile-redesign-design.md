# Durak Mobile — Redesign Spec

**Date:** 2026-05-06
**Scope:** `apps/mobile` UI/UX only. Backend, socket protocol, and game rules stay untouched.

## Problem

The current mobile UI has three concrete issues blocking actual play:

1. **Cards are unreadable.** `Card.tsx` uses 58×84 px cards in the hand, with `marginHorizontal: -4` overlap. Suit "black" is `#1c2541` (navy) on `#f4f4f8` — low contrast. Tap targets are well below the 44 px minimum.
2. **Role text overlaps cards.** `GameScreen.tsx` 230–239 puts "Du verteidigst" inside the `actions` view between the table and the hand with no visual container, making it look like it sits on top of the cards.
3. **Color palette feels sterile.** Cold marine palette (`bg #0b132b`, `surface #3a506b`, `accent #5bc0be`) lacks the warmth of an actual card-game table.

Underneath, a fourth problem hurts gameplay clarity:

4. **Defender flow is two-step.** Current flow is: tap an attack on the table → tap a defense card. Forces extra mental load and an extra tap. Defender doesn't realize tapping is needed first.

## Out of scope

- Game rules / Russian Durak mechanics (already correct in backend).
- Socket protocol or `@durak/shared` event contracts.
- Lobby/Login screen layout (only theme tokens get re-skinned).
- Heavy animation libraries (no Reanimated). Subtle native-driver transforms only.
- Sound effects.
- Persistent settings (theme switcher, etc).

## Visual direction: "Casino Felt"

Warm green felt table on a near-black background, with brass/gold accents. Classic card faces with high contrast.

### Color tokens (replaces `theme/colors.ts`)

```
bg:           #14181a   // app background, near-black warm grey
bgElevated:   #1d2326   // cards/sheets above bg (lobby room rows, modals)
felt:         #1f4d3a   // table surface (was `surface`)
feltEdge:     #163828   // table inner shadow / edge
text:         #f3ede1   // warm off-white
textDim:      #9aa39e
border:       #2a3236
accent:       #d4a85a   // brass/gold (primary actions, trump highlight)
accentStrong: #f0c674
danger:       #c14a4a   // muted brick red (errors, "take cards")
warning:      #d4a85a   // reuses accent
success:      #6a9955   // moss green (Bito / end turn)

// Card face (real card colors):
cardFace:     #fbf7ee   // warm cream
cardEdge:     #d8cdb4
cardSuitRed:  #b71c1c   // hearts/diamonds
cardSuitBlack:#1a1a1a   // clubs/spades — TRUE black, was navy
cardBack:     #2c4a3a   // dark felt-green back of face-down cards
cardBackPattern: #6a9955  // pattern accent
```

### Typography

- Rank glyph (corners): system bold serif if available (`Georgia` iOS, `serif` Android), 18 px on md card, 22 px on lg card.
- Suit glyph (center): 32 px on md, 44 px on lg.
- Body text: system sans (default `Text` font).

Real playing cards use serif numerals — this single change reads as "playing card" instantly.

### Card sizing

```
sm: 44 × 64    // opponent stack visualization, deck thumbnail
md: 64 × 92    // table cards (was 58×84)
lg: 80 × 116   // hand cards (was 58×84) — primary play surface
```

Hand uses `lg`. Overlap reduced from -4 to -16 px (still saves space, leaves enough fingertip).

### Card face layout

- Top-left corner: rank + suit glyph stacked (rank above suit), small.
- Center: large suit glyph.
- Bottom-right corner: rank + suit, rotated 180° (mirrors top-left).
- Border radius: 8 px.
- Border: 1 px `cardEdge`.
- Drop shadow: subtle, 2 px y-offset, 0.18 opacity.

### Card back (face-down)

- Background `cardBack`, with a single centered diamond/cross-hatch pattern in `cardBackPattern`.
- Same dimensions and border as face cards.

## Component changes

### `theme/colors.ts`

- Replace existing tokens with the Casino Felt palette above.
- Add `radii.card = 8`.
- Add `elevation` helper:
  ```ts
  elevation = {
    card: { shadowColor:'#000', shadowOpacity:0.18, shadowRadius:3, shadowOffset:{w:0,h:2}, elevation:2 },
    raised: { shadowColor:'#000', shadowOpacity:0.28, shadowRadius:6, shadowOffset:{w:0,h:4}, elevation:6 },
  }
  ```
- Add `radii.pill = 999`.

### `components/Card.tsx`

- New SIZE map (sm/md/lg above).
- `cardSuitBlack` for clubs/spades (was `colors.black` = navy).
- Serif font for `cornerText` and `cornerTextBottom`. Both corners now show **rank above mini-suit** (two stacked Texts), not just the rank.
- Larger center suit (32/44).
- `selected` state: lifts `-12 px` (was -8), border becomes `accentStrong` 3 px, glow via shadow.
- `playable` (new prop, replaces inverse-`dimmed` semantics in PlayerHand): when explicitly `playable={true}` AND not selected, very subtle gold outline ring (1 px `accent` outside border). Non-playable cards: `opacity 0.45`, no glow.

### `components/PlayerHand.tsx`

- Card size `lg`.
- Overlap `marginHorizontal: -16`.
- Mild fan: rotate edge cards. For hand of N cards, card at index i gets rotation `((i - (N-1)/2) * 1.5)°` clamped to ±9°. Disabled if N ≤ 1 (no rotation).
- Vertical lift of 4 px on the middle card (subtle arc) — only if N ≥ 5; skip for small hands.
- Pass `playable` boolean to each Card.

### `components/Table.tsx`

- Background uses new `felt` color, with a 2 px inset border in `feltEdge`.
- Inner padding increased.
- **Top row redesign:** Left = deck stack with trump card peeking under (rotated 90°), Right = discard count badge. Both compact, 64 px tall.
- **Trump badge** (new): persistent pill in the top-right of the felt area showing trump suit + rank, large suit glyph in suit color. Stays visible even when deck is empty.
- **Defense offset:** keep absolute-positioned defense card on top-right of the attack card with rotation `12°`, offset `top: 16, left: 22` for md cards. Outline placeholder uses dashed 1.5 px `feltEdge`.
- **Empty state:** instead of "Warten auf Angriff…" text, render two ghost card silhouettes (40% opacity dashed outlines) centered, with a small "Tisch ist frei" caption below in `textDim`.

### `components/PlayerBar.tsx`

- Each opponent tile: `bgElevated` background, rounded corners, 12 px padding.
- The opponent currently in the attacker or defender role gets a colored 2 px top border: attacker = `danger` (brick red), defender = `accent` (gold). Other opponents (waiting / finished): no top border, just `border`-colored frame.
- Role icon (`⚔`/`🛡`/`✓`) becomes a small chip *above* the name row, not inline with name text.
- Add a 28 px circular avatar with the player's initial (first letter of name, uppercase, on `felt` background, `text` foreground).
- Add an online indicator: 8 px dot, `success` if connected else `textDim`, placed to the left of the name.

### `components/RoleBanner.tsx` (NEW)

A dedicated horizontal strip placed between `PlayerBar` and `Table` (full width minus screen padding):

- Height 44 px, rounded 8 px.
- Background tinted by role:
  - Attacker: `danger` at 18% alpha, left border 4 px solid `danger`.
  - Defender: `accent` at 18% alpha, left border 4 px solid `accent`.
  - Waiting: `border` background, no left border accent.
- Content: icon + role text + short hint, e.g.
  - Attacker, table empty: `⚔  Du greifst an  ·  Karte spielen`
  - Attacker, table has cards: `⚔  Du greifst an  ·  Nachlegen oder Bito`
  - Defender: `🛡  Du verteidigst  ·  Karte tippen`
  - Defender + can redirect: `🛡  Verteidigen oder Weiterschieben`
  - Waiting: `⏳  {DefenderName} verteidigt`
- Single line, ellipsizes if too long.

### `components/ActionBar.tsx` (NEW, refactor of inline button row in GameScreen)

Bottom area above the hand:

- Single row of action buttons. Layout: at most one `primary` (full-width minus side actions) + secondary actions inline.
- "Bito" → primary `success` when available.
- "Karten nehmen" → primary `danger` when available.
- "Weiterschieben" → secondary, gold outline.
- All buttons min-height 48 px. Bold text. Iconified.

### `components/Toast.tsx` (NEW)

Replaces inline `lastError` red strip in `GameScreen`. Auto-hides after 3 s. Slides from top of screen content area, semi-transparent dark background, danger left border, `text` foreground.

- Wired to `useGameStore` `lastError`. When `lastError` becomes truthy, show; clear after 3 s timeout. Setting `lastError` to a different error before timeout resets the timer with the new message.

### `screens/GameScreen.tsx`

- Recompose layout (top→bottom):
  1. `PlayerBar`
  2. `RoleBanner`
  3. `Table` (flex: 1)
  4. `ActionBar`
  5. `PlayerHand`
- `Toast` mounted absolutely on top.
- Remove the inline `roleRow` and inline error text.
- **Defender flow simplified:** when defender taps a card from their hand:
  - If exactly one undefended attack on table can be beaten by this card → auto-emit `DEFEND_CARD` against that attack. No second tap.
  - If multiple undefended attacks could be beaten → set the card as `selectedCardId` (no socket emit yet) and visually highlight the candidate attack cards on the table using the existing `selected` style. Defender then taps one attack to commit. Tapping any non-candidate attack is ignored; tapping the same hand card again deselects.
  - If zero → show toast "Diese Karte schlägt keinen Angriff".
- The reverse flow (tap attack first, then a hand card) is removed in favor of the simpler hand-first flow above. `pendingAttackId` state is dropped.
- Redirect mode unchanged in semantics, but uses `ActionBar` button styling.

### `screens/LobbyScreen.tsx` and `screens/LoginScreen.tsx`

No layout change. Re-skinned via new `colors` tokens. Verify visual sanity:
- Login title still uses `accentStrong` (now warmer gold).
- Lobby room cards use `bgElevated` and feel consistent with new palette.

## Data flow

Unchanged. The redesign is presentational + adds one local timer in `Toast`. No store schema changes. `useGameStore` selectors stay the same.

## Error handling

- `lastError` continues to be the single source of error display, now rendered via Toast.
- Validation errors from socket acks → Toast.
- Network/socket disconnect remains visible in the existing connection indicator (LoginScreen).

## Testing

- Manual UI check on physical phone (user's existing setup) and iOS simulator at 390×844.
- Verify in three states:
  1. Initial deal — both players have 6 cards, attacker side highlighted.
  2. Mid-attack — table has 2 attacks, 1 defended, 1 not.
  3. End — `phase: 'finished'` alert still fires.
- Card tap targets ≥ 44 px effective (cards are 80×116 with -16 overlap → ≥ 64 px tappable per card).
- Color contrast: card text on cardFace ≥ 7:1 (true black `#1a1a1a` on cream `#fbf7ee` ≈ 16:1).
- TypeScript: `npm run typecheck` green for `apps/mobile`.
- Smoke test by running `npm run dev:backend` + `npm run bot -- TestBot --host-room` + `npm run dev:mobile`.

## Files changed

```
apps/mobile/src/theme/colors.ts                    (rewrite)
apps/mobile/src/components/Card.tsx                (significant rewrite)
apps/mobile/src/components/PlayerHand.tsx          (size + fan + props)
apps/mobile/src/components/Table.tsx               (felt skin + empty state + trump badge)
apps/mobile/src/components/PlayerBar.tsx           (role chips + avatars)
apps/mobile/src/components/RoleBanner.tsx          (NEW)
apps/mobile/src/components/ActionBar.tsx           (NEW)
apps/mobile/src/components/Toast.tsx               (NEW)
apps/mobile/src/screens/GameScreen.tsx             (recompose, simplify defender flow)
```

Lobby/Login auto-update via theme tokens; no edits to those screen files unless visual smoke test reveals breakage.

## Acceptance criteria

- Cards in player's hand are large (≥ 80×116), serif numerals, true black for clubs/spades, sufficient gap to tap individual cards.
- "Du verteidigst" / "Du greifst an" appears in a dedicated banner above the table, never visually on top of cards.
- Table area is warm green felt, with persistent trump badge.
- Defender can play a defense card by tapping it directly (no required attack-tap first), as long as exactly one undefended attack is beatable by it.
- Errors appear as a top-anchored toast that auto-dismisses, not as a static red strip between table and hand.
- App still works end-to-end with the bot (host, join, full game to "Durak!" alert).
