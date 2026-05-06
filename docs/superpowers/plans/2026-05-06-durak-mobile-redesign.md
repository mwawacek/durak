# Durak Mobile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin and re-lay-out the React Native mobile app for Durak so the cards are big and readable, the role indicator never overlaps cards, the palette feels like an actual card-game table, and the defender flow takes one tap instead of two.

**Architecture:** Pure presentational refactor in `apps/mobile/src`. New theme tokens in `theme/colors.ts`. `Card`, `PlayerHand`, `Table`, `PlayerBar` get rewrites. New components: `RoleBanner`, `ActionBar`, `Toast`. `GameScreen` recomposes the layout and removes the two-step defender flow. Backend, socket protocol, and `@durak/shared` are untouched.

**Tech Stack:** React Native (Expo SDK 54), TypeScript, Zustand, react-native-safe-area-context. No new runtime dependencies. No animation libs (only RN's `Animated` from `react-native`, native driver where used).

**Verification:** No jest is configured in `apps/mobile`; this redesign is verified by `npm run typecheck` (workspace-wide) and a manual smoke test against a running backend + bot. The repo is not currently a git repository; commit steps are noted but skip-able if `git` errors with "not a repo".

**Spec:** `docs/superpowers/specs/2026-05-06-durak-mobile-redesign-design.md`

---

## File map

```
apps/mobile/src/theme/colors.ts                    rewrite — Casino Felt palette + elevation helper
apps/mobile/src/components/Card.tsx                rewrite — sizes lg=80x116, true black, serif rank
apps/mobile/src/components/PlayerHand.tsx          rewrite — lg cards, fan rotation, playable prop
apps/mobile/src/components/Table.tsx               rewrite — felt background, trump badge, ghost empty
apps/mobile/src/components/PlayerBar.tsx           rewrite — avatar, role chip, online dot
apps/mobile/src/components/RoleBanner.tsx          NEW
apps/mobile/src/components/ActionBar.tsx           NEW
apps/mobile/src/components/Toast.tsx               NEW
apps/mobile/src/screens/GameScreen.tsx             rewrite — recompose, simplify defender flow
```

LobbyScreen and LoginScreen consume only theme tokens; no edits planned.

---

## Task 1: Replace theme tokens with "Casino Felt" palette

**Files:**
- Modify: `apps/mobile/src/theme/colors.ts` (full rewrite)

- [ ] **Step 1: Read the current file**

Run: open `apps/mobile/src/theme/colors.ts` in your editor — confirm it currently exports `colors`, `spacing`, `radii`.

- [ ] **Step 2: Replace contents**

```ts
// apps/mobile/src/theme/colors.ts
import type { ViewStyle } from 'react-native';

export const colors = {
  // Surfaces
  bg: '#14181a',
  bgElevated: '#1d2326',
  felt: '#1f4d3a',
  feltEdge: '#163828',

  // Text
  text: '#f3ede1',
  textDim: '#9aa39e',

  // Lines
  border: '#2a3236',

  // Accents
  accent: '#d4a85a',
  accentStrong: '#f0c674',
  danger: '#c14a4a',
  warning: '#d4a85a',
  success: '#6a9955',

  // Card faces
  cardFace: '#fbf7ee',
  cardEdge: '#d8cdb4',
  cardSuitRed: '#b71c1c',
  cardSuitBlack: '#1a1a1a',
  cardBack: '#2c4a3a',
  cardBackPattern: '#6a9955',
} as const;

export const spacing = (n: number): number => n * 4;

export const radii = { sm: 6, md: 10, lg: 16, card: 8, pill: 999 } as const;

export const elevation = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  } satisfies ViewStyle,
  raised: {
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  } satisfies ViewStyle,
} as const;
```

- [ ] **Step 3: Typecheck**

Run from repo root: `npm run typecheck --workspace @durak/mobile`
Expected: existing files reference `colors.surface`, `colors.cardBg`, `colors.cardBorder`, `colors.red`, `colors.black` — these tokens were removed. Errors are EXPECTED here. They will be resolved by Tasks 2–8 which rewrite each consumer.

- [ ] **Step 4: Commit (skip if not in a git repo)**

```bash
git add apps/mobile/src/theme/colors.ts
git commit -m "feat(mobile): replace palette with Casino Felt theme"
```
If `git status` says "not a git repository", skip this step in every task.

---

## Task 2: Rewrite Card with new sizes, true-black, serif rank, playable prop

**Files:**
- Modify: `apps/mobile/src/components/Card.tsx` (full rewrite)

- [ ] **Step 1: Replace contents**

```tsx
// apps/mobile/src/components/Card.tsx
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import type { Card as CardType, Suit } from '@durak/shared';
import { colors, elevation, radii, spacing } from '../theme/colors';

const SUIT_GLYPH: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const isRed = (suit: Suit): boolean => suit === 'hearts' || suit === 'diamonds';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

interface Props {
  card: CardType | null;
  faceDown?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  /** false = not legally playable right now (visually de-emphasized). Defaults to true. */
  playable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

const SIZE = {
  sm: { width: 44, height: 64, rank: 12, suitCorner: 10, suitCenter: 22 },
  md: { width: 64, height: 92, rank: 18, suitCorner: 14, suitCenter: 32 },
  lg: { width: 80, height: 116, rank: 22, suitCorner: 16, suitCenter: 44 },
} as const;

export const Card: React.FC<Props> = ({
  card,
  faceDown,
  onPress,
  disabled,
  selected,
  playable = true,
  size = 'md',
  style,
}) => {
  const dims = SIZE[size];
  const suitColor = card && isRed(card.suit) ? colors.cardSuitRed : colors.cardSuitBlack;

  const content = (
    <View
      style={[
        styles.card,
        { width: dims.width, height: dims.height },
        elevation.card,
        faceDown && styles.faceDown,
        selected && [styles.selected, elevation.raised],
        !playable && !selected && styles.notPlayable,
        style,
      ]}
    >
      {faceDown ? (
        <View style={styles.backPattern}>
          <Text style={styles.backGlyph}>♦</Text>
        </View>
      ) : card ? (
        <>
          <View style={styles.cornerTop}>
            <Text style={[styles.rank, { fontSize: dims.rank, color: suitColor }]}>{card.rank}</Text>
            <Text style={[styles.cornerSuit, { fontSize: dims.suitCorner, color: suitColor }]}>
              {SUIT_GLYPH[card.suit]}
            </Text>
          </View>
          <Text style={[styles.suitCenter, { fontSize: dims.suitCenter, color: suitColor }]}>
            {SUIT_GLYPH[card.suit]}
          </Text>
          <View style={styles.cornerBottom}>
            <Text style={[styles.rank, { fontSize: dims.rank, color: suitColor }]}>{card.rank}</Text>
            <Text style={[styles.cornerSuit, { fontSize: dims.suitCorner, color: suitColor }]}>
              {SUIT_GLYPH[card.suit]}
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={disabled ? { opacity: 0.5 } : undefined}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardFace,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.cardEdge,
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(1),
    justifyContent: 'space-between',
  },
  faceDown: {
    backgroundColor: colors.cardBack,
    borderColor: colors.feltEdge,
  },
  backPattern: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: colors.cardBackPattern,
    margin: 4,
  },
  backGlyph: {
    color: colors.cardBackPattern,
    fontSize: 28,
    opacity: 0.6,
  },
  selected: {
    borderColor: colors.accentStrong,
    borderWidth: 3,
    transform: [{ translateY: -12 }],
  },
  notPlayable: { opacity: 0.45 },
  cornerTop: { alignSelf: 'flex-start', alignItems: 'center' },
  cornerBottom: { alignSelf: 'flex-end', alignItems: 'center', transform: [{ rotate: '180deg' }] },
  rank: {
    fontFamily: SERIF,
    fontWeight: '700',
    lineHeight: undefined,
  },
  cornerSuit: {
    marginTop: -2,
  },
  suitCenter: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck --workspace @durak/mobile`
Expected: still errors in Table/PlayerHand/PlayerBar/GameScreen because they pass `dimmed` (no longer a prop) and reference removed color tokens. Card.tsx itself should compile.

- [ ] **Step 3: Commit (skip if not in git)**

```bash
git add apps/mobile/src/components/Card.tsx
git commit -m "feat(mobile): redesign Card — larger sizes, serif rank, true black suits"
```

---

## Task 3: Rewrite PlayerHand with lg cards and gentle fan

**Files:**
- Modify: `apps/mobile/src/components/PlayerHand.tsx` (full rewrite)

- [ ] **Step 1: Replace contents**

```tsx
// apps/mobile/src/components/PlayerHand.tsx
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { Card as CardType } from '@durak/shared';
import { Card } from './Card';
import { spacing } from '../theme/colors';

interface Props {
  hand: CardType[];
  selectedCardId?: string | null;
  onSelect?: (card: CardType) => void;
  playableIds?: Set<string>;
}

const fanRotation = (index: number, total: number): string => {
  if (total <= 1) return '0deg';
  const center = (total - 1) / 2;
  const raw = (index - center) * 1.5;
  const clamped = Math.max(-9, Math.min(9, raw));
  return `${clamped}deg`;
};

export const PlayerHand: React.FC<Props> = ({ hand, selectedCardId, onSelect, playableIds }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      <View style={styles.row}>
        {hand.map((card, i) => {
          const playable = !playableIds || playableIds.has(card.id);
          return (
            <Card
              key={card.id}
              card={card}
              onPress={onSelect ? () => onSelect(card) : undefined}
              selected={selectedCardId === card.id}
              playable={playable}
              disabled={!playable}
              size="lg"
              style={{
                marginHorizontal: -16,
                transform: [{ rotate: fanRotation(i, hand.length) }],
              }}
            />
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing(6) },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: spacing(4),
    paddingBottom: spacing(3),
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck --workspace @durak/mobile`
Expected: PlayerHand compiles. Errors remain elsewhere.

- [ ] **Step 3: Commit (skip if not in git)**

```bash
git add apps/mobile/src/components/PlayerHand.tsx
git commit -m "feat(mobile): enlarge hand cards, add gentle fan rotation"
```

---

## Task 4: Rewrite Table with felt background, trump badge, ghost empty state

**Files:**
- Modify: `apps/mobile/src/components/Table.tsx` (full rewrite)

- [ ] **Step 1: Replace contents**

```tsx
// apps/mobile/src/components/Table.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AttackPair, Card as CardType, Suit } from '@durak/shared';
import { Card } from './Card';
import { colors, elevation, radii, spacing } from '../theme/colors';

interface Props {
  table: AttackPair[];
  trumpCard: CardType | null;
  trumpSuit: Suit | null;
  deckCount: number;
  discardCount: number;
  onAttackPress?: (attackCardId: string) => void;
  highlightedAttackIds?: Set<string>;
}

const SUIT_GLYPH: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const isRed = (s: Suit) => s === 'hearts' || s === 'diamonds';

export const Table: React.FC<Props> = ({
  table,
  trumpCard,
  trumpSuit,
  deckCount,
  discardCount,
  onAttackPress,
  highlightedAttackIds,
}) => {
  return (
    <View style={[styles.wrapper, elevation.raised]}>
      <View style={styles.topRow}>
        <View style={styles.deck}>
          <Text style={styles.deckLabel}>Nachziehstapel</Text>
          <View style={styles.deckStack}>
            {deckCount > 0 ? (
              <>
                {trumpCard ? (
                  <Card card={trumpCard} size="sm" style={styles.trumpUnder} />
                ) : null}
                <Card card={null} faceDown size="sm" />
              </>
            ) : null}
          </View>
          <Text style={styles.deckCount}>{deckCount}</Text>
        </View>

        {trumpSuit ? (
          <View style={styles.trumpBadge}>
            <Text style={styles.trumpBadgeLabel}>Trumpf</Text>
            <Text
              style={[
                styles.trumpBadgeGlyph,
                { color: isRed(trumpSuit) ? colors.cardSuitRed : colors.text },
              ]}
            >
              {SUIT_GLYPH[trumpSuit]}
            </Text>
          </View>
        ) : null}

        <View style={styles.discard}>
          <Text style={styles.deckLabel}>Abwurf</Text>
          <Text style={styles.deckCount}>{discardCount}</Text>
        </View>
      </View>

      <View style={styles.tableArea}>
        {table.length === 0 ? (
          <View style={styles.emptyRow}>
            <View style={styles.ghostCard} />
            <View style={styles.ghostCard} />
            <Text style={styles.emptyCaption}>Tisch ist frei</Text>
          </View>
        ) : (
          table.map((pair) => {
            const highlighted = highlightedAttackIds?.has(pair.attack.id);
            return (
              <View key={pair.attack.id} style={styles.pair}>
                <Card
                  card={pair.attack}
                  size="md"
                  onPress={onAttackPress ? () => onAttackPress(pair.attack.id) : undefined}
                  selected={highlighted}
                />
                {pair.defense ? (
                  <Card card={pair.defense} size="md" style={styles.defenseOffset} />
                ) : (
                  <View style={styles.defenseOutline} />
                )}
              </View>
            );
          })
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.felt,
    borderRadius: radii.lg,
    padding: spacing(4),
    gap: spacing(3),
    borderWidth: 2,
    borderColor: colors.feltEdge,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deck: { alignItems: 'center', gap: spacing(1), width: 80 },
  deckStack: { width: 70, height: 64, alignItems: 'center', justifyContent: 'center' },
  trumpUnder: { position: 'absolute', top: 4, left: 22, transform: [{ rotate: '90deg' }] },
  deckLabel: { color: colors.textDim, fontSize: 11 },
  deckCount: { color: colors.text, fontWeight: '700' },
  trumpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.accent,
    gap: spacing(2),
  },
  trumpBadgeLabel: { color: colors.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  trumpBadgeGlyph: { fontSize: 22 },
  discard: { alignItems: 'center', gap: spacing(1), width: 80 },
  tableArea: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing(3),
    paddingVertical: spacing(3),
  },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), opacity: 0.7 },
  ghostCard: {
    width: 64,
    height: 92,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.feltEdge,
    backgroundColor: 'transparent',
  },
  emptyCaption: {
    color: colors.textDim,
    fontStyle: 'italic',
    marginLeft: spacing(2),
  },
  pair: { width: 90, height: 120, alignItems: 'flex-start' },
  defenseOffset: {
    position: 'absolute',
    top: 16,
    left: 22,
    transform: [{ rotate: '12deg' }],
  },
  defenseOutline: {
    position: 'absolute',
    top: 16,
    left: 22,
    width: 64,
    height: 92,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.feltEdge,
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck --workspace @durak/mobile`
Expected: Table compiles. Note: `Table` now takes `trumpSuit` and `highlightedAttackIds` instead of `pendingAttackId`. GameScreen will be updated in Task 9. Errors there expected.

- [ ] **Step 3: Commit (skip if not in git)**

```bash
git add apps/mobile/src/components/Table.tsx
git commit -m "feat(mobile): redesign Table — felt surface, trump badge, ghost empty state"
```

---

## Task 5: Rewrite PlayerBar with avatar, role chip, online dot

**Files:**
- Modify: `apps/mobile/src/components/PlayerBar.tsx` (full rewrite)

- [ ] **Step 1: Replace contents**

```tsx
// apps/mobile/src/components/PlayerBar.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PlayerPublic } from '@durak/shared';
import { Card } from './Card';
import { colors, radii, spacing } from '../theme/colors';

interface Props {
  players: PlayerPublic[];
  attackerId: string | null;
  defenderId: string | null;
  youId: string;
}

const initial = (name: string): string => (name.trim()[0] ?? '?').toUpperCase();

export const PlayerBar: React.FC<Props> = ({ players, attackerId, defenderId, youId }) => {
  const opponents = players.filter((p) => p.id !== youId);

  return (
    <View style={styles.row}>
      {opponents.map((p) => {
        const isAttacker = p.id === attackerId;
        const isDefender = p.id === defenderId;
        const roleChip = isAttacker ? '⚔' : isDefender ? '🛡' : p.hasFinished ? '✓' : null;
        const topBorder = isAttacker
          ? colors.danger
          : isDefender
            ? colors.accent
            : 'transparent';

        return (
          <View
            key={p.id}
            style={[
              styles.player,
              { borderTopColor: topBorder, borderTopWidth: 2 },
              !p.isConnected && styles.offline,
            ]}
          >
            {roleChip ? (
              <View style={styles.roleChip}>
                <Text style={styles.roleChipText}>{roleChip}</Text>
              </View>
            ) : null}

            <View style={styles.handRow}>
              {Array.from({ length: Math.min(p.handCount, 6) }).map((_, i) => (
                <Card key={i} card={null} faceDown size="sm" style={styles.stackedBack} />
              ))}
            </View>

            <View style={styles.identityRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial(p.name)}</Text>
              </View>
              <View style={styles.identityCol}>
                <View style={styles.nameRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: p.isConnected ? colors.success : colors.textDim },
                    ]}
                  />
                  <Text style={styles.name} numberOfLines={1}>
                    {p.name}
                  </Text>
                </View>
                <Text style={styles.count}>{p.handCount} Karten</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    gap: spacing(2),
  },
  player: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    padding: spacing(3),
    borderRadius: radii.md,
    minWidth: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 2,
    alignItems: 'center',
    gap: spacing(2),
  },
  offline: { opacity: 0.4 },
  roleChip: {
    position: 'absolute',
    top: -10,
    right: 8,
    backgroundColor: colors.bg,
    borderRadius: radii.pill,
    paddingHorizontal: spacing(2),
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleChipText: { fontSize: 14 },
  handRow: { flexDirection: 'row', height: 48 },
  stackedBack: { marginHorizontal: -14 },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    alignSelf: 'stretch',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.felt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  identityCol: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
  statusDot: { width: 8, height: 8, borderRadius: radii.pill },
  name: { color: colors.text, fontSize: 13, fontWeight: '600', flexShrink: 1 },
  count: { color: colors.textDim, fontSize: 11 },
});
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck --workspace @durak/mobile`
Expected: PlayerBar compiles.

- [ ] **Step 3: Commit (skip if not in git)**

```bash
git add apps/mobile/src/components/PlayerBar.tsx
git commit -m "feat(mobile): redesign PlayerBar — avatar, role chip, online dot"
```

---

## Task 6: Create RoleBanner component

**Files:**
- Create: `apps/mobile/src/components/RoleBanner.tsx`

- [ ] **Step 1: Create file**

```tsx
// apps/mobile/src/components/RoleBanner.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';

export type RoleBannerKind = 'attacker' | 'defender' | 'waiting';

interface Props {
  kind: RoleBannerKind;
  message: string;
}

const COLOR_BY_KIND: Record<RoleBannerKind, { bg: string; bar: string; fg: string; icon: string }> = {
  attacker: {
    bg: 'rgba(193,74,74,0.18)',
    bar: colors.danger,
    fg: colors.text,
    icon: '⚔',
  },
  defender: {
    bg: 'rgba(212,168,90,0.18)',
    bar: colors.accent,
    fg: colors.text,
    icon: '🛡',
  },
  waiting: {
    bg: colors.border,
    bar: 'transparent',
    fg: colors.textDim,
    icon: '⏳',
  },
};

export const RoleBanner: React.FC<Props> = ({ kind, message }) => {
  const c = COLOR_BY_KIND[kind];
  return (
    <View style={[styles.banner, { backgroundColor: c.bg, borderLeftColor: c.bar }]}>
      <Text style={[styles.icon, { color: c.fg }]}>{c.icon}</Text>
      <Text style={[styles.message, { color: c.fg }]} numberOfLines={1}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    height: 44,
    borderRadius: radii.md,
    borderLeftWidth: 4,
    paddingHorizontal: spacing(3),
    marginHorizontal: spacing(3),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
  },
  icon: { fontSize: 18 },
  message: { fontSize: 14, fontWeight: '600', flex: 1 },
});
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck --workspace @durak/mobile`
Expected: RoleBanner compiles.

- [ ] **Step 3: Commit (skip if not in git)**

```bash
git add apps/mobile/src/components/RoleBanner.tsx
git commit -m "feat(mobile): add RoleBanner component"
```

---

## Task 7: Create ActionBar component

**Files:**
- Create: `apps/mobile/src/components/ActionBar.tsx`

- [ ] **Step 1: Create file**

```tsx
// apps/mobile/src/components/ActionBar.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';

export interface ActionDef {
  key: string;
  label: string;
  variant: 'success' | 'danger' | 'secondary' | 'secondary-active';
  onPress: () => void;
}

interface Props {
  actions: ActionDef[];
}

export const ActionBar: React.FC<Props> = ({ actions }) => {
  if (actions.length === 0) {
    return <View style={styles.placeholder} />;
  }
  return (
    <View style={styles.row}>
      {actions.map((a) => (
        <TouchableOpacity
          key={a.key}
          style={[styles.btn, VARIANT_STYLES[a.variant]]}
          onPress={a.onPress}
          activeOpacity={0.8}
        >
          <Text style={[styles.btnText, VARIANT_TEXT[a.variant]]}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const VARIANT_STYLES = {
  success: { backgroundColor: colors.success, borderColor: colors.success },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
  secondary: { backgroundColor: 'transparent', borderColor: colors.accent },
  'secondary-active': { backgroundColor: colors.accent, borderColor: colors.accentStrong },
} as const;

const VARIANT_TEXT = {
  success: { color: colors.bg },
  danger: { color: colors.text },
  secondary: { color: colors.accent },
  'secondary-active': { color: colors.bg },
} as const;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing(2),
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
  },
  placeholder: { height: spacing(2) },
  btn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(3),
    borderWidth: 2,
  },
  btnText: { fontWeight: '700', fontSize: 15 },
});
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck --workspace @durak/mobile`
Expected: ActionBar compiles.

- [ ] **Step 3: Commit (skip if not in git)**

```bash
git add apps/mobile/src/components/ActionBar.tsx
git commit -m "feat(mobile): add ActionBar component"
```

---

## Task 8: Create Toast component

**Files:**
- Create: `apps/mobile/src/components/Toast.tsx`

- [ ] **Step 1: Create file**

```tsx
// apps/mobile/src/components/Toast.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';

interface Props {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
}

export const Toast: React.FC<Props> = ({ message, onDismiss, durationMs = 3000 }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const [visibleMessage, setVisibleMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    setVisibleMessage(message);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    const t = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setVisibleMessage(null);
        onDismiss();
      });
    }, durationMs);
    return () => clearTimeout(t);
  }, [message, durationMs, onDismiss, opacity]);

  if (!visibleMessage) return null;

  return (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <Text style={styles.text}>{visibleMessage}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: spacing(2),
    left: spacing(4),
    right: spacing(4),
    backgroundColor: 'rgba(20,24,26,0.95)',
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    borderRadius: radii.md,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
    zIndex: 100,
  },
  text: { color: colors.text, fontSize: 14 },
});
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck --workspace @durak/mobile`
Expected: Toast compiles.

- [ ] **Step 3: Commit (skip if not in git)**

```bash
git add apps/mobile/src/components/Toast.tsx
git commit -m "feat(mobile): add Toast component"
```

---

## Task 9: Recompose GameScreen — new layout, simplified defender flow

**Files:**
- Modify: `apps/mobile/src/screens/GameScreen.tsx` (full rewrite)

This task implements the simplified defender flow: tapping a hand card auto-defends if exactly one matching attack exists; otherwise highlights candidates and asks defender to tap one.

- [ ] **Step 1: Replace contents**

```tsx
// apps/mobile/src/screens/GameScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import {
  SOCKET_EVENTS,
  RANK_ORDER,
  type Card as CardType,
  type AckResult,
} from '@durak/shared';
import { useGameStore } from '../store/gameStore';
import { emitAck } from '../services/socket';
import { Table } from '../components/Table';
import { PlayerHand } from '../components/PlayerHand';
import { PlayerBar } from '../components/PlayerBar';
import { RoleBanner, type RoleBannerKind } from '../components/RoleBanner';
import { ActionBar, type ActionDef } from '../components/ActionBar';
import { Toast } from '../components/Toast';
import { colors, spacing } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const beats = (attack: CardType, defense: CardType, trumpSuit: string | null): boolean => {
  if (defense.suit === attack.suit) return RANK_ORDER[defense.rank] > RANK_ORDER[attack.rank];
  if (trumpSuit && defense.suit === trumpSuit && attack.suit !== trumpSuit) return true;
  return false;
};

export const GameScreen: React.FC<Props> = ({ route, navigation }) => {
  const { roomId } = route.params;
  const game = useGameStore((s) => s.game);
  const playerId = useGameStore((s) => s.playerId);
  const lastError = useGameStore((s) => s.lastError);
  const setError = useGameStore((s) => s.setError);

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [redirectMode, setRedirectMode] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setError(null); }, [setError]);

  useEffect(() => {
    if (game?.phase === 'finished') {
      const loserName = game.players.find((p) => p.id === game.loserId)?.name ?? '—';
      const iAmLoser = game.loserId === playerId;
      Alert.alert(
        iAmLoser ? 'Du bist der Durak!' : 'Spielende',
        iAmLoser ? 'Beim nächsten Mal!' : `Durak: ${loserName}`,
        [{ text: 'Zurück zur Lobby', onPress: () => navigation.replace('Lobby') }],
      );
    }
  }, [game?.phase, game?.loserId, game?.players, playerId, navigation]);

  const isAttacker = game?.attackerId === playerId;
  const isDefender = game?.defenderId === playerId;
  const defender = game?.players.find((p) => p.id === game.defenderId);

  const canRedirect = useMemo<boolean>(() => {
    if (!game || !isDefender || game.you.hand.length < 2) return false;
    if (game.table.length === 0) return false;
    if (game.table.some((p) => p.defense !== null)) return false;
    const firstRank = game.table[0]!.attack.rank;
    if (!game.table.every((p) => p.attack.rank === firstRank)) return false;
    return game.you.hand.some((c) => c.rank === firstRank);
  }, [game, isDefender]);

  const playableCardIds = useMemo<Set<string>>(() => {
    if (!game) return new Set();
    const ids = new Set<string>();

    if (isDefender && redirectMode) {
      const firstRank = game.table[0]?.attack.rank;
      if (!firstRank) return ids;
      for (const card of game.you.hand) if (card.rank === firstRank) ids.add(card.id);
      return ids;
    }

    if (isDefender) {
      for (const card of game.you.hand) {
        for (const pair of game.table) {
          if (pair.defense) continue;
          if (beats(pair.attack, card, game.trumpSuit)) {
            ids.add(card.id);
            break;
          }
        }
      }
      return ids;
    }

    if (isAttacker || (!isDefender && game.table.length > 0)) {
      if (game.table.length === 0 && isAttacker) {
        for (const c of game.you.hand) ids.add(c.id);
        return ids;
      }
      const tableRanks = new Set<string>();
      for (const pair of game.table) {
        tableRanks.add(pair.attack.rank);
        if (pair.defense) tableRanks.add(pair.defense.rank);
      }
      const undefendedCount = game.table.filter((p) => !p.defense).length;
      const defenderCapacity = (defender?.handCount ?? 0) > undefendedCount;
      if (!defenderCapacity) return ids;
      for (const c of game.you.hand) if (tableRanks.has(c.rank)) ids.add(c.id);
    }

    return ids;
  }, [game, isAttacker, isDefender, defender, redirectMode]);

  // Attacks the selected card could legally defend (only relevant for defender + selected card).
  const candidateAttackIds = useMemo<Set<string>>(() => {
    const ids = new Set<string>();
    if (!game || !isDefender || !selectedCardId || redirectMode) return ids;
    const card = game.you.hand.find((c) => c.id === selectedCardId);
    if (!card) return ids;
    for (const pair of game.table) {
      if (pair.defense) continue;
      if (beats(pair.attack, card, game.trumpSuit)) ids.add(pair.attack.id);
    }
    return ids;
  }, [game, isDefender, selectedCardId, redirectMode]);

  if (!game) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Warte auf Spielstart…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const playDefense = async (attackCardId: string, defenseCard: CardType) => {
    setBusy(true);
    const ack = (await emitAck(SOCKET_EVENTS.DEFEND_CARD, {
      roomId,
      attackCardId,
      defenseCard,
    })) as AckResult<void>;
    setBusy(false);
    if (!ack.ok) setError(ack.error.message);
    setSelectedCardId(null);
  };

  const handleCardSelect = async (card: CardType) => {
    if (busy) return;
    setError(null);

    if (isDefender && redirectMode) {
      if (!playableCardIds.has(card.id)) {
        setError('Nur Karten gleichen Wertes können weitergeschoben werden');
        return;
      }
      setBusy(true);
      const ack = (await emitAck(SOCKET_EVENTS.REDIRECT_ATTACK, { roomId, card })) as AckResult<void>;
      setBusy(false);
      if (!ack.ok) setError(ack.error.message);
      setRedirectMode(false);
      setSelectedCardId(null);
      return;
    }

    if (isDefender) {
      if (!playableCardIds.has(card.id)) {
        setError('Diese Karte schlägt keinen Angriff');
        return;
      }
      // Find all attacks this card can beat.
      const candidates = game.table
        .filter((p) => !p.defense && beats(p.attack, card, game.trumpSuit))
        .map((p) => p.attack.id);
      if (candidates.length === 1) {
        await playDefense(candidates[0]!, card);
        return;
      }
      // Multiple candidates: select card, await tap on a candidate attack.
      setSelectedCardId(card.id === selectedCardId ? null : card.id);
      return;
    }

    // Attacker / piler flow: tap to play as attack.
    if (!playableCardIds.has(card.id)) {
      setError('Diese Karte kann gerade nicht gespielt werden');
      return;
    }
    setBusy(true);
    const ack = (await emitAck(SOCKET_EVENTS.PLAY_CARD, { roomId, card })) as AckResult<void>;
    setBusy(false);
    if (!ack.ok) setError(ack.error.message);
    setSelectedCardId(null);
  };

  const handleAttackTap = async (attackCardId: string) => {
    if (!isDefender || busy) return;
    if (!selectedCardId) return; // No card chosen yet; ignore.
    if (!candidateAttackIds.has(attackCardId)) return;
    const card = game.you.hand.find((c) => c.id === selectedCardId);
    if (!card) return;
    await playDefense(attackCardId, card);
  };

  const handleEndTurn = async () => {
    if (busy) return;
    setBusy(true);
    const ack = (await emitAck(SOCKET_EVENTS.END_TURN, { roomId })) as AckResult<void>;
    setBusy(false);
    if (!ack.ok) setError(ack.error.message);
  };

  const handleTake = async () => {
    if (busy) return;
    setBusy(true);
    const ack = (await emitAck(SOCKET_EVENTS.TAKE_CARDS, { roomId })) as AckResult<void>;
    setBusy(false);
    if (!ack.ok) setError(ack.error.message);
  };

  const allDefended = game.table.length > 0 && game.table.every((p) => p.defense !== null);
  const canEndTurn = isAttacker && allDefended;
  const canTake = isDefender && game.table.length > 0 && !allDefended;

  const role: RoleBannerKind = isAttacker ? 'attacker' : isDefender ? 'defender' : 'waiting';
  const roleMessage =
    role === 'attacker'
      ? game.table.length === 0
        ? 'Du greifst an  ·  Karte spielen'
        : 'Du greifst an  ·  Nachlegen oder Bito'
      : role === 'defender'
        ? canRedirect
          ? 'Du verteidigst  ·  Schlagen oder Weiterschieben'
          : 'Du verteidigst  ·  Karte tippen'
        : `${defender?.name ?? 'Gegner'} verteidigt`;

  const actions: ActionDef[] = [];
  if (canEndTurn) {
    actions.push({ key: 'end', label: 'Bito', variant: 'success', onPress: handleEndTurn });
  }
  if (canTake) {
    actions.push({ key: 'take', label: 'Karten nehmen', variant: 'danger', onPress: handleTake });
  }
  if (canRedirect) {
    actions.push({
      key: 'redirect',
      label: redirectMode ? 'Abbrechen' : '→ Weiterschieben',
      variant: redirectMode ? 'secondary-active' : 'secondary',
      onPress: () => {
        setRedirectMode((v) => !v);
        setSelectedCardId(null);
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <PlayerBar
        players={game.players}
        attackerId={game.attackerId}
        defenderId={game.defenderId}
        youId={playerId ?? ''}
      />

      <RoleBanner kind={role} message={roleMessage} />

      <View style={styles.tableContainer}>
        <Table
          table={game.table}
          trumpCard={game.trumpCard}
          trumpSuit={game.trumpSuit}
          deckCount={game.deckCount}
          discardCount={game.discardCount}
          onAttackPress={isDefender ? handleAttackTap : undefined}
          highlightedAttackIds={candidateAttackIds}
        />
      </View>

      <ActionBar actions={actions} />

      <PlayerHand
        hand={game.you.hand}
        selectedCardId={selectedCardId}
        onSelect={handleCardSelect}
        playableIds={playableCardIds}
      />

      <Toast message={lastError} onDismiss={() => setError(null)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textDim },
  tableContainer: { flex: 1, padding: spacing(3) },
});
```

- [ ] **Step 2: Verify GameState shape provides `trumpSuit`**

Run: `grep -n "trumpSuit" apps/mobile/src/store/gameStore.ts packages/shared/src/game.ts`
Expected: `trumpSuit` exists on the `GameState`/store. If it does NOT exist, derive it inline as `game.trumpCard?.suit ?? null` and pass that instead.

- [ ] **Step 3: Typecheck the workspace**

Run: `npm run typecheck`
Expected: PASS for `@durak/mobile`. If failures remain, fix the specific TS error and re-run.

- [ ] **Step 4: Commit (skip if not in git)**

```bash
git add apps/mobile/src/screens/GameScreen.tsx
git commit -m "feat(mobile): recompose GameScreen, simplify defender flow"
```

---

## Task 10: Manual smoke test

**Files:** None.

- [ ] **Step 1: Start backend in terminal A**

Run: `npm run dev:backend`
Expected: server listens on `:3000`.

- [ ] **Step 2: Start bot in terminal B**

Run: `npm run bot -- TestBot --host-room`
Expected: bot prints "hosting room …".

- [ ] **Step 3: Start mobile app in terminal C**

Run: `npm run dev:mobile`
Expected: Metro bundler starts. Open in iOS sim (`i`) or scan QR on phone.

- [ ] **Step 4: Walk through gameplay**

- Login screen renders with new warm palette (gold title accent on near-black bg).
- Lobby shows "TestBot's Bot-Tisch". Tap to join.
- Game screen loads:
  - Top: opponent tile (TestBot) with avatar, online dot, role chip.
  - Below: RoleBanner says either "⚔ Du greifst an" or "🛡 Du verteidigst" with colored left bar — never floating over cards.
  - Center: green felt table, trump badge top-right, deck stack top-left, ghost card silhouette + "Tisch ist frei" caption.
  - Bottom: hand of 6 large cards, slight fan, serif numerals, true black for ♠/♣, deep red for ♥/♦.
- As attacker: tap a card → it goes to the table.
- As defender: tap a card from your hand → if exactly one attack can be beaten, it auto-defends. If multiple, candidates highlight; tap one.
- Trigger an error (e.g. tap a non-playable card): a toast slides in at the top, auto-dismisses after ~3 s.
- Play to end-of-round (Bito or take cards) repeatedly until "Du bist der Durak!" alert fires.

- [ ] **Step 5: Note any visual regressions**

If anything looks broken (cropped cards, missing shadows on Android, modal text invisible in lobby), capture which file is at fault and either fix in-place or open a follow-up note in this plan.

- [ ] **Step 6: Commit any final tweaks (skip if not in git)**

```bash
git add -A
git commit -m "fix(mobile): smoke-test fixups"
```

---

## Done criteria

- `npm run typecheck` is green.
- A full bot game can be played from Login → Lobby → Game → Durak alert.
- Cards in hand are visibly large (≥ 80×116) with serif numerals and true-black suits.
- The "Du verteidigst" / "Du greifst an" indicator is in its own banner above the table, not on top of cards.
- Tapping a defender's card with exactly one valid target auto-defends, no second tap required.
