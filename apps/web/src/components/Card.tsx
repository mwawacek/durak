import { memo, type CSSProperties } from 'react';
import { isRedSuit, type Card as CardType, type Rank, type Suit, SUIT_GLYPH } from '@durak/shared';
import { cn } from '@/lib/cn';
import { tokens } from '@/theme/tokens';
import { cardDims, CARD_ASPECT } from './cardSizes';

interface Props {
  card: CardType | null;
  faceDown?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  /** Coral dot in the top-right corner — marks trump cards in hand. */
  isTrump?: boolean;
  /** Visually de-emphasise when the card isn't playable right now. */
  playable?: boolean;
  /** Mark a defended attack on the table. */
  defended?: boolean;
  /** Width in pixels. Height is derived from CARD_ASPECT. */
  width: number;
  /** Optional rotation in degrees (used by CardBack fans). */
  rotate?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Durak playing card — clean typographic face, no skeuomorphism.
 *   - Top-left index: rank + suit glyph in suit colour.
 *   - Bottom-right large suit glyph at 85 % opacity.
 *   - Optional trump dot at the top-right.
 * German rank labels: J→B, Q→D, K→K, A→A.
 */
const CardImpl = ({
  card,
  faceDown,
  onClick,
  disabled,
  selected,
  isTrump,
  playable = true,
  defended,
  width,
  rotate = 0,
  className,
  style,
}: Props): JSX.Element => {
  const { w, h } = cardDims(width);

  const inner = faceDown ? (
    <CardBackFace width={w} />
  ) : card ? (
    <CardFront rank={card.rank} suit={card.suit} width={w} isTrump={!!isTrump} />
  ) : null;

  const cardBox = (
    <div
      className={cn(
        'relative box-border transition-all duration-150 ease-out',
        selected && '-translate-y-2.5',
        !playable && !selected && 'opacity-45',
        disabled && 'cursor-not-allowed',
        'no-select touch-game',
        className,
      )}
      style={{
        width: w,
        height: h,
        borderRadius: w * 0.11,
        border: selected
          ? `1.5px solid ${tokens.accent.base}`
          : defended
            ? `1.5px solid ${tokens.accent.base}`
            : '0.5px solid rgba(0,0,0,0.08)',
        boxShadow: selected
          ? '0 14px 30px -10px rgba(255,111,94,0.55), 0 2px 6px rgba(0,0,0,0.3)'
          : faceDown
            ? '0 6px 14px -6px rgba(0,0,0,0.55)'
            : '0 1px 0 rgba(255,255,255,0.55) inset, 0 6px 14px -6px rgba(0,0,0,0.45)',
        backgroundColor: faceDown ? 'transparent' : tokens.surface.card,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        overflow: 'hidden',
        ...style,
      }}
    >
      {inner}
    </div>
  );

  if (!onClick) return cardBox;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="block bg-transparent p-0 active:scale-[0.97]"
      aria-label={card ? `${card.rank} ${card.suit}` : faceDown ? 'verdeckte Karte' : ''}
    >
      {cardBox}
    </button>
  );
};

export const Card = memo(CardImpl);

const RANK_LABEL: Record<Rank, string> = {
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  J: 'B',
  Q: 'D',
  K: 'K',
  A: 'A',
};

interface FaceProps {
  rank: Rank;
  suit: Suit;
  width: number;
  isTrump: boolean;
}

const CardFront = memo(function CardFront({ rank, suit, width, isTrump }: FaceProps) {
  const w = width;
  const suitColor = isRedSuit(suit) ? tokens.suit.red : tokens.suit.black;
  const indexFontSize = w * 0.34;
  const glyphFontSize = w * 0.34;
  const label = RANK_LABEL[rank];
  return (
    <div className="absolute inset-0 flex flex-col" style={{ padding: w * 0.08 }}>
      <div className="flex flex-col" style={{ lineHeight: 1 }}>
        <span
          className="font-serif"
          style={{
            fontSize: indexFontSize,
            color: suitColor,
            fontWeight: 500,
            letterSpacing: '-0.02em',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: indexFontSize * 0.7,
            color: suitColor,
            lineHeight: 1,
            marginTop: w * 0.02,
          }}
        >
          {SUIT_GLYPH[suit]}
        </span>
      </div>

      <div className="mt-auto flex justify-end" style={{ lineHeight: 1 }}>
        <span
          style={{
            fontSize: glyphFontSize,
            color: suitColor,
            opacity: 0.85,
            lineHeight: 0.9,
          }}
        >
          {SUIT_GLYPH[suit]}
        </span>
      </div>

      {isTrump ? (
        <span
          className="absolute"
          style={{
            top: w * 0.08,
            right: w * 0.08,
            width: w * 0.11,
            height: w * 0.11,
            borderRadius: '50%',
            background: tokens.accent.base,
            boxShadow: `0 0 0 2px ${tokens.surface.card}`,
          }}
        />
      ) : null}
    </div>
  );
});

const CardBackFace = memo(function CardBackFace({ width }: { width: number }) {
  const w = width;
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        borderRadius: w * 0.11,
        background: `linear-gradient(155deg, ${tokens.cardBackTop} 0%, ${tokens.cardBackBottom} 100%)`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,111,94,0.06) 0 1px, transparent 1px 6px)',
        }}
      />
      <div
        className="absolute"
        style={{
          inset: w * 0.07,
          borderRadius: w * 0.075,
          border: '0.5px solid rgba(255,111,94,0.15)',
        }}
      />
    </div>
  );
});

/** Mini card — top-left index only, used by TrumpWell. */
export const MiniCard = memo(function MiniCard({
  rank,
  suit,
  width = 32,
  className,
}: {
  rank: Rank;
  suit: Suit;
  width?: number;
  className?: string;
}) {
  const w = width;
  const h = Math.round(w * CARD_ASPECT);
  const suitColor = isRedSuit(suit) ? tokens.suit.red : tokens.suit.black;
  const label = RANK_LABEL[rank];
  return (
    <div
      className={cn('relative bg-surface-card', className)}
      style={{
        width: w,
        height: h,
        borderRadius: w * 0.16,
        border: '0.5px solid rgba(0,0,0,0.08)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.55) inset, 0 4px 10px -4px rgba(0,0,0,0.45)',
      }}
    >
      <div
        className="absolute"
        style={{ top: w * 0.12, left: w * 0.16, lineHeight: 0.9 }}
      >
        <div
          className="font-serif"
          style={{
            fontSize: w * 0.42,
            color: suitColor,
            fontWeight: 500,
            letterSpacing: '-0.02em',
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: w * 0.3, color: suitColor }}>{SUIT_GLYPH[suit]}</div>
      </div>
    </div>
  );
});
