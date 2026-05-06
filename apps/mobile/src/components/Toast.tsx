import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';

interface Props {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
}

export const Toast: React.FC<Props> = ({ message, onDismiss, durationMs = 3000 }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const [visibleMessage, setVisibleMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    setVisibleMessage(message);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    const t = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setVisibleMessage(null);
        onDismiss();
      });
    }, durationMs);
    return () => clearTimeout(t);
  }, [message, durationMs, onDismiss, opacity]);

  if (!visibleMessage) return null;

  return (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <Text style={styles.text}>{visibleMessage}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: spacing(2),
    left: spacing(4),
    right: spacing(4),
    backgroundColor: 'rgba(20,24,26,0.95)',
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    borderRadius: radii.md,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
    zIndex: 100,
  },
  text: { color: colors.text, fontSize: 14 },
});
