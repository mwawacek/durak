# Refactor Plan: `apps/mobile` (React Native / Expo) → `apps/web` (Vite + React)

**Goal:** Replace the Expo React Native client with a mobile-first web client (Vite + React 18 + TS strict). Backend and `@durak/shared` stay untouched.

**Architecture:** New `apps/web/` package using Vite, React Router for routes (including shareable `/r/:roomId`), TailwindCSS for styling, Zustand store + Socket.IO client ported from mobile. Pure logic (rules selectors, store, error handling) is reused 1:1. RN-specific UI is rewritten as semantic HTML + CSS, with inline SVG for card visuals and Framer Motion for play/take animations.

**Tech Stack:** Vite 5, React 18, TypeScript 5 strict, React Router 6, Tailwind 3, socket.io-client 4, Zustand 4, Framer Motion 11, lucide-react, clsx, tailwind-merge, ESLint + Prettier.

---

## 1. Inventory — what happens to each existing file

### `packages/shared/` — untouched

Stays as-is. All types and pure functions (`beats`, `canPileOn`, `canRedirectWith`, etc.) are consumed by the new web app via the existing workspace dep.

### `apps/backend/` — untouched

`main.ts` already has `enableCors`; gateway is `cors: { origin: '*' }`. Nothing to change.

### `tools/bot.mjs` — untouched

Imports from `@durak/shared/dist` only. No mobile dependency.

### `apps/mobile/` — deleted at end of Phase 4

| File                                  | Disposition  | Notes                                                                                        |
| ------------------------------------- | ------------ | -------------------------------------------------------------------------------------------- |
| `App.tsx`, `index.ts`                 | Replace      | Becomes `apps/web/src/main.tsx` + `App.tsx` (React Router root).                             |
| `app.json`, `babel.config.js`         | Delete       | Expo-only.                                                                                   |
| `metro.config.js`                     | Delete       | Metro bundler-only.                                                                          |
| `tsconfig.json`                       | Replace      | New `tsconfig.json` extending `tsconfig.base.json` with `jsx: "react-jsx"`, `lib: ["DOM"]`. |
| `CLAUDE.md`                           | Replace      | New `apps/web/CLAUDE.md` documenting the web stack.                                          |
| `src/navigation/RootNavigator.tsx`    | Replace      | Becomes React Router config in `App.tsx`.                                                    |
| `src/screens/LoginScreen.tsx`         | Port (UI)    | Logic re-used; layout via HTML/Tailwind. Name persisted to LocalStorage.                     |
| `src/screens/LobbyScreen.tsx`         | Port (UI)    | Same logic; HTML/Tailwind UI; modal becomes dialog.                                          |
| `src/screens/GameScreen.tsx`          | Port (UI)    | Heaviest screen — keeps the defender-flow contract verbatim.                                |
| `src/services/socket.ts`              | Port (logic) | Strip `NativeModules` import; resolve API URL via `import.meta.env.VITE_API_URL` + window location. |
| `src/services/socketHandlers.ts`      | Reuse        | Copy verbatim with updated import paths.                                                     |
| `src/store/gameStore.ts`              | Reuse        | Pure Zustand, framework-agnostic. Copy verbatim.                                             |
| `src/hooks/useGameRules.ts`           | Reuse        | Pure derivation. Copy verbatim.                                                              |
| `src/hooks/useTableLayout.ts`         | Port (DOM)   | Swap `Dimensions.get('window')` → window size hook.                                          |
| `src/theme/colors.ts`                 | Reinterpret  | Palette values move into `tailwind.config.ts` as design tokens.                              |
| `src/components/Card.tsx`             | Rewrite (SVG)| Same visual spec; inline SVG faces (pips, corner ranks, face medallions) + CSS card back.    |
| `src/components/PlayerHand.tsx`       | Rewrite      | Fan via CSS `transform: rotate(...) translateY(...)`.                                        |
| `src/components/BattleField.tsx`      | Rewrite      | CSS grid + pulsing outline (CSS animation, not Animated.Value).                              |
| `src/components/OvalTable.tsx`        | Port (SVG)   | Already SVG (`react-native-svg`); rewrite as inline `<svg>` JSX.                             |
| `src/components/PlayerSeat.tsx`       | Rewrite      | Divs + Tailwind. Use new Avatar.                                                             |
| `src/components/TrumpReservoir.tsx`   | Rewrite      | Divs + the new Card component.                                                               |
| `src/components/BrassButton.tsx`      | Rewrite      | `<button>` with gradient backgrounds via Tailwind.                                           |
| `src/components/RingedAvatar.tsx`     | Rewrite      | Div with CSS gradient.                                                                       |
| `src/components/Toast.tsx`            | Rewrite      | Headless animation via Framer Motion, fixed-position banner.                                 |

---

## 2. New `apps/web/` directory structure

```
apps/web/
├── public/
│   ├── icon-192.png             # PWA icon
│   ├── icon-512.png             # PWA icon
│   ├── apple-touch-icon.png     # iOS home-screen icon
│   └── manifest.webmanifest     # Add-to-home-screen manifest
├── index.html                   # viewport meta, theme-color, manifest link
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts               # Vite + React plugin + alias '@'
├── tailwind.config.ts           # Design tokens (palette, fonts, radii, spacing, shadows)
├── postcss.config.js
├── .eslintrc.cjs
├── .prettierrc.json
├── .prettierignore
├── CLAUDE.md
└── src/
    ├── main.tsx                 # ReactDOM.createRoot
    ├── App.tsx                  # BrowserRouter + Routes + global Toast portal
    ├── index.css                # Tailwind base + globals (safe-area, fonts, body bg)
    ├── env.d.ts                 # Vite's import.meta.env types
    ├── lib/
    │   ├── cn.ts                # clsx + tailwind-merge helper
    │   ├── persistence.ts       # LocalStorage helpers (name, last room, player id)
    │   ├── vibrate.ts           # navigator.vibrate wrapper (silently no-ops on iOS)
    │   └── logger.ts            # debug-only console wrapper
    ├── services/
    │   ├── socket.ts            # io() singleton + emitAck / emitAckOrToast
    │   └── socketHandlers.ts    # Server → store wiring
    ├── store/
    │   └── gameStore.ts         # Zustand store (rooms, game, identity, lastError)
    ├── hooks/
    │   ├── useGameRules.ts      # Pure rules selectors (reused verbatim)
    │   ├── useTableLayout.ts    # Ellipse geometry + seat layout — uses window resize
    │   ├── useWindowSize.ts     # Reusable resize listener
    │   ├── useNamePersistence.ts# Hydrates store with name from LocalStorage
    │   ├── useReconnect.ts      # Restores last room on connect
    │   └── usePreventTouchZoom.ts # iOS pinch-zoom prevention for game route
    ├── routes/
    │   ├── LobbyRoute.tsx       # / and /lobby — name modal (if needed) + room list
    │   ├── RoomRoute.tsx        # /r/:roomId — waiting or game (switches on state)
    │   └── NotFoundRoute.tsx    # fallback
    ├── features/
    │   ├── lobby/
    │   │   ├── RoomList.tsx
    │   │   ├── RoomRow.tsx
    │   │   ├── CreateRoomDialog.tsx
    │   │   ├── MyRoomPanel.tsx
    │   │   └── NameEntryModal.tsx
    │   ├── waiting/
    │   │   └── WaitingRoom.tsx  # Pre-game player list + host's start button + share button
    │   └── game/
    │       ├── GameTable.tsx    # Top-level layout (table layer + bottom strip)
    │       ├── OvalTable.tsx    # SVG felt
    │       ├── OpponentSeat.tsx
    │       ├── TrumpReservoir.tsx
    │       ├── DiscardIndicator.tsx
    │       ├── BattleField.tsx
    │       ├── PlayerHand.tsx
    │       ├── ActionBar.tsx    # banner + buttons + you-plate
    │       └── GameOverDialog.tsx
    ├── components/
    │   ├── Card.tsx             # Inline-SVG card + back
    │   ├── BrassButton.tsx      # gradient button, 3 variants + active
    │   ├── RingedAvatar.tsx
    │   ├── Toast.tsx            # Auto-dismiss banner driven by store.lastError
    │   ├── ConnectionBadge.tsx  # Top-right WiFi/connected indicator
    │   └── ShareButton.tsx      # /r/:roomId copy-to-clipboard (Web Share API if available)
    └── theme/
        └── tokens.ts            # Const mirrors of tailwind tokens (for inline SVG fills, etc.)
```

---

## 3. React Router routes

```tsx
<Routes>
  <Route path="/" element={<LobbyRoute />} />
  <Route path="/lobby" element={<Navigate to="/" replace />} />
  <Route path="/r/:roomId" element={<RoomRoute />} />
  <Route path="*" element={<NotFoundRoute />} />
</Routes>
```

- **`/`** — `LobbyRoute`. If no persisted name → render `<NameEntryModal>` (blocking); on submit, store name + join lobby. Otherwise show room list + create-room button.
- **`/r/:roomId`** — `RoomRoute`. Read `roomId` from params. If no name → show `<NameEntryModal>` first. After name: emit `joinLobby` + `joinRoom`. Then:
  - Room not found / closed → error screen "Raum nicht gefunden" with "Zur Lobby" link.
  - Room status = `lobby` and player is in it → render `<WaitingRoom>`.
  - Room status = `in-game` and player is in it → render `<GameTable>`.
  - Room status = `in-game` and player not in it → "Spiel läuft bereits — warten oder Lobby" with link.

### Identity / persistence model

| Key              | What                                 | Source of truth   |
| ---------------- | ------------------------------------ | ----------------- |
| `durak.name`     | Player's display name                | LocalStorage      |
| `durak.playerId` | Server-assigned id from JOIN_LOBBY   | LocalStorage      |
| `durak.lastRoom` | Room id last joined                  | LocalStorage      |

Reconnect after refresh:
1. Boot → hydrate name, playerId, lastRoom from LocalStorage.
2. Connect socket → emit `JOIN_LOBBY` with the stored name.
3. Backend grace period (30 s) re-attaches the player if same name + room is still active. If server returns a different playerId, accept the new one (a stale lastRoom may be unjoinable — fall through to lobby).
4. If `lastRoom` set, attempt `JOIN_ROOM`. On success and room is `in-game`, navigate to `/r/<roomId>`.

---

## 4. Component tree (functional)

```
App
├── ConnectionBadge (global, fixed-position)
├── Toast (global, fixed-position)
└── Routes
    ├── LobbyRoute
    │   ├── (maybe) NameEntryModal
    │   ├── MyRoomPanel       (if I'm in one)
    │   ├── CreateRoomDialog  (modal)
    │   └── RoomList
    │       └── RoomRow[]
    └── RoomRoute
        ├── (maybe) NameEntryModal
        ├── (status=lobby) WaitingRoom
        │   ├── PlayerList
        │   ├── ShareButton (copy /r/<id> URL)
        │   └── BrassButton "Spiel starten" (host only)
        └── (status=in-game) GameTable
            ├── OvalTable            (SVG felt + rails)
            ├── OpponentSeat[]       (positioned on the rim)
            ├── TrumpReservoir
            ├── DiscardIndicator
            ├── BattleField
            ├── ActionBar
            │   ├── RoleBanner
            │   ├── YouPlate (RingedAvatar + name + role)
            │   └── BrassButton[]    ("Fertig", "Nehmen", "Weiterschieben")
            ├── PlayerHand
            │   └── Card[]
            └── GameOverDialog       (when phase = finished)
```

---

## 5. RN → Web mapping (cheat sheet)

| React Native                              | Web equivalent                                      |
| ----------------------------------------- | --------------------------------------------------- |
| `<View>`                                  | `<div>`                                             |
| `<Text>`                                  | `<span>` / `<p>` / `<h1>`                           |
| `<TouchableOpacity onPress>`              | `<button onClick>` with `:active` opacity           |
| `<ScrollView horizontal>`                 | `<div class="overflow-x-auto …">`                   |
| `<FlatList>`                              | `Array.map` over a `<div>` list                     |
| `<Modal>`                                 | `<dialog>` (or fixed overlay div with click-outside)|
| `<TextInput>`                             | `<input type="text">`                               |
| `StyleSheet.create`                       | Tailwind classnames + `cn()` helper                 |
| `LinearGradient`                          | Tailwind `bg-gradient-to-b from-… to-…` / inline CSS gradient |
| `Animated.Value` / `Animated.timing`      | Framer Motion `motion.*` + `animate` / CSS keyframes|
| `react-native-svg` `<Svg>`                | inline `<svg>` JSX (same primitives, lowercase tags)|
| `useSafeAreaInsets`                       | CSS `env(safe-area-inset-*)` + `viewport-fit=cover` |
| `Dimensions.get('window')`                | `window.innerWidth/innerHeight` via `useWindowSize` |
| `Platform.select`                         | static (web is single platform)                     |
| `Alert.alert`                             | `GameOverDialog` (controlled component, not blocking native dialog) |

---

## 6. Store strategy

`gameStore.ts` is copied verbatim. It's pure Zustand — no RN imports.

New keys added to the store:
- (none — keep the store minimal; LocalStorage hydration happens via dedicated hooks that call `setIdentity` and `setCurrentRoom`)

The previously omitted "persist" middleware is intentionally not used; we hydrate via a small `useNamePersistence` hook on mount so we control exactly which keys persist (`name`, `playerId`, `lastRoom`).

---

## 7. Mobile-first compliance plan (per spec)

| Requirement                            | Where it lives                                                   |
| -------------------------------------- | ---------------------------------------------------------------- |
| `viewport-fit=cover` meta              | `index.html`                                                      |
| Safe-area insets                       | Tailwind plugin or `pt-[env(safe-area-inset-top)]` utilities      |
| 44×44 px touch targets                 | All buttons get `min-h-11 min-w-11`                              |
| No hover-only feedback                 | All interactions have `:active` + `:focus-visible` states         |
| `font-size: 16px` on inputs            | Global rule in `index.css`                                       |
| `100dvh` (not `100vh`)                 | Tailwind `min-h-dvh` (Tailwind 3.4+ supports `dvh` natively)     |
| Tap-highlight + user-select disabled   | Body-level rule in `index.css`                                   |
| Haptics                                | `vibrate(20)` on play / take / bito                              |
| PWA manifest + icons                   | `public/manifest.webmanifest` + meta links in `index.html`       |
| Code-splitting for game route          | React.lazy on `RoomRoute`'s game branch                          |
| Smooth-scroll roomlist                 | `scroll-smooth` + `-webkit-overflow-scrolling: touch`            |

---

## 8. Step-by-step execution

Each step ends with a Definition of Done (DoD). After each step: `npm run typecheck` + `npm run lint` (where applicable) must be green, and one commit goes out.

### Step 0 — Root scripts update

Modify `package.json` (root) scripts: rename `dev:mobile` → keep until phase 4 deletion, add `dev:web`, `build:web`. Adjust workspaces (`apps/*` covers `apps/web` once it exists).
**DoD:** `npm run typecheck` still passes; new scripts visible.

### Step 1 — Scaffold `apps/web/`

Create the package: `package.json`, `tsconfig.json` (extends `tsconfig.base.json`, JSX `react-jsx`, lib `DOM`), `vite.config.ts`, `index.html` (with viewport meta, theme-color, manifest link, apple-mobile-web-app-capable), `src/main.tsx`, `src/App.tsx` (empty Routes stub), `src/index.css` (Tailwind directives), Tailwind config with the design tokens, PostCSS config, ESLint flat config, Prettier config.
Add `react`, `react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `typescript`, `tailwindcss`, `postcss`, `autoprefixer`, ESLint + plugins, `prettier` as devDeps. Install with `npm install`.
**DoD:** `npm run dev:web` boots Vite, browser shows a black page with "Durak — booting"; `npm run typecheck` green; `npm run lint` green.

### Step 2 — Design tokens in Tailwind config

Translate `apps/mobile/src/theme/colors.ts` into `tailwind.config.ts`:
- `colors`: `mahogany`, `felt`, `gold`, `burgundy`, `cream`, `ink`, semantic aliases (`bg`, `border`, `accent`, `danger`, `success`, `warning`).
- `fontFamily`: `serif: ['Georgia', 'serif']`, `sans: ['system-ui', ...]`.
- `borderRadius`: `card: 0.5rem`, `pill: 9999px`.
- `boxShadow`: `card`, `raised`, `brass`.
- Extend `spacing` if needed; use Tailwind default 4 px scale.
Mirror the relevant subset into `src/theme/tokens.ts` (for inline SVG fills that can't use Tailwind classes).
**DoD:** Tokens importable from `'@/theme/tokens'`; Tailwind classes like `bg-mahogany-dark` work in a quick demo div.

### Step 3 — `lib/cn.ts`, `lib/persistence.ts`, `lib/vibrate.ts`, `lib/logger.ts`

Tiny utilities. Persistence uses `safeJsonParse` + `safeJsonStringify` + typed getter/setter for the three keys.
**DoD:** Imports resolve; unit-test-shaped sanity (return correct value, fall through on empty) — verified manually via console in dev.

### Step 4 — Port the store + rules hook

Copy `gameStore.ts` and `useGameRules.ts` verbatim into `apps/web/src/store/` and `apps/web/src/hooks/`. Adjust import paths.
**DoD:** `npm run typecheck` green; both compile against `@durak/shared`.

### Step 5 — Port the socket layer

Create `src/services/socket.ts`:
- API URL resolved by: `import.meta.env.VITE_API_URL` → else `${window.location.protocol}//${window.location.hostname}:3000` in dev, else `window.location.origin`.
- Same `emitAck` and `emitAckOrToast` helpers as mobile (no platform code).

Create `src/services/socketHandlers.ts`: identical to mobile.

**DoD:** Calling `getSocket()` in dev connects; `npm run typecheck` green.

### Step 6 — `App.tsx` + Router + global Toast + ConnectionBadge

Wire `BrowserRouter`, three Routes (lobby, room, 404). Attach socket handlers in `useEffect`. Mount `<ConnectionBadge>` and `<Toast>` portals. Add `useNamePersistence` so the store is hydrated.
**DoD:** Loading `http://localhost:5173/` renders an empty Lobby placeholder; ConnectionBadge shows "verbunden" once the backend is running; toast can be triggered by `useGameStore.getState().setError('test')` in the console.

### Step 7 — `Card.tsx` (visual centerpiece)

Build the inline-SVG card. One root `<div>` with absolute-positioned `<svg>` children:
- Card face: gradient background, two corner labels (rank + suit glyph), and either a pip layout (`6..10`) or a face medallion (`J/Q/K/A`). All sizes derived from a single `w` prop (parity with `cardDims('lg' | 'md' | 'sm')`).
- Card back: burgundy gradient, gold rosette pattern in the centre, 4 corner pip circles — composed of nested SVG rects + circles.
- Props: `card`, `faceDown`, `onPress`, `selected`, `trumpHighlight`, `playable`, `defended`, `rotate`, `size`, `className`.
**DoD:** Quick scratch route (`/__cards`) shows all four suits at sm/md/lg and the back. Visual matches the mobile palette.

### Step 8 — `BrassButton.tsx`, `RingedAvatar.tsx`, `Toast.tsx`

Port the three small primitives. Tailwind `bg-gradient-to-b from-gold-light via-gold to-gold-deep` etc. for variants. `RingedAvatar` uses radial gradient via inline `style`. `Toast` uses Framer Motion `<AnimatePresence>` + `motion.div`.
**DoD:** Storybook-less smoke: button reacts to `:active`, avatar gradient looks right, toast slides in/out with 3-second auto-dismiss.

### Step 9 — Lobby route (no game yet)

Build `LobbyRoute`, `NameEntryModal`, `RoomList`, `RoomRow`, `MyRoomPanel`, `CreateRoomDialog`. Logic mirrors mobile `LobbyScreen.tsx`. Use the bot (`npm run bot -- TestBot --host-room`) to verify the room shows up.
**DoD:** From a fresh browser tab, can enter a name, see bot's room, join it. Bot logs reflect the join.

### Step 10 — Waiting room + share URL

Build `WaitingRoom` for `RoomRoute` when status = `lobby`. Show player list, host's start button, share-link button (clipboard or Web Share API). Add deep-link join: if user opens `/r/<id>` with no name → modal asks name → auto-joins.
**DoD:** Open `http://localhost:5173/r/<roomId>` in a 2nd browser, name modal appears, on submit the bot sees a join. Player list updates live.

### Step 11 — Game table layout

Build `GameTable.tsx`. Reproduce mobile geometry using `useTableLayout` (DOM port) — same ellipse + seat angles. Render `OvalTable` (inline SVG), `OpponentSeat`s on the rim, `TrumpReservoir` and `DiscardIndicator` inside the felt, `BattleField` centered, `ActionBar` + `PlayerHand` at the bottom (above safe-area inset).
**DoD:** A 2-player game between web + bot renders; all UI elements visible; no overlap on a 390×844 iPhone-12 viewport in DevTools.

### Step 12 — Tap interactions (attack / defense / pile-on / take / bito / weiterschieben)

Port the `handleCardSelect`, `handleAttackTap`, `handleEndTurn`, `handleTake`, `redirectMode` flow from mobile verbatim into `GameTable`. Wire vibration on each commit.
**DoD:** Full smoke game: open lobby, host bot, join, attack, bot defends; bot attacks, you defend (single-candidate auto-commit + multi-candidate two-tap). Take + Bito buttons work. Weiterschieben works when conditions met.

### Step 13 — Reconnect + disconnect UX

On boot, hydrate `lastRoom` + emit `joinLobby` then `joinRoom`. Show ConnectionBadge with red/green dot. On disconnect, banner "Verbindung getrennt — versuche neu zu verbinden" stays until reconnect. Server `errorMessage` events go through existing `setError` → `Toast`.
**DoD:** Kill the backend mid-game; UI shows disconnected. Restart backend within 30 s; web client reconnects, store re-attached, UI catches up to the latest gameState.

### Step 14 — Mobile-first compliance pass

Verify checklist from §7. Add manifest, apple-touch-icon, theme-color. Add CSS:
- `body { -webkit-tap-highlight-color: transparent; user-select: none; }`
- `.card, .seat { -webkit-user-select: none; touch-action: manipulation; }`
- `input { font-size: 16px; }`
- Safe-area utilities applied to the game route's outer container.
Add `vite-plugin-pwa` only if it doesn't bloat the build — otherwise hand-write a tiny SW or skip SW entirely (manifest alone enables A2HS).
**DoD:** iPhone-12 DevTools profile: Lighthouse PWA criteria green for installability (manifest + icons), no horizontal scroll, all touch targets ≥ 44 px, no iOS zoom on input focus.

### Step 15 — Design polish (frontend-design Skill)

Engage the `frontend-design` skill. Iterate on:
- Felt depth (radial gradient + subtle noise), gold rail glow, table elevation shadow.
- Card typography — confirm corner rank/suit alignment, face medallion proportions, pip kerning.
- Empty state for the lobby (no rooms) and loading state for "warte auf Spielstart".
- Card play animation (Framer Motion: cards transition from hand position into the battlefield slot with a 250 ms ease).
- Take animation: cards slide off the table to the defender's seat.
- Bito animation: cards fade into the discard.
- Game-over screen design.
- Connection badge style.
**DoD:** Project no longer looks "Tailwind generic" — has a defined visual signature consistent across all routes.

### Step 16 — Delete `apps/mobile/` (executed earlier than planned)

`rm -rf apps/mobile`. Verify no remaining imports.
Remove `apps/mobile`-specific deps from root if any (none expected; deps were already in mobile's own `package.json`).
Update root `package.json` scripts: remove `dev:mobile`, leave only the web ones.
Run `npm install` from root to clean lockfile.

**Note — deviation from the planned order:** This step was executed during Phase 3 Step 9 because the React 18 (web) vs React 19 (mobile) `@types/react` collision blocked `npm run typecheck`. The new `overrides` block in the root `package.json` pins both `@types/react` and `@types/react-dom` to the 18.x line, and was added together with the mobile deletion.

**DoD:** `git ls-files apps/` shows only `apps/backend` and `apps/web`. Root `npm run typecheck` is green.

### Step 17 — README + REFACTOR_DONE.md

Rewrite the mobile section of `README.md`: replace with a Web section (`npm run dev:web`, browser at `http://localhost:5173`, deploy notes deferred). Update bot section to "open the web app in another tab/device".
Write `REFACTOR_DONE.md`: what changed, known gaps, follow-ups.
**DoD:** Repo root is clean; README matches reality.

---

## 9. Risks & open questions

1. **iOS Safari 100vh quirk** — every full-height layer in the game must use `100dvh` / `min-h-dvh`. Easy to miss in nested containers; rely on a single outermost `min-h-dvh` and inner `flex-1`.
2. **Hand fanning on small screens** — `useWindowSize` may report different values than `window.innerWidth` after the URL bar collapses on scroll. Test with the URL bar both open and collapsed; lock the layout to `dvh` so it doesn't jump.
3. **Drag-to-play deferred** — Spec says tap-flow first; drag is a "bonus". Plan does **not** include drag in v1. If time allows, add as a Step 15.5 in the design polish phase.
4. **Reconnect ID mismatch** — Backend's 30-s grace period works by player name + room. If the server returns a different `playerId` than the stored one, we accept the new one and clear `lastRoom`. Documented in `useReconnect`.
5. **`gameStateUpdate` arrives before route navigation** — Lobby may receive a `gameStateUpdate` for a room I joined before React Router has transitioned. Solution: `LobbyRoute` watches `currentRoomId` and `rooms` and navigates to `/r/<id>` on transition into `in-game`.
6. **Card SVG perf** — Up to ~20 cards visible (hand + table + opponent stacks). Inline SVG with memoized components should be fine; if profiling shows jank, switch to a single `<canvas>` for the back-pattern (not anticipated).
7. **A2HS icons** — Need 192×192 and 512×512 PNGs. We'll generate a simple gold-on-mahogany "D" mark from a tiny canvas script committed alongside, or include placeholders and a TODO.
8. **PWA SW** — Out of scope per "no deployment". A2HS works without a service worker, so we skip SW entirely.
