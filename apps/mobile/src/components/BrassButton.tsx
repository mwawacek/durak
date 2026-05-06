import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, elevation, fonts } from '../theme/colors';

export type BrassVariant = 'primary' | 'danger' | 'secondary' | 'secondary-active';

interface Props {
  label: string;
  sub?: string;
  badge?: string;
  variant?: BrassVariant;
  onPress: () => void;
  disabled?: boolean;
}

const VARIANT_GRADIENTS: Record<BrassVariant, [string, string, string]> = {
  primary: [colors.goldHighlight, colors.gold, '#8a5a1f'],
  danger: [colors.redBright, colors.redDeep, colors.redDarkest],
  secondary: ['rgba(40,28,18,0.85)', 'rgba(15,8,4,0.9)', 'rgba(15,8,4,0.95)'],
  'secondary-active': [colors.gold, colors.redDeep, '#3a0c0b'],
};

const VARIANT_BORDERS: Record<BrassVariant, string> = {
  primary: 'rgba(255,225,160,0.7)',
  danger: 'rgba(220,80,72,0.7)',
  secondary: colors.goldMuted,
  'secondary-active': colors.goldHighlight,
};

const VARIANT_TEXT: Record<BrassVariant, string> = {
  primary: '#1a0905',
  danger: colors.creamSoft,
  secondary: colors.goldLight,
  'secondary-active': colors.creamSoft,
};

export const BrassButton: React.FC<Props> = ({
  label,
  sub,
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
      style={[disabled && { opacity: 0.5 }]}
    >
      <LinearGradient
        colors={VARIANT_GRADIENTS[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.btn,
          {
            borderColor: VARIANT_BORDERS[variant],
          },
          variant === 'primary' && elevation.brass,
          variant !== 'primary' && elevation.card,
        ]}
      >
        <Text style={[styles.label, { color: VARIANT_TEXT[variant] }]}>{label}</Text>
        {sub ? (
          <Text
            style={[
              styles.sub,
              { color: VARIANT_TEXT[variant], opacity: 0.75 },
            ]}
          >
            {sub}
          </Text>
        ) : null}
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
  btn: {
    minWidth: 110,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 0.5,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  sub: {
    fontSize: 9,
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -7,
    right: -6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 999,
    backgroundColor: '#1a0905',
    borderWidth: 1,
    borderColor: colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.goldLight, fontSize: 10, fontWeight: '800' },
});
