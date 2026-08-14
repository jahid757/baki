import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { addProduct } from '../storage';
import { colors, spacing } from '../theme';

export default function AddProductModal({ visible, shopId, onClose, onAdded }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const reset = () => {
    setName('');
    setPrice('');
  };

  const handleSave = async () => {
    const numPrice = parseFloat(price);
    if (!name.trim() || isNaN(numPrice) || numPrice <= 0) return;
    await addProduct(shopId, name, numPrice);
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
        <View style={styles.sheet}>
          <Text style={styles.title}>Add product</Text>
          <TextInput
            style={styles.input}
            placeholder="Product name (e.g. Tea)"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, { marginTop: spacing.sm }]}
            placeholder="Price"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
          />
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

const styles = StyleSheet.create({
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
  row: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  btn: { flex: 1, padding: spacing.md, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: colors.cardAlt },
  saveBtn: { backgroundColor: colors.primary },
  cancelText: { color: colors.textMuted, fontWeight: '600' },
  saveText: { color: '#fff', fontWeight: '700' },
});
