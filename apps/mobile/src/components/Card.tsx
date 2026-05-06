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
