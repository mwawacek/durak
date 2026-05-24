import { memo, type CSSProperties } from 'react';
import { isRedSuit, type Card as CardType, type Rank, type Suit, SUIT_GLYPH } from '@durak/shared';
import { cn } from '@/lib/cn';
import { tokens } from '@/theme/tokens';
import { cardDims, CARD_ASPECT } from './cardSizes';

interface Props {
  card: CardType | null;
  faceDown?: boolean;
  onClick?: () => void;
  selected?: boolean;
  /** Coral dot at the top-right — marks trump cards in hand. */
  isTrump?: boolean;
  /** Visually de-emphasise when the card isn't playable right now. */
  playable?: boolean;
  /** Mark a defended attack on the table. */
  defended?: boolean;
  /** Width in pixels. Height is derived from CARD_ASPECT. */
  width: number;
  style?: CSSProperties;
}

/**
 * Durak playing card — clean typographic face.
 *   - Top-left index: rank + suit glyph in suit colour.
 *   - Bottom-right large suit glyph.
 *   - Subtle inset border in the suit colour for polish.
 *   - Optional trump dot at the top-right corner.
 * German rank labels: J→B, Q→D, K→K, A→A.
 */

// Card proportions — all derived from `width` so the design scales linearly.
const CARD_RADIUS_RATIO = 0.11;
const CARD_PADDING_RATIO = 0.085;
const INDEX_RANK_RATIO = 0.36;
const INDEX_SUIT_RATIO = 0.26;
const CORNER_GLYPH_RATIO = 0.42;
const TRUMP_DOT_RATIO = 0.115;
const INNER_BORDER_INSET_RATIO = 0.06;

// Hoisted out of the render body so `Card.memo` can short-circuit when
// callers pass the same `style` reference (BattleField uses the constants
// in services/style.ts; PlayerHand recreates per-card style which is fine).
const SHADOW_DEFAULT =
  '0 1px 0 rgba(255,255,255,0.55) inset, 0 6px 14px -6px rgba(0,0,0,0.45)';
const SHADOW_FACEDOWN = '0 6px 14px -6px rgba(0,0,0,0.55)';
const SHADOW_SELECTED =
  '0 14px 30px -10px rgba(255,111,94,0.55), 0 2px 6px rgba(0,0,0,0.3)';
const BORDER_DEFAULT = '0.5px solid rgba(0,0,0,0.08)';
const BORDER_ACCENT = `1.5px solid ${tokens.accent.base}`;

const CardImpl = ({
  card,
  faceDown,
  onClick,
  selected,
  isTrump,
  playable = true,
  defended,
  width,
  style,
}: Props): JSX.Element => {
  const { w, h } = cardDims(width);
  const radius = w * CARD_RADIUS_RATIO;

  const inner = faceDown ? (
    <CardBackFace width={w} />
  ) : card ? (
    <CardFront rank={card.rank} suit={card.suit} width={w} isTrump={!!isTrump} />
  ) : null;

  const cardBox = (
    <div
      className={cn(
        'relative box-border overflow-hidden transition-all duration-150 ease-out no-select touch-game',
        selected && '-translate-y-2.5',
        !playable && !selected && 'opacity-45',
      )}
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        border: selected || defended ? BORDER_ACCENT : BORDER_DEFAULT,
        boxShadow: selected ? SHADOW_SELECTED : faceDown ? SHADOW_FACEDOWN : SHADOW_DEFAULT,
        backgroundColor: faceDown ? 'transparent' : tokens.surface.card,
        ...style,
      }}
    >
      {inner}
    </div>
  );

  if (!onClick) return cardBox;
  const ariaLabel = card
    ? `${RANK_NAME_DE[card.rank]} ${SUIT_NAME_DE[card.suit]}${
        isTrump ? ' (Trumpf)' : ''
      }${!playable ? ' (nicht spielbar)' : ''}`
    : faceDown
      ? 'verdeckte Karte'
      : undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-disabled={!playable || undefined}
      tabIndex={playable ? 0 : -1}
      className="block rounded-card bg-transparent p-0 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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

const RANK_NAME_DE: Record<Rank, string> = {
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  J: 'Bube',
  Q: 'Dame',
  K: 'König',
  A: 'Ass',
};

const SUIT_NAME_DE: Record<Suit, string> = {
  hearts: 'Herz',
  diamonds: 'Karo',
  spades: 'Pik',
  clubs: 'Kreuz',
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
  const padding = w * CARD_PADDING_RATIO;
  const innerInset = w * INNER_BORDER_INSET_RATIO;
  const innerRadius = w * (CARD_RADIUS_RATIO - INNER_BORDER_INSET_RATIO);

  return (
    <div className="absolute inset-0">
      <span
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          inset: innerInset,
          borderRadius: innerRadius,
          border: `0.5px solid ${suitColor}`,
          opacity: 0.12,
        }}
      />

      <div className="absolute inset-0 flex flex-col" style={{ padding }}>
        <div className="flex flex-col" style={{ lineHeight: 1, gap: w * 0.015 }}>
          <span
            className="font-serif"
            style={{
              fontSize: w * INDEX_RANK_RATIO,
              color: suitColor,
              fontWeight: 500,
              letterSpacing: '-0.02em',
            }}
          >
            {RANK_LABEL[rank]}
          </span>
          <span
            style={{
              fontSize: w * INDEX_SUIT_RATIO,
              color: suitColor,
              lineHeight: 1,
            }}
          >
            {SUIT_GLYPH[suit]}
          </span>
        </div>

        <div className="mt-auto flex justify-end" style={{ lineHeight: 0.9 }}>
          <span
            style={{
              fontSize: w * CORNER_GLYPH_RATIO,
              color: suitColor,
              opacity: 0.92,
            }}
          >
            {SUIT_GLYPH[suit]}
          </span>
        </div>
      </div>

      {isTrump ? (
        <span
          className="absolute"
          style={{
            top: padding * 0.85,
            right: padding * 0.85,
            width: w * TRUMP_DOT_RATIO,
            height: w * TRUMP_DOT_RATIO,
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
        borderRadius: w * CARD_RADIUS_RATIO,
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
          borderRadius: w * (CARD_RADIUS_RATIO - 0.04),
          border: '0.5px solid rgba(255,111,94,0.18)',
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
  return (
    <div
      className={cn('relative bg-surface-card', className)}
      style={{
        width: w,
        height: h,
        borderRadius: w * 0.18,
        border: '0.5px solid rgba(0,0,0,0.08)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.55) inset, 0 4px 10px -4px rgba(0,0,0,0.45)',
      }}
    >
      <div
        className="absolute"
        style={{ top: w * 0.12, left: w * 0.16, lineHeight: 0.95 }}
      >
        <div
          className="font-serif"
          style={{
            fontSize: w * 0.44,
            color: suitColor,
            fontWeight: 500,
            letterSpacing: '-0.02em',
          }}
        >
          {RANK_LABEL[rank]}
        </div>
        <div style={{ fontSize: w * 0.3, color: suitColor, marginTop: w * 0.02 }}>
          {SUIT_GLYPH[suit]}
        </div>
      </div>
    </div>
  );
});
