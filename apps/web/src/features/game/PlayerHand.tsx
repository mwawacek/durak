import type { Card as CardType, Suit } from '@durak/shared';
import { Card } from '@/components/Card';
import { cardDims } from '@/components/cardSizes';
import { useWindowSize } from '@/hooks/useWindowSize';

interface Props {
  hand: CardType[];
  trumpSuit?: Suit | null;
  selectedCardId?: string | null;
  onSelect?: (card: CardType) => void;
  playableIds?: Set<string>;
  sidePadding?: number;
}

/**
 * Fanned hand at the bottom of the screen. The selected card lifts above the
 * arc and pops to z-index 999. Unplayable cards are dimmed.
 */
export const PlayerHand = ({
  hand,
  trumpSuit,
  selectedCardId,
  onSelect,
  playableIds,
  sidePadding = 16,
}: Props): JSX.Element => {
  const { width: screenW } = useWindowSize();
  const cardW = cardDims('lg').w;
  const total = hand.length;
  const spread = Math.min(36, total * 5.5);

  const available = Math.max(160, (screenW || cardW * 6) - sidePadding * 2);
  const idealMargin =
    total > 1 ? Math.floor((available - total * cardW) / (2 * (total - 1))) : 0;
  const marginH = Math.max(-Math.floor(cardW / 2) + 14, Math.min(0, idealMargin));

  return (
    // overflow-x: auto + overflow-y: hidden — the explicit Y rule blocks the
    // CSS spec's "if X is auto, Y becomes auto too" quirk that lets users
    // pan the hand vertically. pt-10 keeps the selected-card lift visible
    // even with Y-clip on.
    <div
      className="flex h-full w-full items-end justify-center overflow-x-auto pb-1.5 pt-10 scroll-touch"
      style={{ overflowY: 'hidden', touchAction: 'pan-x' }}
    >
      <div className="flex items-end">
        {hand.map((card, i) => {
          const k = total === 1 ? 0 : (i - (total - 1) / 2) / ((total - 1) / 2);
          const angle = k * (spread / 2);
          const yLift = Math.abs(k) * 6;
          const playable = !playableIds || playableIds.has(card.id);
          const isTrump = trumpSuit ? card.suit === trumpSuit : false;
          const isSelected = selectedCardId === card.id;
          const liftPx = isSelected ? -18 - yLift : yLift;
          return (
            <div
              key={card.id}
              className="transition-transform duration-200 ease-out"
              style={{
                marginLeft: marginH,
                marginRight: marginH,
                transform: `translateY(${liftPx}px) rotate(${angle}deg)`,
                transformOrigin: 'bottom center',
                zIndex: isSelected ? 999 : i,
              }}
            >
              <Card
                card={card}
                size="lg"
                onClick={onSelect ? () => onSelect(card) : undefined}
                disabled={!playable && !onSelect ? true : false}
                selected={isSelected}
                trumpHighlight={isTrump && !isSelected}
                playable={playable}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
