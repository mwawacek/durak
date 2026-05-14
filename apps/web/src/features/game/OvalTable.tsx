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
 * Oval table for "Midnight Velvet": dark teal felt with a thin crimson
 * accent ring and a soft amber halo above. No double brass rail — the
 * accents do the work without ornament.
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
        <radialGradient id={`felt-${id}`} cx="50%" cy="35%" r="65%" fx="50%" fy="30%">
          <stop offset="0%" stopColor={tokens.felt.light} />
          <stop offset="55%" stopColor={tokens.felt.base} />
          <stop offset="100%" stopColor={tokens.felt.dark} />
        </radialGradient>
        <radialGradient id={`glow-${id}`} cx="50%" cy="20%" r="55%" fx="50%" fy="15%">
          <stop offset="0%" stopColor={tokens.amber[400]} stopOpacity="0.16" />
          <stop offset="100%" stopColor={tokens.amber[400]} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Felt surface */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#felt-${id})`} />

      {/* Outer rim — thin crimson accent */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx - 2}
        ry={ry - 2}
        stroke={tokens.crimson[500]}
        strokeWidth="1.2"
        strokeOpacity="0.55"
        fill="none"
      />

      {/* Inner hairline */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx - 8}
        ry={ry - 8}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
        fill="none"
      />

      {/* Soft amber glow from the top */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#glow-${id})`} />

      {/* Subtle inner shadow at the bottom */}
      <ellipse
        cx={cx}
        cy={cy + ry * 0.4}
        rx={rx * 0.85}
        ry={ry * 0.5}
        fill={tokens.felt.shadow}
        opacity="0.35"
        style={{ filter: 'blur(20px)' }}
      />
    </svg>
  );
};

export const OvalTable = memo(OvalTableImpl);
