import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, CURRENCY } from '../theme';

export default function ExpenseStats({ thisWeek, thisMonth }) {
  return (
    <View style={styles.container}>
      <View style={styles.statBox}>
        <Text style={styles.statLabel}>This week</Text>
        <Text style={styles.statAmount} numberOfLines={1} adjustsFontSizeToFit>
          {CURRENCY}
          {thisWeek.toFixed(0)}
        </Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statLabel}>This month</Text>
        <Text style={styles.statAmount} numberOfLines={1} adjustsFontSizeToFit>
          {CURRENCY}
          {thisMonth.toFixed(0)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginLeft: spacing.lg, justifyContent: 'center', gap: spacing.sm },
  statBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  statAmount: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 4 },
});
