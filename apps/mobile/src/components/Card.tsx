import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { type Card as CardType, type Rank, type Suit, SUIT_GLYPH, isRedSuit } from '@durak/shared';
import { colors, elevation, fonts, radii } from '../theme/colors';

interface Props {
  card: CardType | null;
  faceDown?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  /** false = not legally playable right now (visually de-emphasized). Defaults to true. */
  playable?: boolean;
  /** Marks an attack card as already defended — green outline. */
  defended?: boolean;
  /** Rotate the whole card by N degrees. */
  rotate?: number;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

const SIZE = {
  sm: 44,
  md: 64,
  lg: 80,
} as const;

const CYRILLIC: Record<string, string> = { J: 'В', Q: 'Д', K: 'К', A: 'Т' };
const FACE_BG: Record<string, string> = {
  J: colors.faceJ,
  Q: colors.faceQ,
  K: colors.faceK,
  A: colors.faceA,
};
const FACE_RANKS = new Set(['J', 'Q', 'K', 'A']);

export const Card: React.FC<Props> = ({
  card,
  faceDown,
  onPress,
  disabled,
  selected,
  playable = true,
  defended,
  rotate = 0,
  size = 'md',
  style,
}) => {
  const w = SIZE[size];
  const h = w * 1.45;

  let outerShadow: ViewStyle = elevation.card;
  let outerBorder: ViewStyle = {};
  if (selected) {
    outerShadow = elevation.raised;
    outerBorder = {
      borderWidth: 1.5,
      borderColor: colors.goldLight,
    };
  } else if (defended) {
    outerBorder = { borderWidth: 1.5, borderColor: colors.defendingGreen };
  }

  const content = (
    <View
      style={[
        styles.card,
        { width: w, height: h, transform: [{ rotate: `${rotate}deg` }] },
        outerShadow,
        outerBorder,
        !playable && !selected && styles.notPlayable,
        style,
      ]}
    >
      {faceDown ? (
        <CardBackVisual w={w} />
      ) : card ? (
        <CardFaceVisual w={w} rank={card.rank} suit={card.suit} />
      ) : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={disabled ? { opacity: 0.5 } : undefined}
    >
      {content}
    </TouchableOpacity>
  );
};

/** Empty placeholder slot the size of a card, dashed gold border. */
export const CardSlot: React.FC<{ size?: 'sm' | 'md' | 'lg'; style?: ViewStyle }> = ({
  size = 'md',
  style,
}) => {
  const w = SIZE[size];
  return (
    <View
      style={[
        slotStyles.slot,
        { width: w, height: w * 1.45 },
        style,
      ]}
    />
  );
};

// ─── Card face ─────────────────────────────────────────────────
const CardFaceVisual: React.FC<{ w: number; rank: Rank; suit: Suit }> = ({ w, rank, suit }) => {
  const suitColor = isRedSuit(suit) ? colors.cardSuitRed : colors.cardSuitBlack;
  const cornerSize = w * 0.22;
  const isFace = FACE_RANKS.has(rank);
  return (
    <LinearGradient
      colors={[colors.cardFace, colors.cardFaceShadow]}
      style={[
        StyleSheet.absoluteFill,
        { borderRadius: w * 0.085, overflow: 'hidden' },
      ]}
    >
      {/* hairline inner border */}
      <View
        style={{
          position: 'absolute',
          top: w * 0.04,
          left: w * 0.04,
          right: w * 0.04,
          bottom: w * 0.04,
          borderRadius: w * 0.05,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: `${suitColor}40`,
        }}
      />

      {/* top-left corner: rank + suit stacked tight */}
      <View style={[styles.corner, { top: w * 0.04, left: w * 0.06 }]}>
        <Text
          style={{
            fontFamily: fonts.serif,
            fontSize: cornerSize,
            fontWeight: '800',
            color: suitColor,
            letterSpacing: -0.5,
            lineHeight: cornerSize * 1.05,
          }}
        >
          {rank}
        </Text>
        <Text style={{ fontSize: cornerSize * 0.82, color: suitColor, marginTop: 1 }}>
          {SUIT_GLYPH[suit]}
        </Text>
      </View>

      {/* bottom-right corner (rotated) */}
      <View
        style={[
          styles.corner,
          { bottom: w * 0.04, right: w * 0.06, transform: [{ rotate: '180deg' }] },
        ]}
      >
        <Text
          style={{
            fontFamily: fonts.serif,
            fontSize: cornerSize,
            fontWeight: '800',
            color: suitColor,
            letterSpacing: -0.5,
            lineHeight: cornerSize * 1.05,
          }}
        >
          {rank}
        </Text>
        <Text style={{ fontSize: cornerSize * 0.82, color: suitColor, marginTop: 1 }}>
          {SUIT_GLYPH[suit]}
        </Text>
      </View>

      {/* center: face medallion or pips */}
      {isFace ? <FaceMedallion suit={suit} rank={rank} w={w} /> : <Pips suit={suit} rank={rank} w={w} />}
    </LinearGradient>
  );
};

// ─── Face medallion (J/Q/K/A) ──────────────────────────────────
const FaceMedallion: React.FC<{ suit: Suit; rank: Rank; w: number }> = ({ suit, rank, w }) => {
  const suitColor = isRedSuit(suit) ? colors.cardSuitRed : colors.cardSuitBlack;
  const portraitBg = FACE_BG[rank] ?? colors.faceK;
  const cyr = CYRILLIC[rank] ?? rank;
  const pipColor = isRedSuit(suit) ? '#ff8a82' : colors.goldLight;
  return (
    <View
      style={{
        position: 'absolute',
        top: w * 0.22,
        left: w * 0.16,
        right: w * 0.16,
        bottom: w * 0.22,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          flex: 1,
          alignSelf: 'stretch',
          borderRadius: w * 0.18,
          backgroundColor: portraitBg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: `${suitColor}aa`,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: w * 0.04,
          overflow: 'hidden',
        }}
      >
        {/* gold inner border */}
        <View
          style={{
            position: 'absolute',
            top: w * 0.04,
            left: w * 0.04,
            right: w * 0.04,
            bottom: w * 0.04,
            borderRadius: w * 0.14,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.goldMuted,
          }}
        />
        <Text
          style={{
            fontSize: w * 0.18,
            color: pipColor,
            lineHeight: w * 0.2,
            marginBottom: w * 0.02,
          }}
        >
          {SUIT_GLYPH[suit]}
        </Text>
        <Text
          style={{
            fontFamily: fonts.serif,
            fontSize: w * 0.42,
            fontWeight: '800',
            color: colors.cream,
            fontStyle: 'italic',
            lineHeight: w * 0.42,
          }}
        >
          {cyr}
        </Text>
        <Text
          style={{
            fontFamily: fonts.serif,
            fontSize: w * 0.13,
            fontWeight: '700',
            color: colors.goldLight,
            letterSpacing: 1,
            marginTop: w * 0.02,
          }}
        >
          {rank}
        </Text>
      </View>
    </View>
  );
};

// ─── Pips for number cards 6..10 ───────────────────────────────
const PIP_LAYOUTS: Record<string, [number, number][]> = {
  '6':  [[0,0],[1,0],[0,0.5],[1,0.5],[0,1],[1,1]],
  '7':  [[0,0],[1,0],[0.5,0.25],[0,0.5],[1,0.5],[0,1],[1,1]],
  '8':  [[0,0],[1,0],[0,0.33],[1,0.33],[0,0.66],[1,0.66],[0,1],[1,1]],
  '9':  [[0,0],[1,0],[0,0.33],[1,0.33],[0.5,0.5],[0,0.66],[1,0.66],[0,1],[1,1]],
  '10': [[0,0],[1,0],[0.5,0.18],[0,0.33],[1,0.33],[0,0.66],[1,0.66],[0.5,0.82],[0,1],[1,1]],
};

const Pips: React.FC<{ suit: Suit; rank: Rank; w: number }> = ({ suit, rank, w }) => {
  const layout = PIP_LAYOUTS[rank];
  if (!layout) return null;
  const suitColor = isRedSuit(suit) ? colors.cardSuitRed : colors.cardSuitBlack;
  const insetX = 0.22;
  const insetY = 0.18;
  const usableW = 1 - insetX * 2;
  const usableH = 1 - insetY * 2;
  const pipFontSize = w * 0.2;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {layout.map(([c, r], i) => {
        const flip = r > 0.5;
        const left = (insetX + c * usableW) * w - pipFontSize * 0.4;
        const top = (insetY + r * usableH) * (w * 1.45) - pipFontSize * 0.55;
        return (
          <Text
            key={i}
            style={{
              position: 'absolute',
              left,
              top,
              fontSize: pipFontSize,
              color: suitColor,
              transform: flip ? [{ rotate: '180deg' }] : undefined,
              lineHeight: pipFontSize,
            }}
          >
            {SUIT_GLYPH[suit]}
          </Text>
        );
      })}
    </View>
  );
};

// ─── Card back (burgundy + gold filigree) ──────────────────────
const CardBackVisual: React.FC<{ w: number }> = ({ w }) => {
  return (
    <LinearGradient
      colors={[colors.burgundy, colors.burgundyDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        StyleSheet.absoluteFill,
        { borderRadius: w * 0.085, overflow: 'hidden' },
      ]}
    >
      {/* outer gold border */}
      <View
        style={{
          position: 'absolute',
          top: w * 0.045,
          left: w * 0.045,
          right: w * 0.045,
          bottom: w * 0.045,
          borderRadius: w * 0.06,
          borderWidth: 1,
          borderColor: colors.gold,
        }}
      />
      {/* inner thin gold border */}
      <View
        style={{
          position: 'absolute',
          top: w * 0.075,
          left: w * 0.075,
          right: w * 0.075,
          bottom: w * 0.075,
          borderRadius: w * 0.04,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: 'rgba(212,165,72,0.5)',
        }}
      />
      {/* center diamond (rotated square outline) */}
      <View
        style={{
          position: 'absolute',
          left: w * 0.26,
          top: w * 0.45,
          width: w * 0.48,
          height: w * 0.48,
          borderWidth: 1,
          borderColor: colors.gold,
          transform: [{ rotate: '45deg' }],
          backgroundColor: 'rgba(212,165,72,0.12)',
        }}
      />
      {/* inner diamond */}
      <View
        style={{
          position: 'absolute',
          left: w * 0.35,
          top: w * 0.54,
          width: w * 0.3,
          height: w * 0.3,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.goldHighlight,
          transform: [{ rotate: '45deg' }],
        }}
      />
      {/* center bullion */}
      <View
        style={{
          position: 'absolute',
          left: w * 0.435,
          top: w * 0.625,
          width: w * 0.13,
          height: w * 0.13,
          borderRadius: w * 0.07,
          backgroundColor: colors.goldLight,
        }}
      />
      {/* corner ornaments (4 small circles) */}
      {[
        { top: w * 0.12, left: w * 0.12 },
        { top: w * 0.12, right: w * 0.12 },
        { bottom: w * 0.12, left: w * 0.12 },
        { bottom: w * 0.12, right: w * 0.12 },
      ].map((pos, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            ...pos,
            width: w * 0.11,
            height: w * 0.11,
            borderRadius: w * 0.055,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.gold,
          }}
        />
      ))}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.cardFace,
  },
  notPlayable: { opacity: 0.45 },
  corner: {
    position: 'absolute',
    alignItems: 'center',
  },
});

const slotStyles = StyleSheet.create({
  slot: {
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(212,165,72,0.4)',
    backgroundColor: 'transparent',
  },
});
