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
