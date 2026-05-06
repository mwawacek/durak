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
