import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { addTransaction } from '../storage';
import { colors, spacing, CURRENCY } from '../theme';

export default function PaymentModal({ visible, shopId, currentDue, onClose, onPaid }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      setAmount('');
      setNote('');
    }
  }, [visible]);

  const handlePay = async (payAmount) => {
    const numAmount = parseFloat(payAmount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    await addTransaction({ shopId, type: 'payment', amount: numAmount, note: note.trim() || null });
    onPaid();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Make a payment</Text>
          <Text style={styles.subtitle}>Current due: {CURRENCY}{currentDue.toFixed(2)}</Text>
          <TextInput
            style={styles.input}
            placeholder="Amount"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <TextInput
            style={[styles.input, { marginTop: spacing.sm }]}
            placeholder="Note (optional)"
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
          />
          {currentDue > 0 && (
            <TouchableOpacity style={styles.fullBtn} onPress={() => handlePay(currentDue)}>
              <Text style={styles.fullBtnText}>Pay full amount ({CURRENCY}{currentDue.toFixed(2)})</Text>
            </TouchableOpacity>
          )}
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={() => handlePay(amount)}>
              <Text style={styles.saveText}>Pay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: colors.card, padding: spacing.lg, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  subtitle: { color: colors.textMuted, marginTop: 4, marginBottom: spacing.md },
  input: {
    backgroundColor: colors.cardAlt,
    color: colors.text,
    borderRadius: 10,
    padding: spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fullBtn: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.success,
    alignItems: 'center',
  },
  fullBtnText: { color: colors.success, fontWeight: '700' },
  row: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  btn: { flex: 1, padding: spacing.md, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: colors.cardAlt },
  saveBtn: { backgroundColor: colors.primary },
  cancelText: { color: colors.textMuted, fontWeight: '600' },
  saveText: { color: '#fff', fontWeight: '700' },
});