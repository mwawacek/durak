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

  const n = hand.length;
  const cardW = handCardWidth(n);
  const available = Math.max(0, containerW - 24);
  let gap = 6;
  if (n > 1) {
    const totalNominal = n * cardW + (n - 1) * gap;
    if (totalNominal > available) {
      gap = (available - cardW) / (n - 1) - cardW;
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
              marginLeft: i === 0 ? 0 : gap,
              zIndex: isSelected ? 100 + i : i,
            }}
          >
            <Card
              card={card}
              width={cardW}
              onClick={onSelect ? () => onSelect(card) : undefined}
              disabled={!playable && !onSelect ? true : false}
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
