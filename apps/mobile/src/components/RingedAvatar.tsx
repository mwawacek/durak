import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../theme/colors';

interface Props {
  initials: string;
  active?: boolean;
  size?: number;
}

/** Gold-rimmed initial avatar; gold ring when active. */
export const RingedAvatar: React.FC<Props> = ({ initials, active = false, size = 28 }) => {
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: active ? 1.5 : 1,
          borderColor: active ? colors.goldLight : 'rgba(212,165,72,0.35)',
        },
      ]}
    >
      <LinearGradient
        colors={active ? [colors.goldHighlight, '#b88a3a'] : ['#4a3520', '#2a1f12']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.face,
          {
            width: size - 4,
            height: size - 4,
            borderRadius: (size - 4) / 2,
          },
        ]}
      >
        <Text
          style={{
            color: active ? '#1a0905' : colors.goldLight,
            fontFamily: fonts.serif,
            fontSize: size * 0.42,
            fontWeight: '800',
          }}
        >
          {initials}
        </Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  face: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
