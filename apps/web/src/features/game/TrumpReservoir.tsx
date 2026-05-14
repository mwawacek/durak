import type { Card as CardType, Suit } from '@durak/shared';
import { SUIT_GLYPH } from '@durak/shared';
import { Card } from '@/components/Card';
import { cn } from '@/lib/cn';
import { tokens } from '@/theme/tokens';

interface Props {
  trumpCard: CardType | null;
  trumpSuit: Suit | null;
  deckCount: number;
  cardW?: number;
}

/**
 * Vertical deck stack with the trump card poking out underneath, rotated 90°.
 * Once the deck is empty and the trump has been drawn, a "ghost medallion"
 * keeps the trump suit visible at a glance.
 */
export const TrumpReservoir = ({
  trumpCard,
  trumpSuit,
  deckCount,
  cardW = 56,
}: Props): JSX.Element => {
  const stackWidth = cardW * 1.55;
  const stackHeight = cardW * 1.7;
  const cardHeight = cardW * 1.45;
  const isRed = trumpSuit === 'hearts' || trumpSuit === 'diamonds';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="font-serif text-[8px] font-bold uppercase tracking-widest text-gold-light">
        Trumpf
      </p>
      <div className="relative" style={{ width: stackWidth, height: stackHeight }}>
        {/* Soft gold halo */}
        <div
          className="pointer-events-none absolute -inset-1.5 rounded-card"
          style={{ background: tokens.goldHaloBg }}
        />

        {trumpCard ? (
          <div
            className="absolute"
            style={{
              top: cardW * 0.45,
              left: -cardW * 0.05,
              transform: 'rotate(90deg)',
              transformOrigin: 'center',
            }}
          >
            <Card card={trumpCard} size="md" selected style={{ width: cardW, height: cardHeight }} />
          </div>
        ) : null}

        {deckCount > 0 ? (
          <div className="absolute" style={{ top: 0, left: cardW * 0.55 }}>
            <div className="absolute" style={{ top: 4, left: 4 }}>
              <Card card={null} faceDown size="md" style={{ width: cardW, height: cardHeight }} />
            </div>
            <div className="absolute" style={{ top: 2, left: 2 }}>
              <Card card={null} faceDown size="md" style={{ width: cardW, height: cardHeight }} />
            </div>
            <Card card={null} faceDown size="md" style={{ width: cardW, height: cardHeight }} />
          </div>
        ) : null}

        {!trumpCard && deckCount === 0 && trumpSuit ? (
          <div
            className="absolute flex items-center justify-center rounded-full border border-gold/40 bg-mahogany-dark/60"
            style={{
              left: stackWidth / 2 - 24,
              top: stackHeight / 2 - 24,
              width: 48,
              height: 48,
            }}
          >
            <span
              className={cn('text-2xl', isRed ? 'text-card-suit-red' : 'text-gold-light')}
              style={{ color: isRed ? tokens.cardSuitRed : tokens.goldLight }}
            >
              {SUIT_GLYPH[trumpSuit]}
            </span>
          </div>
        ) : null}
      </div>

      {deckCount > 0 ? (
        <div className="flex items-center gap-1 rounded-pill border border-gold/40 bg-mahogany-dark/70 px-2 py-0.5">
          {trumpSuit ? <span className="text-[10px] text-gold-light">{SUIT_GLYPH[trumpSuit]}</span> : null}
          <span className="text-[10px] font-bold text-gold-light">{deckCount}</span>
        </div>
      ) : null}
    </div>
  );
};
