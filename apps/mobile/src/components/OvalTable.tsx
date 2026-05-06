import React, { memo } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii } from '../theme/colors';

interface Props {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/**
 * Oval mahogany table: outer wood lip, double gold rail, dark forest felt center.
 * Positions are absolute within the parent. cx/cy = ellipse center, rx/ry = radii.
 * Memoized — only re-renders when geometry changes (i.e. screen size).
 */
const OvalTableImpl: React.FC<Props> = ({ cx, cy, rx, ry }) => {
  return (
    <>
      <LinearGradient
        colors={[colors.woodHighlight, colors.woodMid, colors.woodDark]}
        style={{
          position: 'absolute',
          left: cx - rx,
          top: cy - ry,
          width: rx * 2,
          height: ry * 2,
          borderRadius: radii.oval,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: cx - rx + 8,
          top: cy - ry + 8,
          width: (rx - 8) * 2,
          height: (ry - 8) * 2,
          borderRadius: radii.oval,
          borderWidth: 1.2,
          borderColor: colors.goldRail,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: cx - rx + 14,
          top: cy - ry + 14,
          width: (rx - 14) * 2,
          height: (ry - 14) * 2,
          borderRadius: radii.oval,
          borderWidth: 0.5,
          borderColor: colors.goldRailFaint,
        }}
      />
      <LinearGradient
        colors={[colors.felt, colors.feltMid, colors.feltDark]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          left: cx - rx + 18,
          top: cy - ry + 18,
          width: (rx - 18) * 2,
          height: (ry - 18) * 2,
          borderRadius: radii.oval,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: cx - rx + 18,
          top: cy - ry + 18,
          width: (rx - 18) * 2,
          height: (ry - 18) * 2,
          borderRadius: radii.oval,
          borderWidth: 1,
          borderColor: colors.feltShadow,
        }}
      />
    </>
  );
};

export const OvalTable = memo(OvalTableImpl);
