import { useEffect, useRef, useState } from 'react';
import type { Card as CardType, Suit } from '@durak/shared';
import { Card } from '@/components/Card';
import { handCardWidth } from '@/components/cardSizes';

interface Props {
  hand: CardType[];
  trumpSuit?: Suit | null;
  selectedCardId?: string | null;
  onSelect?: (card: CardType) => void;
  playableIds?: Set<string>;
}

/**
 * Spread layout — a single row of cards centred at the bottom of the
 * viewport. Cards stay at uniform rotation (no fan) and overlap negatively
 * when the hand outgrows the container.
 */
export const PlayerHand = ({
  hand,
  trumpSuit,
  selectedCardId,
  onSelect,
  playableIds,
}: Props): JSX.Element => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerW, setContainerW] = useState<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setContainerW(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cardCount = hand.length;
  const cardW = handCardWidth(cardCount);
  const available = Math.max(0, containerW - 24);
  // Floor for the visible width per card → keeps tap targets usable when the
  // hand grows huge. The leftmost edge of each card stays at least
  // MIN_VISIBLE_PX wide so the rank index remains tappable.
  const MIN_VISIBLE_PX = 28;
  const DEFAULT_GAP_PX = 6;
  let gapPx = DEFAULT_GAP_PX;
  if (cardCount > 1) {
    const totalNominal = cardCount * cardW + (cardCount - 1) * gapPx;
    if (totalNominal > available) {
      const overlap = (available - cardW) / (cardCount - 1) - cardW;
      const maxOverlap = -(cardW - MIN_VISIBLE_PX);
      gapPx = Math.max(maxOverlap, overlap);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative flex h-[100px] w-full items-end justify-center px-3 pb-1 pt-1.5"
      style={{
        backgroundImage: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.35) 100%)',
      }}
    >
      {hand.map((card, i) => {
        const playable = !playableIds || playableIds.has(card.id);
        const isTrump = trumpSuit ? card.suit === trumpSuit : false;
        const isSelected = selectedCardId === card.id;
        return (
          <div
            key={card.id}
            style={{
              marginLeft: i === 0 ? 0 : gapPx,
              zIndex: isSelected ? 100 + i : i,
            }}
          >
            <Card
              card={card}
              width={cardW}
              onClick={onSelect ? () => onSelect(card) : undefined}
              selected={isSelected}
              isTrump={isTrump}
              playable={playable}
            />
          </div>
        );
      })}
    </div>
  );
};
