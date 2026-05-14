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
  /** Horizontal padding kept clear of cards on each side. */
  sidePadding?: number;
}

/**
 * Fanned hand centred on the bottom of the screen. The negative horizontal
 * margin between cards is computed so a 6-card hand fits on a 375 px screen
 * without scrolling; larger hands overflow into a scrollable strip but the
 * visual centre stays aligned with the screen centre.
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
  const spread = Math.min(40, total * 6);

  const available = Math.max(160, (screenW || cardW * 6) - sidePadding * 2);
  const idealMargin =
    total > 1 ? Math.floor((available - total * cardW) / (2 * (total - 1))) : 0;
  const marginH = Math.max(-Math.floor(cardW / 2) + 12, Math.min(0, idealMargin));

  return (
    <div className="flex h-full w-full items-end justify-center overflow-x-auto pb-1.5 pt-5">
      <div className="flex items-end">
        {hand.map((card, i) => {
          const t = total === 1 ? 0 : (i - (total - 1) / 2) / ((total - 1) / 2);
          const angle = t * (spread / 2);
          const yLift = Math.abs(t) * 6;
          const playable = !playableIds || playableIds.has(card.id);
          const isTrump = trumpSuit ? card.suit === trumpSuit : false;
          const isSelected = selectedCardId === card.id;
          const liftPx = isSelected ? -14 - yLift : yLift;
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
