# Durak Web (Vite + React)

Mobile-first web client. Vite 5, React 18, TypeScript strict. Zustand for state, Socket.IO client for transport, TailwindCSS for styling with hand-picked Classic-Mahogany tokens.

## Run

```bash
npm run dev:web              # Vite dev server on :5173
```

Vite listens on `0.0.0.0` — open from your phone via `http://<laptop-ip>:5173`.

## Backend URL resolution

`src/services/socket.ts:resolveApiUrl()` resolves the backend in this order:

1. `VITE_API_URL` env var — set in `apps/web/.env.local` for an explicit override.
2. **Dev mode**: same host as the Vite server, port 3000 (so the phone hits `http://<laptop-ip>:3000`).
3. **Prod build**: `window.location.origin` (assumes the backend is served behind the same domain).

## Architecture

```
src/
├── main.tsx                # ReactDOM root
├── App.tsx                 # BrowserRouter + Routes + global Toast + ConnectionBadge.
│                           # Also exports <WordMark> (engraved gold-foil "Durak").
├── index.css               # Tailwind base + body backdrop + grain overlay + safe-area utils
├── routes/
│   ├── LobbyRoute.tsx      # "/", branches to NameEntryModal or LobbyPage
│   ├── RoomRoute.tsx       # "/r/:roomId" state machine (modal → waiting → game)
│   └── NotFoundRoute.tsx
├── features/
│   ├── lobby/              # LobbyPage, RoomList, RoomRow, MyRoomPanel, CreateRoomDialog
│   ├── waiting/            # WaitingRoom (player list + host start + share)
│   └── game/               # GameTable + OvalTable + OpponentSeat + TrumpReservoir +
│                           # DiscardIndicator + BattleField + PlayerHand + ActionBar +
│                           # GameOverDialog. GameTable is lazy-imported.
├── components/
│   ├── Card.tsx            # Inline SVG card face + back
│   ├── cardSizes.ts        # Size tokens (separated for Fast Refresh)
│   ├── BrassButton.tsx     # 4-variant gradient button with brushed sheen
│   ├── RingedAvatar.tsx
│   ├── Toast.tsx           # Store-driven global toast
│   ├── ConnectionBadge.tsx # Top-right WiFi pill
│   ├── ShareButton.tsx     # Web Share API + clipboard fallback
│   └── NameEntryModal.tsx
├── hooks/
│   ├── useGameRules.ts     # playableCardIds / candidateAttackIds / etc.
│   ├── useTableLayout.ts   # Ellipse geometry + seat positions
│   ├── useWindowSize.ts
│   ├── useNamePersistence.ts # Hydrates store from LS, mirrors back
│   ├── useLobbyJoin.ts     # Emit JOIN_LOBBY on (connect × name) edges
│   ├── useRoomMembership.ts# Emit JOIN_ROOM when /r/:id is missing membership
│   └── useBootReconnect.ts # First-load redirect to /r/<lastRoom>
├── services/
│   ├── socket.ts           # io() singleton + emitAck / emitAckOrToast
│   └── socketHandlers.ts   # Server → store wiring
├── store/
│   └── gameStore.ts        # Zustand (rooms, game, identity, lastError)
├── lib/
│   ├── cn.ts               # clsx + tailwind-merge
│   ├── persistence.ts      # Typed LocalStorage wrappers
│   ├── vibrate.ts          # Web Vibration API (iOS-safe no-op)
│   └── logger.ts           # Dev-only console wrapper
└── theme/
    └── tokens.ts           # Subset of Tailwind tokens for inline SVG / inline style
```

## The "Classic Mahogany" design system

Warm dark mahogany backdrop with a faint wood-grain and a fractal-noise overlay (body::before). Oval forest-felt table with double gold rail, brass action buttons, cream Russian-style cards with monogram face cards (B / D / K / A) and pip layouts for 6..10.

Tokens live in `tailwind.config.ts` (Tailwind classnames) and `src/theme/tokens.ts` (JS mirrors for inline SVG fills). **Never hard-code colours in components** — extend the palette or compose with utilities like `bg-gold-light` / `border-gold/40`.

Typography:
- **Display**: Cinzel (engraved Roman caps) — used for all-caps labels, badges, the WordMark.
- **Body**: Cormorant Garamond (italic-serif) — used for room names, player names, primary banner text.

Card sizes (`cardDims('lg' | 'md' | 'sm')`): `sm` (44 × 64) for opponent stacks, `md` (64 × 93) for table cards, `lg` (80 × 116) for the player's hand.

## Defender-flow contract (don't break this)

The defender flow in `features/game/GameTable.tsx` is **hand-first, single-tap when possible**:

1. Defender taps a card from their hand.
2. If exactly one undefended attack on the table can be beaten by it → emit `DEFEND_CARD` immediately.
3. If multiple → set `selection = { kind: 'card', cardId }`, highlight candidate attack cards via `candidateAttackIds`. Defender then taps one attack to commit.
4. If zero → toast "Diese Karte schlägt keinen Angriff". No state change.

The reverse flow (tap-attack-first) was removed deliberately. Don't reintroduce a `pendingAttackId` state.

## Adding a UI component

1. New file under `src/components/` (primitives) or `src/features/<area>/` (feature-scoped).
2. Use Tailwind utility classes + the design tokens. Avoid `style={{ backgroundColor: '#abc' }}`.
3. Set `min-h-11 min-w-11` on tappable elements (44 × 44 px touch target).
4. Run `npm run typecheck --workspace @durak/web` and `npm run lint --workspace @durak/web`.

## Errors → Toast

There is exactly one error sink: `useGameStore.lastError`. Set it via `setError(msg)`; the global `<Toast>` mounted in `App.tsx` renders it for ~3 s and auto-clears.

## German copy

User-facing strings are German. Keep variable names and code comments English. Common terms:

| German | English | Used for |
|---|---|---|
| Du greifst an | You attack | Banner attacker |
| Du verteidigst | You defend | Banner defender |
| Fertig | Done | End-turn button (German equivalent of "Bito") |
| Nehmen | Take cards | Defender concedes |
| Weiterschieben | Pass on | Redirect attack to next player |
| Trumpf | Trump | Trump suit |
| Nachziehstapel / Abwurf | Deck / Discard | Top-of-table labels |
| Verteidigen oder Weiterschieben | Defend or pass on | Banner sub-line for defender |

## Build pipeline notes

- `tsconfig.json` extends the repo's `tsconfig.base.json` and adds DOM lib + `jsx: react-jsx`. `verbatimModuleSyntax: true` and `noUncheckedIndexedAccess: true` are on.
- `npm run build` runs `tsc --noEmit` then `vite build`. Type checking and bundling are separate; the dev server uses esbuild for fast HMR.
- Vite aliases `@durak/shared` to `packages/shared/src/index.ts` so named imports work without rebuilding the shared CJS dist for every change.
- Root `package.json` has an `overrides` block pinning `@types/react` and `@types/react-dom` to 18.x so transitive resolves don't drag in React 19 types (Zustand 4 declares a loose peer range).
