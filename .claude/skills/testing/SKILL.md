---
name: testing
description: Conventions for writing and running unit tests in this monorepo. Use when adding tests, fixing failing tests, or setting up test infrastructure for a new package.
---

# Testing — conventions for this repo

## Stack

- **Jest** with **ts-jest** for transformation.
- TypeScript strict mode (matches workspace tsconfigs).
- Tests live next to source files as `*.spec.ts`.
- No mocks for our own code unless absolutely necessary — the engine is
  pure, the rules helpers are pure, exercise them directly.
- NestJS controllers/gateways are NOT unit-tested here (they're thin
  glue around the engine). If we ever add integration tests they go
  in `apps/backend/test/*.e2e.ts`.

## Where tests live

| Module | Test location | Run |
|---|---|---|
| `packages/shared/src/rules.ts` etc. | `packages/shared/src/*.spec.ts` | `npm run test --workspace @durak/shared` |
| `apps/backend/src/game/*.ts` | `apps/backend/src/game/*.spec.ts` | `npm run test --workspace @durak/backend` |
| All workspaces | — | `npm run test` (root) |

Mobile (`apps/mobile`) has no Jest setup yet — defer until there's
non-trivial logic outside React components.

## AAA pattern (mandatory)

Every test follows **Arrange / Act / Assert**, with explicit blank-line
separation:

```ts
it('beats with same suit higher rank', () => {
  // Arrange
  const attack = card('7', 'spades');
  const defense = card('J', 'spades');

  // Act
  const result = beats(attack, defense, null);

  // Assert
  expect(result).toBe(true);
});
```

Don't squash into one line "to be concise". The pattern's value is that
the *next* reader instantly sees what's set up, what's exercised, and
what's verified.

## Test naming

- `describe('functionName', ...)` → groups by symbol under test.
- `it('verbs the right thing in some condition', ...)` → declarative
  outcome. Avoid "should" prefix (Jest convention drift).

Examples:
- ✅ `it('refuses a defense that does not beat the attack')`
- ✅ `it('rotates attacker to the previous defender after Bito')`
- ❌ `it('should work')`, `it('test 1')`, `it('beats() — case 5')`

## Builders, not literals

Repeating long object literals across tests rots fast. Use builders.
The shared and engine test suites each have a small `_test-helpers.ts`
that exports:

- `card(rank, suit)` — `Card` literal with derived id.
- `pair(attackRankSuit, defenseRankSuit?)` — `AttackPair`.
- `state(overrides)` — initial `GameStateInternal` with sensible defaults
  (2 players, 6 cards each, hearts trump, etc.).

Tests should call `state({ table: [...], attackerIdx: 1 })` and avoid
constructing a full state object inline.

## What to test

For pure rule functions:

- Each branch of an `if` should have at least one positive and one
  negative test (e.g. `beats`: same-suit-higher, same-suit-lower,
  trump-vs-non-trump, trump-vs-trump-higher, trump-vs-trump-lower).
- Each `throw new GameRuleError(...)` path in the engine should have a
  test that triggers it and asserts the `code` and (loosely) the
  message.
- The "happy path" of every public engine function: one realistic
  scenario from setup → action → assert resulting state.

For state machines (engine):

- Test the **observable result**, not internal state shape: assert on
  `s.table`, `s.players[i].hand.length`, `s.attackerIdx`, etc.
- Exercise the canonical scenarios from the rules skill (Bito, take,
  redirect, pile-on, auto-pass, full-table cap, simultaneous-finish).
- Bug regressions: when fixing a bug, **add a failing test first**, fix
  the bug, verify the test passes. The diff in `git log -p` then shows
  the regression test alongside the fix.

## What NOT to test

- React Native components (no Jest setup, use the bot for end-to-end).
- Socket.IO event wiring (controllers/gateways) — that's integration
  territory; covered by manual smoke tests with the bot.
- Third-party libs (Zustand, expo-linear-gradient, Socket.IO).
- Trivial getters / pure data transforms with no logic.

## Running tests

```bash
# Single workspace
npm run test --workspace @durak/backend
npm run test --workspace @durak/shared

# All workspaces
npm run test

# Watch mode (during dev)
npm run test --workspace @durak/backend -- --watch

# Single file
npm run test --workspace @durak/backend -- game.engine.spec.ts

# Single test by name
npm run test --workspace @durak/backend -- -t "beats with trump"
```

## CI gating

Currently no CI. When CI is added, tests should be the **first** check
to run after typecheck — they're fast and protect the rule layer that
matters most. Lint can come third.

## When to invoke this skill

- Adding a new test file.
- Setting up Jest in a new workspace.
- Reviewing a PR that changes engine or shared rules — check the test
  diff alongside the source diff.
- A test fails and you're tempted to delete it — read this first; if
  the test is correct, fix the code. If the test is wrong, replace it
  with one that verifies the new contract.
