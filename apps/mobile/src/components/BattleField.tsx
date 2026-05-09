import React, { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import type { AttackPair } from '@durak/shared';
import { Card } from './Card';
import { colors } from '../theme/colors';

interface Props {
  pairs: AttackPair[];
  /** "md" → 64 px wide cards, "sm" → 44 px wide cards. */
  size?: 'sm' | 'md';
  onAttackPress?: (attackCardId: string) => void;
  highlightedAttackIds?: Set<string>;
  style?: ViewStyle;
}

/** Pairs grid (3 columns). Defended cards rotated; undefended ones get a pulsing dashed outline. */
export const BattleField: React.FC<Props> = ({
  pairs,
  size = 'md',
  onAttackPress,
  highlightedAttackIds,
  style,
}) => {
  // Spacing is derived from the actual card width to keep cells from overlapping
  // even at small sizes. Compact grid (sm) uses tighter gaps.
  const cardW = size === 'sm' ? 44 : 64;
  const gap = size === 'sm' ? 6 : 10;
  const pad = 10;
  if (pairs.length === 0) {
    return <View style={[styles.wrap, { gap, padding: pad }, style]} />;
  }
  return (
    <View style={[styles.wrap, { gap, padding: pad }, style]}>
      <View style={[styles.grid, { gap }]}>
        {pairs.map((p) => (
          <BattlePair
            key={p.attack.id}
            pair={p}
            size={size}
            cardW={cardW}
            onPress={onAttackPress ? () => onAttackPress(p.attack.id) : undefined}
            highlighted={highlightedAttackIds?.has(p.attack.id)}
          />
        ))}
      </View>
    </View>
  );
};

interface PairProps {
  pair: AttackPair;
  size: 'sm' | 'md';
  cardW: number;
  onPress?: () => void;
  highlighted?: boolean;
}

const BattlePairImpl: React.FC<PairProps> = ({ pair, size, cardW, onPress, highlighted }) => {
  const undefended = !pair.defense;
  // Each cell holds an attack card with a defense card offset behind it.
  // Width = card width plus the offset; height = card height plus the offset.
  const cellW = cardW + cardW * 0.22;
  const cellH = cardW * 1.45 + cardW * 0.28;
  return (
    <View style={{ width: cellW, height: cellH, position: 'relative' }}>
      <Card
        card={pair.attack}
        size={size}
        selected={highlighted}
        onPress={onPress}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
      {pair.defense ? (
        <Card
          card={pair.defense}
          size={size}
          defended
          rotate={16}
          style={{ position: 'absolute', top: cardW * 0.28, left: cardW * 0.18 }}
        />
      ) : null}
      {undefended ? <PulsingOutline cardW={cardW} /> : null}
    </View>
  );
};

const BattlePair = memo(BattlePairImpl);

const PulsingOutline: React.FC<{ cardW: number }> = ({ cardW }) => {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: cardW * 0.32,
        left: cardW * 0.16,
        width: cardW,
        height: cardW * 1.45,
        borderRadius: cardW * 0.085,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: colors.warmAlert,
        backgroundColor: colors.warmAlertHaze,
        opacity,
      }}
    />
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '100%',
  },
});
