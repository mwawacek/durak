# Durak Mobile (React Native + Expo)

Expo SDK 54 + React Native 0.81. Zustand for state, Socket.IO client for transport.

## Run

```bash
npm run dev:mobile           # expo start (Metro bundler)
# Press i for iOS sim, a for Android, or scan QR with Expo Go
```

`@durak/shared` must be built before Metro can bundle. The root `npm install` does this once via the workspace, but after editing `packages/shared/`:

```bash
npm run build:shared
# OR run watch mode in another terminal:
npm run dev:shared
```

## Backend URL resolution

`src/services/socket.ts:resolveApiUrl()` resolves the backend in this order:

1. `EXPO_PUBLIC_API_URL` env var (override) — `EXPO_PUBLIC_API_URL=http://192.168.1.23:3000 npm run dev:mobile`
2. Auto-LAN: parses Metro's `scriptURL` to find the dev machine's LAN IP (this is what makes physical devices "just work" in Expo Go)
3. Android emulator: `10.0.2.2:3000` (the magic alias for host machine)
4. Fallback: `localhost:3000`

When testing on a physical phone over LAN, both phone and laptop must be on the **same WiFi**, and the laptop firewall must allow port 3000.

## Architecture

```
src/
├── App.tsx                 (in apps/mobile/App.tsx — outside src/)
├── navigation/             # @react-navigation native-stack: Login → Lobby → Game
├── screens/                # LoginScreen, LobbyScreen, GameScreen (split into outer + ActiveGame)
├── components/             # Card, PlayerHand, OvalTable, PlayerSeat, TrumpReservoir,
│                           # BattleField, BrassButton, RingedAvatar, Toast
├── hooks/
│   ├── useGameRules.ts     # Derives isAttacker/isDefender/playableCardIds/etc. from game state
│   └── useTableLayout.ts   # Oval geometry + opponent seat positions on the rim
├── services/
│   ├── socket.ts           # Socket.IO singleton + emitAck() / emitAckOrToast() helpers
│   └── socketHandlers.ts   # Wires server-pushed events into the store
├── store/
│   └── gameStore.ts        # Zustand store: rooms, current game, player identity, lastError
└── theme/
    └── colors.ts           # Classic Mahogany palette + presets + spacing/radii/elevation
```

## The "Classic Mahogany" design system

Warm dark mahogany backdrop, oval forest-felt table with double gold rail,
brass action buttons, cream Russian-style cards with monogram face cards
(B/D/K/A) and pip layouts for 6..10. All visual decisions live in
`src/theme/colors.ts`. **Never hard-code colors in components** — extend the
palette or add a `presets` style atom if you need a new token. Style atoms
like `presets.goldPill` exist to dedupe the gold-rimmed dark pill used for
name plates, count badges, and the "Du" plate.

Card sizes (`CARD_SIZES` exported from `Card.tsx`): `sm` (44×64) for
opponent stacks, `md` (64×92) for table cards, `lg` (80×116) for the
player's hand. Use `cardDims(size)` to get `{w, h}` if reserving space.

Full design rationale + handoff: `docs/superpowers/specs/2026-05-06-durak-mobile-redesign-design.md`
and `/tmp/durak-design/durak/project/Durak Classic.html` (the source mockup).

## Defender-flow contract (don't break this)

The defender flow in `GameScreen.tsx` is **hand-first, single-tap when possible**:

1. Defender taps a card from their hand.
2. If exactly one undefended attack on the table can be beaten by it → emit `DEFEND_CARD` immediately.
3. If multiple → set `selectedCardId`, highlight candidate attack cards via `candidateAttackIds`. Defender then taps one attack to commit.
4. If zero → toast "Diese Karte schlägt keinen Angriff". No state change.

The reverse flow (tap-attack-first) was removed deliberately. Don't reintroduce a `pendingAttackId` state.

## Adding a UI component

1. New file in `src/components/`. Export a single `React.FC<Props>` named after the file.
2. Use `colors`, `spacing`, `radii`, `elevation` from `theme/colors.ts`. No literal hex values.
3. Set `minHeight: 48` on tappable elements (accessibility).
4. Run `npm run typecheck --workspace @durak/mobile`.

## Errors → Toast

There is exactly one error sink: `useGameStore.lastError`. Set it via `setError(msg)`; the global `<Toast>` mounted in `GameScreen` renders it for ~3 s and auto-clears. Don't add inline error text in screens — it competes with the toast.

## German copy

User-facing strings are German. Keep variable names and code comments English. Common terms:

| German | English | Used for |
|---|---|---|
| Du greifst an | You attack | RoleBanner attacker |
| Du verteidigst | You defend | RoleBanner defender |
| Fertig | Done | End-turn button (German equivalent of "Bito") |
| Nehmen | Take cards | Defender concedes |
| Weiterschieben | Pass on | Redirect attack to next player |
| Trumpf | Trump | Trump suit |
| Nachziehstapel / Abwurf | Deck / Discard | Top-of-table labels |
| Verteidigen oder Weiterschieben | Defend or pass on | RoleBanner sub-line for defender |

## Future: App Store deploy

Not set up yet. When ready:

- **EAS Build**: `npx eas build --platform ios --profile production`. EAS handles npm-workspace monorepos natively — point `eas.json` at `apps/mobile`.
- **EAS Update**: OTA updates for JS-only changes (no App Store re-review needed).
- **API versioning**: before first release, add a `protocolVersion` field to `JOIN_LOBBY` so old clients can be told to update. Backend should refuse mismatched majors.
- **Environment**: `EXPO_PUBLIC_API_URL` must point at the production backend URL via the EAS profile.
