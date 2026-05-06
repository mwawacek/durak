import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';

export interface ActionDef {
  key: string;
  label: string;
  variant: 'success' | 'danger' | 'secondary' | 'secondary-active';
  onPress: () => void;
}

interface Props {
  actions: ActionDef[];
}

export const ActionBar: React.FC<Props> = ({ actions }) => {
  if (actions.length === 0) {
    return <View style={styles.placeholder} />;
  }
  return (
    <View style={styles.row}>
      {actions.map((a) => (
        <TouchableOpacity
          key={a.key}
          style={[styles.btn, VARIANT_STYLES[a.variant]]}
          onPress={a.onPress}
          activeOpacity={0.8}
        >
          <Text style={[styles.btnText, VARIANT_TEXT[a.variant]]}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const VARIANT_STYLES = {
  success: { backgroundColor: colors.success, borderColor: colors.success },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
  secondary: { backgroundColor: 'transparent', borderColor: colors.accent },
  'secondary-active': { backgroundColor: colors.accent, borderColor: colors.accentStrong },
} as const;

const VARIANT_TEXT = {
  success: { color: colors.bg },
  danger: { color: colors.text },
  secondary: { color: colors.accent },
  'secondary-active': { color: colors.bg },
} as const;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing(2),
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
  },
  placeholder: { height: spacing(2) },
  btn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(3),
    borderWidth: 2,
  },
  btnText: { fontWeight: '700', fontSize: 15 },
});
