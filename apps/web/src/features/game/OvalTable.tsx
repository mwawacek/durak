import { memo, useId } from 'react';
import { tokens } from '@/theme/tokens';

interface Props {
  width: number;
  height: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/**
 * Oval mahogany table — three nested ellipses (wood lip → gold rail → felt
 * centre) rendered as one inline SVG layer that sits absolutely below all
 * gameplay elements. Pointer events pass through.
 */
const OvalTableImpl = ({ width, height, cx, cy, rx, ry }: Props): JSX.Element => {
  const id = useId();
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="pointer-events-none absolute left-0 top-0"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`wood-${id}`} cx="50%" cy="30%" r="70%" fx="50%" fy="30%">
          <stop offset="0%" stopColor={tokens.mahoganyHighlight} />
          <stop offset="60%" stopColor={tokens.mahogany} />
          <stop offset="100%" stopColor={tokens.mahoganyDark} />
        </radialGradient>
        <radialGradient id={`felt-${id}`} cx="50%" cy="35%" r="65%" fx="50%" fy="35%">
          <stop offset="0%" stopColor={tokens.felt} />
          <stop offset="60%" stopColor={tokens.feltMid} />
          <stop offset="100%" stopColor={tokens.feltDark} />
        </radialGradient>
      </defs>

      {/* Wood lip */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#wood-${id})`} />

      {/* Outer gold rail */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx - 8}
        ry={ry - 8}
        stroke={tokens.goldRail}
        strokeWidth="1.4"
        fill="none"
      />

      {/* Inner gold rail */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx - 14}
        ry={ry - 14}
        stroke={tokens.goldRailFaint}
        strokeWidth="0.6"
        fill="none"
      />

      {/* Felt centre */}
      <ellipse cx={cx} cy={cy} rx={rx - 18} ry={ry - 18} fill={`url(#felt-${id})`} />

      {/* Inner shadow ring */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx - 18}
        ry={ry - 18}
        stroke={tokens.feltShadow}
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
};

export const OvalTable = memo(OvalTableImpl);
