import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle, Pressable } from 'react-native';
import type { AttackPair } from '@durak/shared';
import { Card } from './Card';
import { colors } from '../theme/colors';

interface Props {
  pairs: AttackPair[];
  cardW?: number;
  fullField?: boolean;
  onAttackPress?: (attackCardId: string) => void;
  highlightedAttackIds?: Set<string>;
  style?: ViewStyle;
}

/** Pairs grid (3 columns). Defended cards rotated; undefended ones get a pulsing dashed outline. */
export const BattleField: React.FC<Props> = ({
  pairs,
  cardW = 56,
  fullField,
  onAttackPress,
  highlightedAttackIds,
  style,
}) => {
  return (
    <View
      style={[
        styles.wrap,
        {
          gap: cardW * (fullField ? 0.18 : 0.25),
          padding: cardW * 0.18,
        },
        style,
      ]}
    >
      {pairs.length === 0 ? null : (
        <View style={[styles.grid, { gap: cardW * (fullField ? 0.18 : 0.25) }]}>
          {pairs.map((p) => (
            <BattlePair
              key={p.attack.id}
              pair={p}
              cardW={cardW}
              onPress={onAttackPress ? () => onAttackPress(p.attack.id) : undefined}
              highlighted={highlightedAttackIds?.has(p.attack.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

interface PairProps {
  pair: AttackPair;
  cardW: number;
  onPress?: () => void;
  highlighted?: boolean;
}

const BattlePair: React.FC<PairProps> = ({ pair, cardW, onPress, highlighted }) => {
  const undefended = !pair.defense;
  const defenseCard = pair.defense;
  return (
    <View
      style={{
        width: cardW * 1.15,
        height: cardW * 1.7,
        position: 'relative',
      }}
    >
      <Pressable onPress={onPress} disabled={!onPress}>
        <Card
          card={pair.attack}
          size="md"
          selected={highlighted}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
      </Pressable>
      {defenseCard ? (
        <Card
          card={defenseCard}
          size="md"
          defended
          rotate={16}
          style={{ position: 'absolute', top: cardW * 0.28, left: cardW * 0.18 }}
        />
      ) : null}
      {undefended ? <PulsingOutline cardW={cardW} /> : null}
    </View>
  );
};

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
        backgroundColor: 'rgba(255,170,80,0.05)',
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
