import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useApp, spacing } from '../ThemeContext';

export default function DeleteDataPinModal({
  visible,
  onClose,
  onVerify,
}) {
  const { colors } = useApp();

  const [pin, setPin] = useState('');
  const styles = makeStyles(colors);

  useEffect(() => {
    if (visible) {
      setPin('');
    }
  }, [visible]);

  const handleVerify = () => {
    onVerify(pin);
  };

  const handleClose = () => {
    setPin('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔒</Text>
          </View>

          <Text style={styles.title}>Enter PIN</Text>

          <Text style={styles.subtitle}>
            Enter your current PIN to delete all data.
          </Text>

          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, '');
              setPin(cleaned);
            }}
            placeholder="Enter your PIN"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            autoFocus
          />

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerify}
              activeOpacity={0.8}
            >
              <Text style={styles.verifyText}>Verify</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.55)',
      padding: spacing.lg,
    },

    modal: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: spacing.lg,
    },

    iconContainer: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: spacing.md,
    },

    icon: {
      fontSize: 24,
    },

    title: {
      color: colors.text,
      fontSize: 21,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: spacing.sm,
    },

    subtitle: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },

    input: {
      height: 52,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.background,
      color: colors.text,
      fontSize: 20,
      textAlign: 'center',
      letterSpacing: 6,
      marginBottom: spacing.lg,
    },

    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },

    cancelButton: {
      flex: 1,
      height: 48,
      borderRadius: 10,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },

    cancelText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
    },

    verifyButton: {
      flex: 1,
      height: 48,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },

    verifyText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
  });