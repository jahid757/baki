import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp,spacing} from '../ThemeContext';

const SIZE = 132;
const BORDER_WIDTH = 8;

// <=100 normal, 100-300 average/warning, >300 high/danger
function getStatus(amount) {
  if (amount <= 100) return { color: '#1FA971', label: 'Low due' };
  if (amount <= 300) return { color: '#FFB020', label: 'Average due' };
  return { color: '#FF4D4D', label: 'High due' };
}

export default function DueCircle({ amount, onPress }) {
const { colors, currency } = useApp();
const styles = makeStyles(colors);
// console.log(currency)
  const { color, label } = getStatus(amount);

  return (
    <TouchableOpacity style={styles.wrapper} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.circle, { borderColor: color }]}>
        <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
          {currency}
          {amount.toFixed(0)}
        </Text>
        <Text style={[styles.label, { color }]}>{label}</Text>
      </View>
      <Text style={styles.tapHint}>Tap for breakdown</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (colors) => {
  return StyleSheet.create({
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
}