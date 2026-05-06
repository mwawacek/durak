import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PlayerPublic } from '@durak/shared';
import { Card } from './Card';
import { colors, radii, spacing } from '../theme/colors';

interface Props {
  players: PlayerPublic[];
  attackerId: string | null;
  defenderId: string | null;
  youId: string;
}

const initial = (name: string): string => (name.trim()[0] ?? '?').toUpperCase();

export const PlayerBar: React.FC<Props> = ({ players, attackerId, defenderId, youId }) => {
  const opponents = players.filter((p) => p.id !== youId);

  return (
    <View style={styles.row}>
      {opponents.map((p) => {
        const isAttacker = p.id === attackerId;
        const isDefender = p.id === defenderId;
        const roleChip = isAttacker ? '⚔' : isDefender ? '🛡' : p.hasFinished ? '✓' : null;
        const topBorder = isAttacker
          ? colors.danger
          : isDefender
            ? colors.accent
            : 'transparent';

        return (
          <View
            key={p.id}
            style={[
              styles.player,
              { borderTopColor: topBorder, borderTopWidth: 2 },
              !p.isConnected && styles.offline,
            ]}
          >
            {roleChip ? (
              <View style={styles.roleChip}>
                <Text style={styles.roleChipText}>{roleChip}</Text>
              </View>
            ) : null}

            <View style={styles.handRow}>
              {Array.from({ length: Math.min(p.handCount, 6) }).map((_, i) => (
                <Card key={i} card={null} faceDown size="sm" style={styles.stackedBack} />
              ))}
            </View>

            <View style={styles.identityRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial(p.name)}</Text>
              </View>
              <View style={styles.identityCol}>
                <View style={styles.nameRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: p.isConnected ? colors.success : colors.textDim },
                    ]}
                  />
                  <Text style={styles.name} numberOfLines={1}>
                    {p.name}
                  </Text>
                </View>
                <Text style={styles.count}>{p.handCount} Karten</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    gap: spacing(2),
  },
  player: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    padding: spacing(3),
    borderRadius: radii.md,
    minWidth: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 2,
    alignItems: 'center',
    gap: spacing(2),
  },
  offline: { opacity: 0.4 },
  roleChip: {
    position: 'absolute',
    top: -10,
    right: 8,
    backgroundColor: colors.bg,
    borderRadius: radii.pill,
    paddingHorizontal: spacing(2),
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleChipText: { fontSize: 14 },
  handRow: { flexDirection: 'row', height: 48 },
  stackedBack: { marginHorizontal: -14 },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    alignSelf: 'stretch',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.felt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  identityCol: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
  statusDot: { width: 8, height: 8, borderRadius: radii.pill },
  name: { color: colors.text, fontSize: 13, fontWeight: '600', flexShrink: 1 },
  count: { color: colors.textDim, fontSize: 11 },
});
