import { memo, useId, type CSSProperties } from 'react';
import { isRedSuit, type Card as CardType, type Rank, type Suit, SUIT_GLYPH } from '@durak/shared';
import { cn } from '@/lib/cn';
import { tokens } from '@/theme/tokens';
import { cardDims, type CardSize } from './cardSizes';

interface Props {
  card: CardType | null;
  faceDown?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  trumpHighlight?: boolean;
  playable?: boolean;
  defended?: boolean;
  rotate?: number;
  size?: CardSize;
  className?: string;
  style?: CSSProperties;
}

/**
 * Playing card rendered as inline SVG — "Midnight Velvet" version.
 *
 * Face: warm bone-cream with a very subtle inner sheen, sharp suit colours
 * (vibrant red / deep ink), thin inner border, larger corner labels in
 * Bricolage Grotesque, geometric pip layouts for 6..10 and a clean letter
 * + suit medallion for J/Q/K/A — no overdesigned portrait.
 *
 * Back: midnight gradient with a precise diagonal-stripe pattern and a
 * subtle inner border. Sharp and modern.
 */
const CardImpl = ({
  card,
  faceDown,
  onClick,
  disabled,
  selected,
  trumpHighlight,
  playable = true,
  defended,
  rotate = 0,
  size = 'md',
  className,
  style,
}: Props): JSX.Element => {
  const { w, h } = cardDims(size);

  const wrapper = (
    <div
      className={cn(
        'relative overflow-hidden rounded-[12%] transition-transform',
        selected && 'ring-2 ring-amber-400 shadow-amber',
        defended && !selected && 'ring-2 ring-mint-400',
        !selected && !defended && trumpHighlight && 'ring-1 ring-crimson-400/60',
        !selected && !defended && !trumpHighlight && 'shadow-card',
        !playable && !selected && 'opacity-45',
        disabled && 'cursor-not-allowed',
        'no-select touch-game',
        className,
      )}
      style={{
        width: w,
        height: h,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        ...style,
      }}
    >
      {faceDown ? (
        <CardBack />
      ) : card ? (
        <CardFace rank={card.rank} suit={card.suit} />
      ) : null}
    </div>
  );

  if (!onClick) return wrapper;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="block bg-transparent p-0 active:scale-[0.96]"
      aria-label={card ? `${card.rank} ${card.suit}` : faceDown ? 'verdeckte Karte' : 'leere Karte'}
    >
      {wrapper}
    </button>
  );
};

export const Card = memo(CardImpl);

const FACE_RANKS = new Set<Rank>(['J', 'Q', 'K', 'A']);

interface FaceProps {
  rank: Rank;
  suit: Suit;
}

const CardFaceImpl = ({ rank, suit }: FaceProps): JSX.Element => {
  const id = useId();
  const suitColor = isRedSuit(suit) ? tokens.cardSuitRed : tokens.cardSuitInk;
  const isFace = FACE_RANKS.has(rank);

  return (
    <svg
      viewBox="0 0 100 145"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      role="presentation"
      focusable="false"
    >
      <defs>
        <linearGradient id={`face-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tokens.cardFace} />
          <stop offset="1" stopColor={tokens.cardFaceShadow} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="145" rx="12" fill={`url(#face-${id})`} />
      <rect
        x="3.5"
        y="3.5"
        width="93"
        height="138"
        rx="9"
        fill="none"
        stroke={suitColor}
        strokeOpacity="0.12"
      />

      <CornerLabel x={8} y={6} rank={rank} suit={suit} color={suitColor} />
      <g transform="translate(92 139) rotate(180)">
        <CornerLabel x={0} y={0} rank={rank} suit={suit} color={suitColor} />
      </g>

      {isFace ? <FaceMedallion rank={rank} suit={suit} /> : <Pips rank={rank} suit={suit} />}
    </svg>
  );
};
const CardFace = memo(CardFaceImpl);

interface CornerLabelProps {
  x: number;
  y: number;
  rank: Rank;
  suit: Suit;
  color: string;
}

const CornerLabel = ({ x, y, rank, suit, color }: CornerLabelProps): JSX.Element => (
  <g transform={`translate(${x} ${y})`}>
    <text
      x="0"
      y="18"
      fontFamily="'Bricolage Grotesque', system-ui, sans-serif"
      fontWeight="800"
      fontSize="20"
      fill={color}
      style={{ fontVariationSettings: '"wdth" 90' }}
    >
      {rank}
    </text>
    <text x="0" y="36" fontSize="14" fontWeight="700" fill={color}>
      {SUIT_GLYPH[suit]}
    </text>
  </g>
);

const PIP_LAYOUTS: Record<string, [number, number][]> = {
  '6': [
    [0, 0],
    [1, 0],
    [0, 0.5],
    [1, 0.5],
    [0, 1],
    [1, 1],
  ],
  '7': [
    [0, 0],
    [1, 0],
    [0.5, 0.25],
    [0, 0.5],
    [1, 0.5],
    [0, 1],
    [1, 1],
  ],
  '8': [
    [0, 0],
    [1, 0],
    [0, 0.33],
    [1, 0.33],
    [0, 0.66],
    [1, 0.66],
    [0, 1],
    [1, 1],
  ],
  '9': [
    [0, 0],
    [1, 0],
    [0, 0.33],
    [1, 0.33],
    [0.5, 0.5],
    [0, 0.66],
    [1, 0.66],
    [0, 1],
    [1, 1],
  ],
  '10': [
    [0, 0],
    [1, 0],
    [0.5, 0.18],
    [0, 0.33],
    [1, 0.33],
    [0, 0.66],
    [1, 0.66],
    [0.5, 0.82],
    [0, 1],
    [1, 1],
  ],
};

const Pips = ({ rank, suit }: FaceProps): JSX.Element | null => {
  const layout = PIP_LAYOUTS[rank];
  if (!layout) return null;
  const suitColor = isRedSuit(suit) ? tokens.cardSuitRed : tokens.cardSuitInk;
  const insetX = 0.24;
  const insetY = 0.2;
  const usableW = 1 - insetX * 2;
  const usableH = 1 - insetY * 2;
  return (
    <>
      {layout.map(([c, r], i) => {
        const cx = (insetX + c * usableW) * 100;
        const cy = (insetY + r * usableH) * 145;
        const transform = r > 0.5 ? `rotate(180 ${cx} ${cy})` : undefined;
        return (
          <text
            key={i}
            x={cx}
            y={cy}
            fontSize="18"
            fontWeight="700"
            fill={suitColor}
            textAnchor="middle"
            dominantBaseline="central"
            transform={transform}
          >
            {SUIT_GLYPH[suit]}
          </text>
        );
      })}
    </>
  );
};

const FaceMedallion = ({ rank, suit }: FaceProps): JSX.Element => {
  const suitColor = isRedSuit(suit) ? tokens.cardSuitRed : tokens.cardSuitInk;
  return (
    <g>
      {/* Suit glyph above */}
      <text
        x="50"
        y="56"
        fontSize="20"
        fontWeight="700"
        fill={suitColor}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {SUIT_GLYPH[suit]}
      </text>
      {/* Big rank letter — Bricolage Grotesque expanded */}
      <text
        x="50"
        y="92"
        fontFamily="'Bricolage Grotesque', system-ui, sans-serif"
        fontWeight="800"
        fontSize="56"
        fill={suitColor}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontVariationSettings: '"wdth" 95' }}
      >
        {rank}
      </text>
    </g>
  );
};

const CardBackImpl = (): JSX.Element => {
  const id = useId();
  return (
    <svg
      viewBox="0 0 100 145"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      role="presentation"
      focusable="false"
    >
      <defs>
        <linearGradient id={`back-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tokens.ink[700]} />
          <stop offset="1" stopColor={tokens.ink[950]} />
        </linearGradient>
        <pattern
          id={`stripe-${id}`}
          patternUnits="userSpaceOnUse"
          width="10"
          height="10"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y="0"
            x2="0"
            y2="10"
            stroke={tokens.crimson[500]}
            strokeWidth="1.5"
            strokeOpacity="0.18"
          />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100" height="145" rx="12" fill={`url(#back-${id})`} />
      <rect x="0" y="0" width="100" height="145" rx="12" fill={`url(#stripe-${id})`} />
      <rect
        x="5"
        y="5"
        width="90"
        height="135"
        rx="9"
        fill="none"
        stroke={tokens.crimson[500]}
        strokeWidth="1"
        strokeOpacity="0.55"
      />
      {/* Centre suit diamond */}
      <g transform="translate(50 72.5)">
        <rect
          x="-14"
          y="-14"
          width="28"
          height="28"
          rx="3"
          fill={tokens.crimson[500]}
          fillOpacity="0.25"
          stroke={tokens.crimson[400]}
          strokeWidth="0.8"
          transform="rotate(45)"
        />
        <circle r="4" fill={tokens.amber[400]} />
      </g>
    </svg>
  );
};
const CardBack = memo(CardBackImpl);
