import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { type Card as CardType, type Suit, SUIT_GLYPH } from '@durak/shared';
import { Card } from './Card';
import { colors, fonts } from '../theme/colors';

interface Props {
  trumpCard: CardType | null;
  trumpSuit: Suit | null;
  deckCount: number;
  cardW?: number;
  style?: ViewStyle;
}

/** Vertical deck stack with trump card poking out underneath, rotated 90°. */
export const TrumpReservoir: React.FC<Props> = ({
  trumpCard,
  trumpSuit,
  deckCount,
  cardW = 56,
  style,
}) => {
  const stackWidth = cardW * 1.55;
  const stackHeight = cardW * 1.7;
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.label}>Trump · Козырь</Text>
      <View style={{ width: stackWidth, height: stackHeight, position: 'relative' }}>
        {/* gold halo */}
        <View
          style={{
            position: 'absolute',
            top: -6,
            left: -6,
            right: -6,
            bottom: -6,
            backgroundColor: 'rgba(230,196,120,0.08)',
            borderRadius: 14,
          }}
        />
        {/* Trump card poking out, rotated 90° */}
        {trumpCard ? (
          <View
            style={{
              position: 'absolute',
              top: cardW * 0.45,
              left: -cardW * 0.05,
              transform: [{ rotate: '90deg' }],
            }}
          >
            <Card card={trumpCard} size="md" selected />
          </View>
        ) : null}
        {/* Deck stack on top of trump */}
        {deckCount > 0 ? (
          <View style={{ position: 'absolute', top: 0, left: cardW * 0.55 }}>
            <View style={{ position: 'absolute', top: 4, left: 4 }}>
              <Card card={null} faceDown size="md" />
            </View>
            <View style={{ position: 'absolute', top: 2, left: 2 }}>
              <Card card={null} faceDown size="md" />
            </View>
            <Card card={null} faceDown size="md" />
          </View>
        ) : null}
      </View>
      {/* Count badge */}
      <View style={styles.countBadge}>
        {trumpSuit ? (
          <Text style={[styles.countGlyph]}>{SUIT_GLYPH[trumpSuit]}</Text>
        ) : null}
        <Text style={styles.countNum}>{deckCount}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 5,
  },
  label: {
    fontSize: 8,
    color: colors.goldLight,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
    fontFamily: fonts.serif,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(20,8,3,0.7)',
    borderWidth: 0.5,
    borderColor: 'rgba(212,165,72,0.4)',
  },
  countGlyph: { fontSize: 10, color: colors.goldLight },
  countNum: { fontSize: 10, color: colors.goldLight, fontWeight: '700' },
});
