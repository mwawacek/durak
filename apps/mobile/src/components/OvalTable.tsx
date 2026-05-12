import React, { memo } from 'react';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../theme/colors';

interface Props {
  /** Width of the SVG canvas — typically the table-layer width. */
  width: number;
  /** Height of the SVG canvas. */
  height: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/**
 * Oval mahogany table rendered with real SVG ellipses + radial gradients.
 * (RN's `borderRadius: 9999` on a non-square View produces a stadium shape,
 * not an ellipse — hence SVG.)
 *
 * Layers, outer → inner:
 *   1. Wood lip with radial highlight from upper centre
 *   2. Outer gold rail (thick)
 *   3. Inner gold rail (hairline)
 *   4. Felt with darker radial vignette
 */
const OvalTableImpl: React.FC<Props> = ({ width, height, cx, cy, rx, ry }) => {
  return (
    <Svg
      width={width}
      height={height}
      style={{ position: 'absolute', left: 0, top: 0 }}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id="wood" cx="50%" cy="30%" rx="70%" ry="70%" fx="50%" fy="30%">
          <Stop offset="0%" stopColor={colors.woodHighlight} />
          <Stop offset="60%" stopColor={colors.woodMid} />
          <Stop offset="100%" stopColor={colors.woodDark} />
        </RadialGradient>
        <RadialGradient id="felt" cx="50%" cy="35%" rx="65%" ry="60%" fx="50%" fy="35%">
          <Stop offset="0%" stopColor={colors.felt} />
          <Stop offset="60%" stopColor={colors.feltMid} />
          <Stop offset="100%" stopColor={colors.feltDark} />
        </RadialGradient>
      </Defs>

      {/* Wood lip */}
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#wood)" />

      {/* Outer gold rail (thick) */}
      <Ellipse
        cx={cx}
        cy={cy}
        rx={rx - 8}
        ry={ry - 8}
        stroke={colors.goldRail}
        strokeWidth={1.4}
        fill="none"
      />

      {/* Inner gold rail (hairline) */}
      <Ellipse
        cx={cx}
        cy={cy}
        rx={rx - 14}
        ry={ry - 14}
        stroke={colors.goldRailFaint}
        strokeWidth={0.6}
        fill="none"
      />

      {/* Felt centre */}
      <Ellipse
        cx={cx}
        cy={cy}
        rx={rx - 18}
        ry={ry - 18}
        fill="url(#felt)"
      />

      {/* Subtle inner shadow ring on the felt */}
      <Ellipse
        cx={cx}
        cy={cy}
        rx={rx - 18}
        ry={ry - 18}
        stroke={colors.feltShadow}
        strokeWidth={1}
        fill="none"
      />
    </Svg>
  );
};

export const OvalTable = memo(OvalTableImpl);
