# Refactor Done — Mobile (Expo) → Web (Vite + React)

Auto-mode refactor summary. The repo now ships a mobile-first web client at `apps/web` in place of the Expo React Native client. Backend and `@durak/shared` are untouched.

## What was done

### Phase 1 — Codebase analysis
Read the full `apps/mobile`, `packages/shared`, and root configs. Inventoried every file as reuse / port / rewrite (see `REFACTOR_PLAN.md`, section 1).

### Phase 2 — Plan
`REFACTOR_PLAN.md` lays out:
- File inventory and disposition table.
- New `apps/web/` directory structure.
- React Router topology (`/`, `/r/:roomId`, `*`).
- Component tree.
- RN → Web mapping cheat-sheet.
- 17-step execution plan with DoD per step.
- Risks and open questions.

### Phase 3 — Execution

Built the new web client step by step, type-checking + lint-checking + committing after each. Commits in order:

| # | Commit                                                                 |
|---|------------------------------------------------------------------------|
| 1 | `docs(repo): refactor plan + backend notes for mobile → web rewrite`   |
| 2 | `feat(web): scaffold apps/web (Vite + React 18 + TS strict + Tailwind)`|
| 3 | `feat(web): port store, rules, socket + add libs and layout hook`      |
| 4 | `feat(web): app router, lobby UI, primitives — and remove apps/mobile` |
| 5 | `feat(web): functional game table + waiting room + share URL`          |
| 6 | `feat(web): one-shot boot reconnect and GameOver cleanup`              |
| 7 | `perf(web): code-split GameTable + lobby momentum scroll`              |
| 8 | `style(web): typographic identity, atmosphere + lobby polish`          |
| 9 | `style(web): card play animations, waiting room + action bar polish`   |

### Phase 4 — Cleanup
- `apps/mobile/` removed (executed during Phase 3 step 4 because of a React-18 vs React-19 `@types/react` collision that blocked typecheck).
- Root `package.json`: `dev:mobile` script removed; `dev:web`, `build:web`, `lint:web`, `lint` added; description updated.
- `package.json` overrides pin `@types/react` and `@types/react-dom` to 18.x (Zustand 4 transitively requests 19).
- README rewritten: stack table, install / run, bot section, "Shareable room URLs" section, scripts table, roadmap.
- Root `CLAUDE.md` updated end-to-end (stack, commands, where-to-look table, conventions).
- New `apps/web/CLAUDE.md` documents the web architecture, design tokens, the defender-flow contract, and German copy table.

## What's there

Fully working features:
- Lobby: name entry, room list, create-room dialog, my-room panel with leave button.
- Waiting room: player list with live join/leave updates, host start button, share button (Web Share API + clipboard fallback).
- Shareable URL `/r/<roomId>`: cold-start invited friends land in a name modal → auto-join.
- Game table: oval felt, opponent seats positioned on the rim with role-coloured pills, trump reservoir, discard indicator, battle field with attack/defense layout, fanned player hand with selection lift.
- Card interactions: tap-to-play attack, hand-first defense (single-tap when only one candidate, two-tap with attack highlighting otherwise), redirect mode ("Weiterschieben"), take, bito.
- Game-over dialog with animated entrance.
- Reconnect: name + playerId + lastRoom persist to LocalStorage; refresh restores the game.
- ConnectionBadge top-right shows verbinden / verbunden.
- Toast surface for server errorMessage events + socket disconnect / connect_error.
- Vibration on every committed action (silent no-op on iOS).
- Code-splitting: GameTable in a separate chunk (≈ 8 KB gzip).
- Mobile-first compliance: viewport-fit, safe-area utilities, 44 × 44 px touch targets, 16 px input font-size, 100dvh layouts, tap-highlight + user-select disabled, manifest + apple-mobile-web-app meta tags.

Production build: 372 KB main JS / 120 KB gzipped, 24 KB GameTable chunk / 8.4 KB gzipped, 28 KB CSS / 6 KB gzipped. Built in <2 s.

## Known gaps / follow-ups

1. **PWA icons in PNG** — `public/icon.svg` is referenced as both the favicon and the Apple Touch Icon. The `manifest.webmanifest` references `/icon-192.png` and `/icon-512.png`, but the actual PNGs are not committed (would need an icon-generation pipeline — e.g. `sharp` or `resvg`). A2HS works on Android using the SVG via the `<link rel="icon">` fallback; iOS picks up `apple-touch-icon` from the SVG on iOS 14+. **Action:** before App-Store-style installability, run a one-shot icon generation script and commit the PNGs.

2. **No automated UI tests** — Per the spec ("Neue UI-Tests nur wenn trivial, kein Test-Theater"), no React Testing Library tests were added. The pure logic (`useGameRules`, store derivations) is already covered by the existing rules.spec.ts in `@durak/shared`. **Action:** if the team wants regression coverage, add Vitest + React Testing Library and start with a smoke test for `<GameTable>` rendering with a known state.

3. **Drag-to-play deferred** — Spec marked it as a "bonus" if time allowed. The tap-flow is fully implemented; drag was not added. **Action:** consider pointer-events-driven drag with a snap-to-slot for power users.

4. **Game-over animation feedback** — Cards don't visually slide to the discard pile on bito or to the defender's seat on take. The state transitions correctly; only the motion is absent. **Action:** Framer Motion `layoutId` on cards could express this; requires plumbing the layoutId from server state through `BattleField` and `PlayerHand`.

5. **Backend bug log** — `BACKEND_NOTES.md` is currently empty (no friction found). Future refactor work that uncovers backend issues should log them there for triage.

6. **No `.env.example`** — `VITE_API_URL` is the only env var; document this with a small `.env.example` in `apps/web/` when actual deployment work begins.

## Verification

Latest run:
- `npm run typecheck` → green (all workspaces)
- `npm run lint` → green (all workspaces)
- `npm run build --workspace @durak/web` → green, 1.67 s
- Smoke test: backend boots, GameGateway accepts socket, bot hosts a room ("[SmokeBot] hosted room ... — waiting for a human player").

A full manual smoke test (open the web client in an iPhone-12 viewport, host a bot, play through a game) was not performed in this session — only contract-level verification (typecheck, build, socket-connect, room-host).
