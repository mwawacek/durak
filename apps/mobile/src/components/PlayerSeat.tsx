import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { PlayerPublic } from '@durak/shared';
import { Card } from './Card';
import { RingedAvatar } from './RingedAvatar';
import { colors } from '../theme/colors';

interface Props {
  player: PlayerPublic;
  role: 'attacker' | 'defender' | 'wait';
  cardW?: number;
  style?: ViewStyle;
}

const initial = (name: string): string => (name.trim()[0] ?? '?').toUpperCase();

/** Opponent at the table perimeter: fanned card backs above a name pill. */
export const PlayerSeat: React.FC<Props> = ({ player, role, cardW = 22, style }) => {
  const isAttack = role === 'attacker';
  const isDefend = role === 'defender';
  const showCount = Math.min(player.handCount, 5);
  return (
    <View style={[styles.wrap, style]}>
      {/* fanned card backs */}
      <View
        style={{
          position: 'relative',
          width: cardW * 2,
          height: cardW * 1.2,
          marginBottom: -cardW * 0.4,
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
                marginLeft: -cardW / 2,
                transform: [
                  { translateX: t * cardW * 0.4 },
                  { rotate: `${t * 14}deg` },
                ],
              }}
            >
              <Card card={null} faceDown size="sm" />
            </View>
          );
        })}
      </View>

      {/* nameplate */}
      <LinearGradient
        colors={
          isAttack
            ? ['rgba(168,32,31,0.55)', 'rgba(50,8,7,0.85)']
            : isDefend
              ? ['rgba(212,165,72,0.4)', 'rgba(40,28,18,0.9)']
              : ['rgba(40,28,18,0.85)', 'rgba(15,8,4,0.9)']
        }
        style={[
          styles.namePill,
          {
            borderColor: isAttack
              ? 'rgba(220,80,72,0.7)'
              : isDefend
                ? colors.goldLight
                : colors.border,
          },
          !player.isConnected && styles.offline,
        ]}
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
              color: isAttack ? '#ff9a90' : colors.goldLight,
            }}
          >
            {player.handCount}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 4,
  },
  namePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 3,
    paddingRight: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 0.5,
  },
  name: { fontSize: 10, fontWeight: '700', color: colors.creamSoft, maxWidth: 70 },
  countPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  offline: { opacity: 0.4 },
});
