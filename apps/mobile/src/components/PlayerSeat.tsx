import React, { memo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { PlayerPublic } from '@durak/shared';
import { Card } from './Card';
import { RingedAvatar } from './RingedAvatar';
import { colors, presets, radii } from '../theme/colors';

export type SeatRole = 'attacker' | 'defender' | 'wait';

interface Props {
  player: PlayerPublic;
  role: SeatRole;
  style?: ViewStyle;
}

const CARD_W = 22;
const ATTACK_GRAD = [colors.redMuted1, colors.redMuted2] as const;
const DEFEND_GRAD = [colors.defenderMuted1, colors.defenderMuted2] as const;
const WAIT_GRAD = [colors.brassWoodGrad, colors.brassDarker] as const;

const initial = (name: string): string => (name.trim()[0] ?? '?').toUpperCase();

/** Opponent at the table perimeter: fanned card backs above a name pill. */
const PlayerSeatImpl: React.FC<Props> = ({ player, role, style }) => {
  const isAttack = role === 'attacker';
  const isDefend = role === 'defender';
  const showCount = Math.min(player.handCount, 5);
  const grad = isAttack ? ATTACK_GRAD : isDefend ? DEFEND_GRAD : WAIT_GRAD;
  const borderColor = isAttack ? colors.redOutline : isDefend ? colors.goldLight : colors.border;
  return (
    <View style={[styles.wrap, style]}>
      <View
        style={{
          position: 'relative',
          width: CARD_W * 2,
          height: CARD_W * 1.2,
          marginBottom: -CARD_W * 0.4,
        }}
      >
        {Array.from({ length: showCount }).map((_, i) => {
          const t = showCount === 1 ? 0 : (i - (showCount - 1) / 2) / ((showCount - 1) / 2);
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                marginLeft: -CARD_W / 2,
                transform: [{ translateX: t * CARD_W * 0.4 }, { rotate: `${t * 14}deg` }],
              }}
            >
              <Card card={null} faceDown size="sm" />
            </View>
          );
        })}
      </View>

      <LinearGradient
        colors={grad}
        style={[styles.namePill, { borderColor }, !player.isConnected && styles.offline]}
      >
        <RingedAvatar initials={initial(player.name)} active={isAttack || isDefend} size={22} />
        <Text style={styles.name} numberOfLines={1}>
          {player.name}
        </Text>
        <View style={styles.countPill}>
          <Text
            style={{
              fontSize: 9,
              fontWeight: '800',
              color: isAttack ? colors.redCount : colors.goldLight,
            }}
          >
            {player.handCount}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

export const PlayerSeat = memo(PlayerSeatImpl);

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4 },
  namePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 3,
    paddingRight: 10,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 0.5,
  },
  name: { fontSize: 10, fontWeight: '700', color: colors.creamSoft, maxWidth: 70 },
  countPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  offline: { opacity: 0.4 },
});
