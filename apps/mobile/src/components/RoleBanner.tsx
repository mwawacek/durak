import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';

export type RoleBannerKind = 'attacker' | 'defender' | 'waiting';

interface Props {
  kind: RoleBannerKind;
  message: string;
}

const COLOR_BY_KIND: Record<RoleBannerKind, { bg: string; bar: string; fg: string; icon: string }> = {
  attacker: {
    bg: 'rgba(193,74,74,0.18)',
    bar: colors.danger,
    fg: colors.text,
    icon: '⚔',
  },
  defender: {
    bg: 'rgba(212,168,90,0.18)',
    bar: colors.accent,
    fg: colors.text,
    icon: '🛡',
  },
  waiting: {
    bg: colors.border,
    bar: 'transparent',
    fg: colors.textDim,
    icon: '⏳',
  },
};

export const RoleBanner: React.FC<Props> = ({ kind, message }) => {
  const c = COLOR_BY_KIND[kind];
  return (
    <View style={[styles.banner, { backgroundColor: c.bg, borderLeftColor: c.bar }]}>
      <Text style={[styles.icon, { color: c.fg }]}>{c.icon}</Text>
      <Text style={[styles.message, { color: c.fg }]} numberOfLines={1}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    height: 44,
    borderRadius: radii.md,
    borderLeftWidth: 4,
    paddingHorizontal: spacing(3),
    marginHorizontal: spacing(3),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
  },
  icon: { fontSize: 18 },
  message: { fontSize: 14, fontWeight: '600', flex: 1 },
});
