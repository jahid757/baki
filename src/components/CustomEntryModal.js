import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useApp,spacing } from '../ThemeContext';

export default function CustomEntryModal({ visible, currentDue, onClose, onSave }) {
  const { colors,currency } = useApp();
  const styles = makeStyles(colors);

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState('purchase'); // 'purchase' | 'payment'

  const reset = () => {
    setAmount('');
    setNote('');
    setType('purchase');
  };

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    // if (type === 'payment' && numAmount > currentDue) {
    //   Alert.alert(
    //     'পরিমাণ বেশি হয়ে গেছে',
    //     `আপনার বাকি আছে ${CURRENCY}${currentDue.toFixed(2)}। এর বেশি পেমেন্ট দেওয়া যাবে না।`
    //   );
    //   return;
    // }

    await onSave({ type, amount: numAmount, note: note.trim() || null });
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Custom entry</Text>

          {/* <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'purchase' && styles.typeBtnActive]}
              onPress={() => setType('purchase')}
            >
              <Text style={[styles.typeText, type === 'purchase' && styles.typeTextActive]}>Add to due</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'payment' && styles.typeBtnActive]}
              onPress={() => setType('payment')}
            >
              <Text style={[styles.typeText, type === 'payment' && styles.typeTextActive]}>Payment</Text>
            </TouchableOpacity>
          </View> */}

          {type === 'payment' && (
            <Text style={styles.dueHint}>Current due: {currency}{currentDue.toFixed(2)}</Text>
          )}

          <TextInput
            style={styles.input}
            placeholder={`Amount (${currency})`}
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <TextInput
            style={[styles.input, { marginTop: spacing.sm }]}
            placeholder="Note (e.g. borrowed for a friend)"
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
          />

          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (colors) => {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    sheet: { backgroundColor: colors.card, padding: spacing.lg, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    title: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: spacing.md },
    typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    typeBtn: {
      flex: 1,
      padding: spacing.sm,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
  },
  typeBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  typeText: { color: colors.textMuted, fontWeight: '600' },
  typeTextActive: { color: '#fff' },
  dueHint: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.cardAlt,
    color: colors.text,
    borderRadius: 10,
    padding: spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  btn: { flex: 1, padding: spacing.md, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: colors.cardAlt },
  saveBtn: { backgroundColor: colors.primary },
  cancelText: { color: colors.textMuted, fontWeight: '600' },
  saveText: { color: '#fff', fontWeight: '700' },
});
}