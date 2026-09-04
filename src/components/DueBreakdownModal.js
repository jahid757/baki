import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useApp, spacing } from '../ThemeContext';

export default function DueBreakdownModal({ visible, breakdown, onClose }) {
  const { colors, currency } = useApp();
  const styles = makeStyles(colors);

  const rows = [
    { label: 'Today', value: breakdown.today },
    { label: 'Yesterday', value: breakdown.yesterday },
    { label: 'Last 7 days', value: breakdown.last7Days },
    { label: 'Last 1 month', value: breakdown.last30Days },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>

        {/* Outside area - tap to close */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Bottom Sheet */}
        <View style={styles.sheet}>
          <Text style={styles.title}>Due Breakdown</Text>

          {rows.map((r) => (
            <View key={r.label} style={styles.row}>
              <Text style={styles.rowLabel}>{r.label}</Text>

              <Text style={styles.rowValue}>
                {currency}
                {Number(r.value || 0).toFixed(2)}
              </Text>
            </View>
          ))}

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors) => {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },

    // Transparent/dark area outside the sheet
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },

    sheet: {
      backgroundColor: colors.card,
      padding: spacing.lg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },

    title: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: spacing.md,
    },

    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    rowLabel: {
      color: colors.textMuted,
      fontSize: 14,
    },

    rowValue: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 14,
    },

    closeBtn: {
      marginTop: spacing.md,
      padding: spacing.md,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },

    closeText: {
      color: '#fff',
      fontWeight: '700',
    },
  });
};