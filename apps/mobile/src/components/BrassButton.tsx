import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, elevation, radii } from '../theme/colors';

export type BrassVariant = 'primary' | 'danger' | 'secondary' | 'secondary-active';

interface Props {
  label: string;
  badge?: string;
  variant?: BrassVariant;
  onPress: () => void;
  disabled?: boolean;
}

const VARIANT_GRADIENTS: Record<BrassVariant, readonly [string, string, string]> = {
  primary: [colors.goldHighlight, colors.gold, colors.goldDeep],
  danger: [colors.redBright, colors.redDeep, colors.redDarkest],
  secondary: [colors.brassWoodGrad, colors.brassDarker, colors.brassDarkest],
  'secondary-active': [colors.gold, colors.redDeep, colors.redDarkestActive],
};

const VARIANT_BORDERS: Record<BrassVariant, string> = {
  primary: 'rgba(255,225,160,0.7)', // unique highlight, kept as literal
  danger: colors.redOutline,
  secondary: colors.goldMuted,
  'secondary-active': colors.goldHighlight,
};

const VARIANT_TEXT: Record<BrassVariant, string> = {
  primary: colors.inkBlack,
  danger: colors.creamSoft,
  secondary: colors.goldLight,
  'secondary-active': colors.creamSoft,
};

export const BrassButton: React.FC<Props> = ({
  label,
  badge,
  variant = 'primary',
  onPress,
  disabled,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={disabled ? styles.dim : undefined}
    >
      <LinearGradient
        colors={VARIANT_GRADIENTS[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.btn,
          { borderColor: VARIANT_BORDERS[variant] },
          variant === 'primary' && elevation.brass,
          variant !== 'primary' && elevation.card,
        ]}
      >
        <Text style={[styles.label, { color: VARIANT_TEXT[variant] }]}>{label}</Text>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  dim: { opacity: 0.5 },
  btn: {
    minWidth: 110,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.pill,
    borderWidth: 0.5,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  badge: {
    position: 'absolute',
    top: -7,
    right: -6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.inkBlack,
    borderWidth: 1,
    borderColor: colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.goldLight, fontSize: 10, fontWeight: '800' },
});
