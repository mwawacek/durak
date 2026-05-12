import React from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { Card as CardType, Suit } from '@durak/shared';
import { Card, cardDims } from './Card';

interface Props {
  hand: CardType[];
  trumpSuit?: Suit | null;
  selectedCardId?: string | null;
  onSelect?: (card: CardType) => void;
  playableIds?: Set<string>;
  /** Horizontal padding kept clear of cards on each side. */
  sidePadding?: number;
}

/**
 * Fanned hand, centered horizontally. The negative margin between cards
 * scales with hand size so a 6-card hand fits centered on a 375 px screen
 * without scrolling; large hands (≥ 9) overflow into a scrollable strip but
 * the visual centre still corresponds to the centre of the row.
 */
export const PlayerHand: React.FC<Props> = ({
  hand,
  trumpSuit,
  selectedCardId,
  onSelect,
  playableIds,
  sidePadding = 16,
}) => {
  const { width: screenW } = useWindowDimensions();
  const cardW = cardDims('lg').w;
  const total = hand.length;
  const spread = Math.min(40, total * 6);

  // Available horizontal space for the row before we must overlap.
  const available = Math.max(160, screenW - sidePadding * 2);

  // Pick a margin that makes (cardW + (total-1)*(cardW + 2m)) ≈ available.
  // Each card past the first contributes cardW + 2m to the rendered width.
  // Solve for m: m = (available - total*cardW) / (2*(total-1)).
  const idealMargin =
    total > 1 ? Math.floor((available - total * cardW) / (2 * (total - 1))) : 0;
  // Clamp so cards never sit further apart than touching (m ≤ 0) and never
  // overlap so much that less than 24 px of each card remains visible.
  const marginH = Math.max(-Math.floor(cardW / 2) + 12, Math.min(0, idealMargin));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
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
                marginHorizontal: marginH,
                transform: [{ translateY: yLift }, { rotate: `${angle}deg` }],
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
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
});
