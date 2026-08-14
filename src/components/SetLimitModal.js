import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing, CURRENCY } from '../theme';

export default function SetLimitModal({ visible, currentLimit, onClose, onSave }) {
  const [limit, setLimit] = useState('');

  useEffect(() => {
    if (visible) setLimit(currentLimit != null ? String(currentLimit) : '');
  }, [visible, currentLimit]);

  const handleSave = async () => {
    const num = parseFloat(limit);
    await onSave(isNaN(num) || num <= 0 ? null : num);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Set due warning limit</Text>
          <Text style={styles.subtitle}>
            You'll get a heads-up when your due here gets close to, then passes, this amount. Leave empty to remove it.
          </Text>
          <TextInput
            style={styles.input}
            placeholder={`e.g. 300 (${CURRENCY})`}
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={limit}
            onChangeText={setLimit}
          />
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onClose}>
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

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: colors.card, padding: spacing.lg, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: spacing.md },
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