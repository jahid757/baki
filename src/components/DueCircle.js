import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, CURRENCY } from '../theme';

const SIZE = 132;
const BORDER_WIDTH = 8;

// <=100 normal, 100-300 average/warning, >300 high/danger
function getStatus(amount) {
  if (amount <= 100) return { color: colors.success, label: 'Low due' };
  if (amount <= 300) return { color: colors.warning, label: 'Average due' };
  return { color: colors.danger, label: 'High due' };
}

export default function DueCircle({ amount, onPress }) {
  const { color, label } = getStatus(amount);

  return (
    <TouchableOpacity style={styles.wrapper} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.circle, { borderColor: color }]}>
        <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
          {CURRENCY}
          {amount.toFixed(0)}
        </Text>
        <Text style={[styles.label, { color }]}>{label}</Text>
      </View>
      <Text style={styles.tapHint}>Tap for breakdown</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: BORDER_WIDTH,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  amount: { color: colors.text, fontSize: 24, fontWeight: '800' },
  label: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  tapHint: { color: colors.textMuted, fontSize: 11, marginTop: spacing.sm },
});
