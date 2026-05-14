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
  /** Loud highlight — the player has selected this card. */
  selected?: boolean;
  /** Subtle "this is a trump card" glow (less assertive than `selected`). */
  trumpHighlight?: boolean;
  /** false = not legally playable right now (visually de-emphasized). Defaults true. */
  playable?: boolean;
  /** Attack card already beaten — green outline. */
  defended?: boolean;
  /** Rotate the whole card by N degrees. */
  rotate?: number;
  size?: CardSize;
  className?: string;
  style?: CSSProperties;
}

/**
 * A playing card rendered as inline SVG. Sizing is set by the wrapper div
 * (`width: w; height: h`); the SVG fills 100% × 100% via a 100×145 viewBox so
 * proportions are constant across `sm`, `md`, and `lg`.
 *
 * Composition:
 *   - Outline / shadow / borders → wrapper div (Tailwind shadows + ring).
 *   - Face content → inline <svg>: gradient bg, hairline inner border, two
 *     corner rank/suit labels (top-left, bottom-right rotated 180°), and
 *     either pip layout (`6..10`) or face medallion (`J/Q/K/A`).
 *   - Back → solid burgundy gradient + gold rosette pattern.
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
        'relative overflow-hidden rounded-card shadow-card transition-transform',
        selected && 'shadow-raised ring-[1.5px] ring-gold-light',
        defended && !selected && 'ring-[1.5px] ring-defending',
        !selected && !defended && trumpHighlight && 'ring-1 ring-gold/40',
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
      className="block bg-transparent p-0 active:scale-[0.97]"
      aria-label={card ? `${card.rank} ${card.suit}` : faceDown ? 'verdeckte Karte' : 'leere Karte'}
    >
      {wrapper}
    </button>
  );
};

export const Card = memo(CardImpl);

const FACE_MONOGRAM: Record<string, string> = { J: 'B', Q: 'D', K: 'K', A: 'A' };

const FACE_BG: Record<string, string> = {
  J: tokens.faceJ,
  Q: tokens.faceQ,
  K: tokens.faceK,
  A: tokens.faceA,
};

const FACE_RANKS = new Set<Rank>(['J', 'Q', 'K', 'A']);

interface FaceProps {
  rank: Rank;
  suit: Suit;
}

const CardFaceImpl = ({ rank, suit }: FaceProps): JSX.Element => {
  const id = useId();
  const suitColor = isRedSuit(suit) ? tokens.cardSuitRed : tokens.cardSuitBlack;
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
      <rect x="0" y="0" width="100" height="145" rx="8.5" fill={`url(#face-${id})`} />
      <rect
        x="4"
        y="4"
        width="92"
        height="137"
        rx="6"
        fill="none"
        stroke={suitColor}
        strokeOpacity="0.25"
      />

      <CornerLabel x={9} y={5} rank={rank} suit={suit} color={suitColor} />
      <g transform="translate(91 140) rotate(180)">
        <CornerLabel x={0} y={0} rank={rank} suit={suit} color={suitColor} inverted />
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
  inverted?: boolean;
}

const CornerLabel = ({ x, y, rank, suit, color, inverted }: CornerLabelProps): JSX.Element => {
  return (
    <g transform={`translate(${x} ${y})`}>
      <text
        x="0"
        y="18"
        fontFamily="Georgia, serif"
        fontWeight="800"
        fontSize="22"
        fill={color}
        textAnchor={inverted ? 'start' : 'start'}
        style={{ letterSpacing: '-0.5px' }}
      >
        {rank}
      </text>
      <text x="0" y="34" fontSize="18" fill={color}>
        {SUIT_GLYPH[suit]}
      </text>
    </g>
  );
};

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
  const suitColor = isRedSuit(suit) ? tokens.cardSuitRed : tokens.cardSuitBlack;
  const insetX = 0.22;
  const insetY = 0.18;
  const usableW = 1 - insetX * 2;
  const usableH = 1 - insetY * 2;
  const fontSize = 20;
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
            fontSize={fontSize}
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
  const suitColor = isRedSuit(suit) ? tokens.cardSuitRed : tokens.cardSuitBlack;
  const monogram = FACE_MONOGRAM[rank] ?? rank;
  const bg = FACE_BG[rank] ?? tokens.faceK;
  const pipColor = isRedSuit(suit) ? tokens.redPip : tokens.goldLight;
  return (
    <g>
      <rect
        x="16"
        y="32"
        width="68"
        height="81"
        rx="14"
        fill={bg}
        stroke={suitColor}
        strokeOpacity="0.6"
      />
      <rect
        x="20"
        y="36"
        width="60"
        height="73"
        rx="11"
        fill="none"
        stroke={tokens.goldFaint}
      />
      <text
        x="50"
        y="58"
        fontSize="18"
        fill={pipColor}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {SUIT_GLYPH[suit]}
      </text>
      <text
        x="50"
        y="84"
        fontFamily="Georgia, serif"
        fontStyle="italic"
        fontWeight="800"
        fontSize="40"
        fill={tokens.cream}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {monogram}
      </text>
      <text
        x="50"
        y="106"
        fontFamily="Georgia, serif"
        fontWeight="700"
        fontSize="11"
        fill={tokens.goldLight}
        textAnchor="middle"
        letterSpacing="1"
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
          <stop offset="0" stopColor={tokens.burgundy} />
          <stop offset="1" stopColor={tokens.burgundyDark} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="145" rx="8.5" fill={`url(#back-${id})`} />
      <rect
        x="5"
        y="5"
        width="90"
        height="135"
        rx="6"
        fill="none"
        stroke={tokens.gold}
        strokeWidth="1"
      />
      <rect
        x="8"
        y="8"
        width="84"
        height="129"
        rx="4"
        fill="none"
        stroke={tokens.goldRailFaint}
        strokeWidth="0.6"
      />
      {/* Central diamond rosette */}
      <g transform="translate(50 72.5)">
        <rect
          x="-22"
          y="-22"
          width="44"
          height="44"
          fill={tokens.goldHaloBg}
          stroke={tokens.gold}
          strokeWidth="0.8"
          transform="rotate(45)"
        />
        <rect
          x="-14"
          y="-14"
          width="28"
          height="28"
          fill="none"
          stroke={tokens.goldHighlight}
          strokeWidth="0.5"
          transform="rotate(45)"
        />
        <circle r="6" fill={tokens.goldLight} />
      </g>
      {/* Corner dots */}
      {[
        { cx: 18, cy: 20 },
        { cx: 82, cy: 20 },
        { cx: 18, cy: 125 },
        { cx: 82, cy: 125 },
      ].map(({ cx, cy }, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r="5.5"
          fill="none"
          stroke={tokens.gold}
          strokeWidth="0.6"
        />
      ))}
    </svg>
  );
};
const CardBack = memo(CardBackImpl);
