import { useMemo } from 'react';
import { Dimensions } from 'react-native';
import type { PlayerPublic } from '@durak/shared';

export interface TableGeometry {
  /** Width of the table layer (= screen width). */
  tableW: number;
  /** Height of the table layer in screen-pixels (after subtracting safe-area top + bottom-reserved space). */
  tableH: number;
  /** Y offset of the table layer from screen top (= safe-area top inset). */
  tableTop: number;
  /** Ellipse center within the table layer's local coords. */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Convert an angle (degrees, 0=right, -90=top) into an absolute (x,y) within the table layer. */
  pointOnRim(angleDeg: number): { x: number; y: number };
}

export interface OpponentSeat {
  player: PlayerPublic;
  role: 'attacker' | 'defender' | 'wait';
  x: number;
  y: number;
}

/**
 * Angles (deg, 0=right, -90=top) for opponents distributed across the upper rim.
 * Constrained so leftmost/rightmost seats don't clip past the screen edges on a
 * 390 px iPhone.
 */
const ANGLES_BY_COUNT: Record<number, number[]> = {
  1: [-90],
  2: [-110, -70],
  3: [-130, -90, -50],
  4: [-140, -110, -70, -40],
  5: [-150, -120, -90, -60, -30],
};

interface GeometryArgs {
  /** Top safe-area inset (notch / Dynamic Island clearance). */
  topInset: number;
  /** Vertical pixels reserved at the bottom for banner + actions + hand + bottom safe area. */
  reservedBottom: number;
}

/**
 * Geometry of the oval table. The table layer starts below the top safe area
 * and shrinks to leave `reservedBottom` for the bottom UI strip — so seats and
 * the felt always sit in the visible, non-system region of the screen.
 */
export const useTableGeometry = ({ topInset, reservedBottom }: GeometryArgs): TableGeometry => {
  return useMemo(() => {
    const screen = Dimensions.get('window');
    const tableW = screen.width;
    const tableH = Math.max(280, screen.height - topInset - reservedBottom);
    const cx = tableW * 0.5;
    const cy = tableH * 0.42;
    const rx = tableW * 0.46;
    const ry = tableH * 0.32;
    return {
      tableW,
      tableH,
      tableTop: topInset,
      cx,
      cy,
      rx,
      ry,
      pointOnRim(angleDeg: number) {
        const rad = (angleDeg * Math.PI) / 180;
        return { x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) };
      },
    };
  }, [topInset, reservedBottom]);
};

/** Resolves opponents into seats with angle-based positions and current role. */
export const useOpponentSeats = (
  opponents: PlayerPublic[],
  attackerId: string | null,
  defenderId: string | null,
  geometry: TableGeometry,
): OpponentSeat[] => {
  return useMemo(() => {
    const angles =
      ANGLES_BY_COUNT[opponents.length] ?? ANGLES_BY_COUNT[5]!.slice(0, opponents.length);
    return opponents.map((player, i) => {
      const angle = angles[i] ?? -90;
      const { x, y } = geometry.pointOnRim(angle);
      const role: OpponentSeat['role'] =
        player.id === attackerId
          ? 'attacker'
          : player.id === defenderId
            ? 'defender'
            : 'wait';
      return { player, role, x, y };
    });
  }, [opponents, attackerId, defenderId, geometry]);
};
