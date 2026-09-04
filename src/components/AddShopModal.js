import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { addShop } from '../storage';
import { useApp,spacing } from '../ThemeContext';

export default function AddShopModal({ visible, onClose, onAdded }) {
  const { colors,currency } = useApp();
  const styles = makeStyles(colors);
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');

  const reset = () => {
    setName('');
    setLimit('');
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const numLimit = parseFloat(limit);
    await addShop(name, isNaN(numLimit) || numLimit <= 0 ? null : numLimit);
    reset();
    onAdded();
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
          <Text style={styles.title}>Add shop</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Rahim Tea Stall / Rahim"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <TextInput
            style={[styles.input, { marginTop: spacing.sm }]}
            placeholder={`Warning limit (optional, ${currency})`}
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={limit}
            onChangeText={setLimit}
          />
          {/* <Text style={styles.hint}>You'll get a heads-up when your due here gets close to this amount.</Text> */}
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave}>
              <Text style={styles.saveText}>Add</Text>
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
    input: {
      backgroundColor: colors.cardAlt,
      color: colors.text,
      borderRadius: 10,
      padding: spacing.md,
      fontSize: 16,
      borderWidth: 1,
    borderColor: colors.border,
  },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xs },
  row: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  btn: { flex: 1, padding: spacing.md, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: colors.cardAlt },
  saveBtn: { backgroundColor: colors.primary },
  cancelText: { color: colors.textMuted, fontWeight: '600' },
  saveText: { color: '#fff', fontWeight: '700' },
});
}