import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { Card as CardType, Suit } from '@durak/shared';
import { Card } from './Card';

interface Props {
  hand: CardType[];
  trumpSuit?: Suit | null;
  selectedCardId?: string | null;
  onSelect?: (card: CardType) => void;
  playableIds?: Set<string>;
  cardW?: number;
  bottom?: number;
}

/**
 * Fanned hand with arc rotation. Card width is fixed; horizontal spacing collapses
 * via negative margins for big hands.
 */
export const PlayerHand: React.FC<Props> = ({
  hand,
  trumpSuit,
  selectedCardId,
  onSelect,
  playableIds,
  cardW = 80,
  bottom = 24,
}) => {
  const total = hand.length;
  const spread = Math.min(40, total * 6); // total fan span in degrees
  const overlap = total > 6 ? -28 : -20;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, { paddingBottom: bottom }]}
    >
      <View style={styles.row}>
        {hand.map((card, i) => {
          const t = total === 1 ? 0 : (i - (total - 1) / 2) / ((total - 1) / 2);
          const angle = t * (spread / 2);
          const yLift = Math.abs(t) * 6;
          const playable = !playableIds || playableIds.has(card.id);
          const isTrump = trumpSuit ? card.suit === trumpSuit : false;
          const isSelected = selectedCardId === card.id;
          return (
            <View
              key={card.id}
              style={{
                marginHorizontal: overlap,
                transform: [
                  { translateY: yLift },
                  { rotate: `${angle}deg` },
                ],
                zIndex: i,
              }}
            >
              <Card
                card={card}
                onPress={onSelect ? () => onSelect(card) : undefined}
                selected={isSelected || isTrump}
                playable={playable}
                disabled={!playable}
                size="lg"
              />
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
});
