import { useMemo } from 'react';
import { Dimensions } from 'react-native';
import type { PlayerPublic } from '@durak/shared';

export interface TableGeometry {
  tableW: number;
  tableH: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Convert an angle (degrees, 0=right, -90=top) into an absolute (x,y) on the rim. */
  pointOnRim(angleDeg: number): { x: number; y: number };
}

export interface OpponentSeat {
  player: PlayerPublic;
  role: 'attacker' | 'defender' | 'wait';
  x: number;
  y: number;
}

/** Angles (deg, 0=right, -90=top) for opponents distributed across the upper rim. */
const ANGLES_BY_COUNT: Record<number, number[]> = {
  1: [-90],
  2: [-110, -70],
  3: [-130, -90, -50],
  4: [-135, -90, -45, 0],
  5: [-150, -110, -70, -30, 10],
};

/** Geometry of the oval table — depends only on screen dimensions. */
export const useTableGeometry = (): TableGeometry => {
  return useMemo(() => {
    const screen = Dimensions.get('window');
    const tableW = screen.width;
    const tableH = screen.height * 0.62;
    const cx = tableW * 0.5;
    const cy = tableH * 0.42;
    const rx = tableW * 0.46;
    const ry = tableH * 0.32;
    return {
      tableW,
      tableH,
      cx,
      cy,
      rx,
      ry,
      pointOnRim(angleDeg: number) {
        const rad = (angleDeg * Math.PI) / 180;
        return { x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) };
      },
    };
  }, []);
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
