import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { type Card as CardType, type Suit, SUIT_GLYPH } from '@durak/shared';
import { Card } from './Card';
import { colors, fonts, presets } from '../theme/colors';

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
      <Text style={styles.label}>Trumpf</Text>
      <View style={{ width: stackWidth, height: stackHeight, position: 'relative' }}>
        <View style={[styles.halo, { borderRadius: 14 }]} />
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
        {/* Deck is gone and trump's been drawn — show a ghost medallion so the slot
            still feels intentional and the trump suit stays visible at a glance. */}
        {!trumpCard && deckCount === 0 && trumpSuit ? (
          <View style={[styles.ghostMedallion, { left: stackWidth / 2 - 24, top: stackHeight / 2 - 24 }]}>
            <Text
              style={[
                styles.ghostGlyph,
                { color: trumpSuit === 'hearts' || trumpSuit === 'diamonds' ? colors.cardSuitRed : colors.goldLight },
              ]}
            >
              {SUIT_GLYPH[trumpSuit]}
            </Text>
          </View>
        ) : null}
      </View>
      {/* Count badge — only show numeric count while there's still a deck;
          when empty, the ghost medallion above already conveys "trump = X". */}
      {deckCount > 0 ? (
        <View style={[presets.goldPill, styles.countBadge]}>
          {trumpSuit ? <Text style={styles.countGlyph}>{SUIT_GLYPH[trumpSuit]}</Text> : null}
          <Text style={styles.countNum}>{deckCount}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 5 },
  label: {
    fontSize: 8,
    color: colors.goldLight,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
    fontFamily: fonts.serif,
  },
  halo: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    backgroundColor: colors.goldHaloBg,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countGlyph: { fontSize: 10, color: colors.goldLight },
  countNum: { fontSize: 10, color: colors.goldLight, fontWeight: '700' },
  ghostMedallion: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.goldFaint,
    backgroundColor: colors.bgPillSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostGlyph: { fontSize: 22, lineHeight: 26 },
});
