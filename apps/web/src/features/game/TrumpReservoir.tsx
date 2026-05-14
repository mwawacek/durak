import type { Card as CardType, Suit } from '@durak/shared';
import { SUIT_GLYPH } from '@durak/shared';
import { Card } from '@/components/Card';
import { tokens } from '@/theme/tokens';

interface Props {
  trumpCard: CardType | null;
  trumpSuit: Suit | null;
  deckCount: number;
  cardW?: number;
}

/**
 * Vertical deck stack with the trump card poking out underneath, rotated 90°.
 * Once the deck is empty and the trump has been drawn, a small medallion
 * shows the trump suit instead.
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
      <p className="font-display text-[9px] font-bold uppercase tracking-[0.3em] text-bone-mute">
        Trumpf
      </p>
      <div className="relative" style={{ width: stackWidth, height: stackHeight }}>
        {/* Soft amber halo */}
        <div
          className="pointer-events-none absolute -inset-2 rounded-card"
          style={{ background: 'rgba(251,191,36,0.10)', filter: 'blur(6px)' }}
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
            <Card
              card={trumpCard}
              size="md"
              selected
              style={{ width: cardW, height: cardHeight }}
            />
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
            className="absolute flex items-center justify-center rounded-full border border-amber-300/60 bg-ink-950/60"
            style={{
              left: stackWidth / 2 - 24,
              top: stackHeight / 2 - 24,
              width: 48,
              height: 48,
            }}
          >
            <span
              className="text-2xl font-semibold"
              style={{ color: isRed ? tokens.crimson[500] : tokens.amber[400] }}
            >
              {SUIT_GLYPH[trumpSuit]}
            </span>
          </div>
        ) : null}
      </div>

      {deckCount > 0 ? (
        <div className="glass-bare flex items-center gap-1.5 rounded-pill px-2.5 py-1">
          {trumpSuit ? (
            <span
              className="text-[11px]"
              style={{ color: isRed ? tokens.crimson[500] : tokens.amber[400] }}
            >
              {SUIT_GLYPH[trumpSuit]}
            </span>
          ) : null}
          <span className="font-mono text-[10px] font-bold text-bone tnum">{deckCount}</span>
        </div>
      ) : null}
    </div>
  );
};
