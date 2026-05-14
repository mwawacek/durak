import type { Card as CardType, Suit } from '@durak/shared';
import { SUIT_GLYPH } from '@durak/shared';
import { MiniCard } from '@/components/Card';
import { tokens } from '@/theme/tokens';

interface Props {
  trumpCard: CardType | null;
  trumpSuit: Suit | null;
  deckCount: number;
}

const isRed = (s: Suit | null): boolean => s === 'hearts' || s === 'diamonds';

/**
 * Trump indicator + draw-pile counter. Left: mini trump card. Right:
 * remaining cards in the draw pile.
 */
export const TrumpWell = ({ trumpCard, trumpSuit, deckCount }: Props): JSX.Element => {
  const suitColor = isRed(trumpSuit) ? tokens.suit.red : tokens.text.primary;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="label-eyebrow">Trumpf</span>
        {trumpSuit ? (
          <span className="text-[11px]" style={{ color: suitColor }}>
            {SUIT_GLYPH[trumpSuit]}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2.5">
        {trumpCard ? (
          <MiniCard rank={trumpCard.rank} suit={trumpCard.suit} width={32} />
        ) : (
          <div
            className="flex h-[45px] w-[32px] items-center justify-center rounded-[5px] border border-line-subtle"
            style={{ color: suitColor }}
          >
            {trumpSuit ? <span className="text-base">{SUIT_GLYPH[trumpSuit]}</span> : null}
          </div>
        )}
        <div className="flex flex-col leading-none">
          <span className="font-serif text-[18px] font-medium tnum">{deckCount}</span>
          <span className="label-eyebrow mt-1">im Stapel</span>
        </div>
      </div>
    </div>
  );
};
