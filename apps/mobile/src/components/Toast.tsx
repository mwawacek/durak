import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';

interface Props {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
  /** Distance from the top of the screen (use safe-area top inset). */
  topOffset?: number;
}

export const Toast: React.FC<Props> = ({ message, onDismiss, durationMs = 3000, topOffset = 8 }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const [visibleMessage, setVisibleMessage] = useState<string | null>(null);

  // Stable callback ref so this effect doesn't re-run when the parent re-renders.
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  // Generation token: a fade-out's completion callback must only fire if its
  // own effect run is still the current one. Without this, a new message that
  // arrives during the previous fade-out would be wiped by the stale callback.
  const genRef = useRef(0);

  useEffect(() => {
    if (!message) return;
    const myGen = ++genRef.current;

    setVisibleMessage(message);
    opacity.setValue(0);
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
        // Stale callback (a newer message has arrived) — leave the new state alone.
        if (genRef.current !== myGen) return;
        setVisibleMessage(null);
        onDismissRef.current();
      });
    }, durationMs);
    return () => clearTimeout(t);
  }, [message, durationMs, opacity]);

  if (!visibleMessage) return null;

  return (
    <Animated.View style={[styles.toast, { top: topOffset, opacity }]} pointerEvents="none">
      <Text style={styles.text}>{visibleMessage}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing(4),
    right: spacing(4),
    backgroundColor: colors.bgPillStrong,
    borderWidth: 0.5,
    borderColor: colors.goldFaint,
    borderLeftWidth: 3,
    borderLeftColor: colors.redBright,
    borderRadius: radii.md,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
    zIndex: 100,
  },
  text: { color: colors.cream, fontSize: 14 },
});
