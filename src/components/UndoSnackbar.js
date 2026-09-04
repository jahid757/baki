import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useApp,spacing  } from '../ThemeContext';

export default function UndoSnackbar({ visible, message, onUndo, onHide, duration = 4000 }) {
  const { colors } = useApp();
  const styles = makeStyles(colors);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onHide();
      }, duration);
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, message]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.wrapper, { opacity }]} pointerEvents="box-none">
      <View style={styles.bar}>
        <Text style={styles.message} numberOfLines={1}>{message}</Text>
        <TouchableOpacity
          onPress={() => {
            if (timerRef.current) clearTimeout(timerRef.current);
            onUndo();
          }}
        >
          <Text style={styles.undo}>Undo</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const makeStyles = (colors) => {
  return StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: spacing.lg,
      right: spacing.lg,
      bottom: 24,
  },
  bar: {
    backgroundColor: colors.bg,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  message: { color: colors.text, fontSize: 14, flex: 1, marginRight: spacing.md },
  undo: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
}