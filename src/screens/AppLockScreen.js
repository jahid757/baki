import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import {
  verifyAppLockPin,
  getAppLockRecoveryQuestion,
  verifyAppLockAnswer,
  resetAppLockPin,
} from '../storage';

import { useApp, spacing } from '../ThemeContext';

export default function AppLockScreen({ onUnlock }) {
  const { colors } = useApp();
  const styles = makeStyles(colors);

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const [mode, setMode] = useState('pin');

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [recoveryError, setRecoveryError] = useState('');

  const handleUnlock = async () => {
    if (!pin) {
      setError('Please enter your PIN.');
      return;
    }

    try {
      const ok = await verifyAppLockPin(pin);

      if (ok) {
        setPin('');
        setError('');
        onUnlock();
      } else {
        setError('Wrong PIN. Please try again.');
        setPin('');
      }
    } catch (error) {
      console.error('PIN verification failed:', error);
      setError('Something went wrong. Please try again.');
    }
  };

  const handleForgotPin = async () => {
    try {
      const recoveryQuestion =
        await getAppLockRecoveryQuestion();

      if (!recoveryQuestion) {
        Alert.alert(
          'Recovery Not Set',
          'A security question has not been set for this App Lock.'
        );
        return;
      }

      setQuestion(recoveryQuestion);
      setAnswer('');
      setRecoveryError('');
      setMode('recovery');
    } catch (error) {
      console.error('Failed to load recovery question:', error);

      Alert.alert(
        'Error',
        'Could not load PIN recovery. Please try again.'
      );
    }
  };

  const handleVerifyAnswer = async () => {
    if (!answer.trim()) {
      setRecoveryError('Please enter your answer.');
      return;
    }

    try {
      const correct = await verifyAppLockAnswer(answer);

      if (!correct) {
        setRecoveryError(
          'Incorrect answer. Please try again.'
        );
        setAnswer('');
        return;
      }

      setRecoveryError('');
      setNewPin('');
      setConfirmPin('');
      setMode('newPin');
    } catch (error) {
      console.error('Recovery verification failed:', error);

      setRecoveryError(
        'Something went wrong. Please try again.'
      );
    }
  };

  const handleResetPin = async () => {
    if (!newPin || !confirmPin) {
      setRecoveryError('Please enter and confirm your new PIN.');
      return;
    }

    if (newPin.length < 4) {
      setRecoveryError('PIN must be at least 4 digits.');
      return;
    }

    if (newPin !== confirmPin) {
      setRecoveryError('PINs do not match.');
      return;
    }

    try {
      const success = await resetAppLockPin(newPin);

      if (!success) {
        setRecoveryError(
          'Could not reset your PIN. Please try again.'
        );
        return;
      }

      setPin('');
      setNewPin('');
      setConfirmPin('');
      setAnswer('');
      setRecoveryError('');
      setMode('pin');

      Alert.alert(
        'PIN Reset',
        'Your PIN has been changed successfully.'
      );
    } catch (error) {
      console.error('Failed to reset PIN:', error);

      setRecoveryError(
        'Could not reset your PIN. Please try again.'
      );
    }
  };

  const goBackToPin = () => {
    setMode('pin');
    setAnswer('');
    setNewPin('');
    setConfirmPin('');
    setRecoveryError('');
    setError('');
  };

  if (mode === 'recovery') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.lockIcon}>
            <Text style={styles.lockIconText}>?</Text>
          </View>

          <Text style={styles.title}>Forgot PIN?</Text>

          <Text style={styles.subtitle}>
            Answer your security question to recover your account.
          </Text>

          <View style={styles.questionCard}>
            <Text style={styles.questionLabel}>
              Security Question
            </Text>

            <Text style={styles.question}>
              {question}
            </Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Your answer"
            placeholderTextColor={colors.textMuted}
            value={answer}
            onChangeText={(text) => {
              setAnswer(text);
              setRecoveryError('');
            }}
            autoFocus
            autoCapitalize="none"
          />

          {recoveryError ? (
            <Text style={styles.error}>
              {recoveryError}
            </Text>
          ) : null}

          <TouchableOpacity
            style={styles.btn}
            onPress={handleVerifyAnswer}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>
              Verify Answer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={goBackToPin}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryBtnText}>
              Back to PIN
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (mode === 'newPin') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.lockIcon}>
            <Text style={styles.lockIconText}>✓</Text>
          </View>

          <Text style={styles.title}>Create New PIN</Text>

          <Text style={styles.subtitle}>
            Your answer was verified. Set a new PIN.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="New PIN"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            value={newPin}
            onChangeText={(text) => {
              setNewPin(text.replace(/[^0-9]/g, ''));
              setRecoveryError('');
            }}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm new PIN"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            value={confirmPin}
            onChangeText={(text) => {
              setConfirmPin(text.replace(/[^0-9]/g, ''));
              setRecoveryError('');
            }}
          />

          {recoveryError ? (
            <Text style={styles.error}>
              {recoveryError}
            </Text>
          ) : null}

          <TouchableOpacity
            style={styles.btn}
            onPress={handleResetPin}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>
              Reset PIN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={goBackToPin}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryBtnText}>
              Cancel
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.lockIcon}>
          <Text style={styles.lockIconText}>🔒</Text>
        </View>

        <Text style={styles.title}>
          Baki is locked
        </Text>

        <Text style={styles.subtitle}>
          Enter your PIN to unlock
        </Text>

        <TextInput
          style={styles.input}
          placeholder="PIN"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          value={pin}
          onChangeText={(text) => {
            setPin(text.replace(/[^0-9]/g, ''));
            setError('');
          }}
          autoFocus
        />

        {error ? (
          <Text style={styles.error}>
            {error}
          </Text>
        ) : null}

        <TouchableOpacity
          style={styles.btn}
          onPress={handleUnlock}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>
            Unlock
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={handleForgotPin}
          activeOpacity={0.7}
        >
          <Text style={styles.forgotText}>
            Forgot PIN?
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: spacing.lg,
    },

    lockIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignSelf: 'center',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },

    lockIconText: {
      fontSize: 25,
      color: colors.primary,
    },

    title: {
      color: colors.text,
      fontSize: 23,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: spacing.sm,
    },

    subtitle: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 21,
      marginBottom: spacing.lg,
    },

    questionCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
    },

    questionLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 6,
      textTransform: 'uppercase',
    },

    question: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 21,
    },

    input: {
      backgroundColor: colors.card,
      color: colors.text,
      borderRadius: 12,
      padding: spacing.md,
      fontSize: 18,
      textAlign: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },

    error: {
      color: colors.danger,
      textAlign: 'center',
      fontSize: 13,
      marginBottom: spacing.sm,
    },

    btn: {
      backgroundColor: colors.primary,
      padding: spacing.md,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: spacing.sm,
    },

    btnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    },

    forgotBtn: {
      alignItems: 'center',
      marginTop: spacing.lg,
      padding: spacing.sm,
    },

    forgotText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },

    secondaryBtn: {
      alignItems: 'center',
      marginTop: spacing.md,
      padding: spacing.sm,
    },

    secondaryBtnText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
  });
}