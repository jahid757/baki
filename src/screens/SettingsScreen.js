import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Modal,
  TextInput,
  Pressable,
  Keyboard,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  getSettings,
  saveSettings,
  clearAllData,
  setAppLockPin,
  resetAppLockPin,
  disableAppLock,
} from '../storage';

import { useApp, spacing } from '../ThemeContext';
import DeleteDataPinModal from '../components/DeleteDataPinModal';

export default function SettingsScreen({ onAppLockChanged }) {
  const {
    colors,
    currency,
    setCurrency,
    themeName,
    toggleTheme,
  } = useApp();

  const styles = makeStyles(colors);

  // ==================================================
  // GENERAL
  // ==================================================

  const [warningLimit, setWarningLimit] = useState(1000);

  // ==================================================
  // APP LOCK
  // ==================================================

  const [lockEnabled, setLockEnabled] = useState(false);

  const [showPinModal, setShowPinModal] = useState(false);

  const [pinMode, setPinMode] = useState(null);
  /*
    enable  = create new PIN
    change  = change existing PIN
    disable = disable app lock
  */

  const [pinStep, setPinStep] = useState('pin');
  /*
    pin      = PIN verification / creation
    recovery = security question
    newPin   = create new PIN after verification
  */

  const [currentPinInput, setCurrentPinInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');

  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');

  const [showQuestionModal, setShowQuestionModal] = useState(false);

  const securityQuestions = [
    'What is your favorite shop?',
    'What was the name of your first school?',
    'What is your favorite food?',
    'What is your favorite color?',
    'What is your childhood nickname?',
  ];

  // ==================================================
  // NOTIFICATIONS
  // ==================================================

  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true);

  // ==================================================
  // DELETE DATA
  // ==================================================

  const [showDeletePinModal, setShowDeletePinModal] =
    useState(false);

  // ==================================================
  // LOAD SETTINGS
  // ==================================================

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getSettings();

      if (!settings) return;

      setWarningLimit(
        Number(settings.warningLimit ?? 1000)
      );

      setLockEnabled(
        Boolean(settings.appLock?.enabled)
      );

      setNotificationsEnabled(
        settings.notifications?.enabled !== false
      );
    } catch (error) {
      console.log('Settings load error:', error);
    }
  };

  // ==================================================
  // WARNING LIMIT
  // ==================================================

  const handleWarningLimit = async (value) => {
    const numericValue = Number(value);

    if (
      Number.isNaN(numericValue) ||
      numericValue < 0
    ) {
      return;
    }

    setWarningLimit(numericValue);

    try {
      await saveSettings({
        warningLimit: numericValue,
      });
    } catch (error) {
      console.log(
        'Warning limit save error:',
        error
      );
    }
  };

  // ==================================================
  // THEME
  // ==================================================

  const handleToggleTheme = async () => {
    try {
      await toggleTheme();
    } catch (error) {
      console.log(
        'Theme change error:',
        error
      );
    }
  };

  // ==================================================
  // CURRENCY
  // ==================================================

  const currencies = ['৳', '$', '€', '£', '₹'];

  const handleCurrencyChange = async (value) => {
    try {
      await setCurrency(value);
    } catch (error) {
      console.log(
        'Currency change error:',
        error
      );
    }
  };

  // ==================================================
  // APP LOCK HELPERS
  // ==================================================

  const resetPinModal = () => {
    Keyboard.dismiss();

    setShowPinModal(false);
    setPinMode(null);
    setPinStep('pin');

    setCurrentPinInput('');
    setPinInput('');
    setConfirmPinInput('');

    setSecurityQuestion('');
    setSecurityAnswer('');

    setShowQuestionModal(false);
  };

  const getStoredPin = async () => {
    try {
      const settings = await getSettings();

      if (settings?.appLock?.pin) {
        return String(settings.appLock.pin);
      }

      return null;
    } catch (error) {
      console.log(
        'Get stored PIN error:',
        error
      );

      return null;
    }
  };

  // ==================================================
  // OPEN APP LOCK MODALS
  // ==================================================

  const openEnablePinModal = () => {
    setPinMode('enable');
    setPinStep('pin');

    setCurrentPinInput('');
    setPinInput('');
    setConfirmPinInput('');

    setSecurityQuestion('');
    setSecurityAnswer('');

    setShowQuestionModal(false);
    setShowPinModal(true);
  };

  const openChangePinModal = () => {
    setPinMode('change');
    setPinStep('pin');

    setCurrentPinInput('');
    setPinInput('');
    setConfirmPinInput('');

    setSecurityQuestion('');
    setSecurityAnswer('');

    setShowQuestionModal(false);
    setShowPinModal(true);
  };

  const openDisablePinModal = () => {
    setPinMode('disable');
    setPinStep('pin');

    setCurrentPinInput('');
    setPinInput('');
    setConfirmPinInput('');

    setSecurityQuestion('');
    setSecurityAnswer('');

    setShowQuestionModal(false);
    setShowPinModal(true);
  };

  // ==================================================
  // TOGGLE APP LOCK
  // ==================================================

  const handleToggleLock = async (value) => {
    try {
      if (value) {
        openEnablePinModal();
        return;
      }

      const storedPin = await getStoredPin();

      if (!storedPin) {
        await disableAppLock();

        setLockEnabled(false);

        if (onAppLockChanged) {
          onAppLockChanged(false);
        }

        return;
      }

      openDisablePinModal();
    } catch (error) {
      console.log(
        'App lock error:',
        error
      );

      Alert.alert(
        'Error',
        'Something went wrong while changing the app lock.'
      );
    }
  };

  // ==================================================
  // VERIFY CURRENT PIN
  // ==================================================

  const verifyCurrentPin = async () => {
    const storedPin = await getStoredPin();

    if (!currentPinInput) {
      Alert.alert(
        'PIN Required',
        'Please enter your current PIN.'
      );

      return false;
    }

    if (!storedPin) {
      Alert.alert(
        'PIN Error',
        'The existing PIN could not be found.'
      );

      return false;
    }

    if (String(currentPinInput) !== storedPin) {
      Alert.alert(
        'Incorrect PIN',
        'The current PIN you entered is incorrect.'
      );

      return false;
    }

    return true;
  };

  // ==================================================
  // SAVE / CHANGE / DISABLE PIN
  // ==================================================

  const handleSavePin = async () => {
    try {
      // ==================================================
      // ENABLE APP LOCK
      // ==================================================

      if (pinMode === 'enable') {

        // STEP 1 — CREATE PIN
        if (pinStep === 'pin') {
          if (!/^\d{4,6}$/.test(pinInput)) {
            Alert.alert(
              'Invalid PIN',
              'Please enter a 4–6 digit PIN.'
            );

            return;
          }

          if (pinInput !== confirmPinInput) {
            Alert.alert(
              'PINs Do Not Match',
              'Please make sure both PINs are the same.'
            );

            return;
          }

          Keyboard.dismiss();

          setPinStep('recovery');

          return;
        }

        // STEP 2 — SECURITY QUESTION
        if (pinStep === 'recovery') {
          if (!securityQuestion) {
            Alert.alert(
              'Security Question Required',
              'Please select a security question.'
            );

            return;
          }

          if (!securityAnswer.trim()) {
            Alert.alert(
              'Security Answer Required',
              'Please enter an answer.'
            );

            return;
          }

          await setAppLockPin(
            pinInput,
            securityQuestion,
            securityAnswer
          );

          setLockEnabled(true);

          resetPinModal();

          if (onAppLockChanged) {
            onAppLockChanged(true);
          }

          Alert.alert(
            'App Lock Enabled',
            'Your PIN and recovery question have been saved successfully.'
          );

          return;
        }
      }

      // ==================================================
      // CHANGE PIN
      // ==================================================

      if (pinMode === 'change') {

        // STEP 1 — VERIFY CURRENT PIN
        if (pinStep === 'pin') {
          const verified = await verifyCurrentPin();

          if (!verified) return;

          Keyboard.dismiss();

          setCurrentPinInput('');
          setPinInput('');
          setConfirmPinInput('');

          setPinStep('newPin');

          return;
        }

        // STEP 2 — NEW PIN
        if (pinStep === 'newPin') {
          if (!/^\d{4,6}$/.test(pinInput)) {
            Alert.alert(
              'Invalid PIN',
              'Please enter a 4–6 digit PIN.'
            );

            return;
          }

          if (pinInput !== confirmPinInput) {
            Alert.alert(
              'PINs Do Not Match',
              'Please make sure both PINs are the same.'
            );

            return;
          }

          const storedPin = await getStoredPin();

          if (String(pinInput) === storedPin) {
            Alert.alert(
              'Same PIN',
              'Your new PIN must be different from your current PIN.'
            );

            return;
          }

          const success = await resetAppLockPin(
            pinInput
          );

          if (!success) {
            Alert.alert(
              'Error',
              'Could not change the PIN.'
            );

            return;
          }

          resetPinModal();

          Alert.alert(
            'PIN Changed',
            'Your app lock PIN has been changed successfully.'
          );

          return;
        }
      }

      // ==================================================
      // DISABLE APP LOCK
      // ==================================================

      if (pinMode === 'disable') {
        const verified = await verifyCurrentPin();

        if (!verified) return;

        await disableAppLock();

        setLockEnabled(false);

        resetPinModal();

        if (onAppLockChanged) {
          onAppLockChanged(false);
        }

        Alert.alert(
          'App Lock Disabled',
          'App lock has been disabled successfully.'
        );
      }

    } catch (error) {
      console.log(
        'Save PIN error:',
        error
      );

      Alert.alert(
        'Error',
        'Could not update the app lock.'
      );
    }
  };

  // ==================================================
  // DELETE ALL DATA
  // ==================================================

  const handleDeleteAllDataPress = async () => {
    try {
      const storedPin = await getStoredPin();

      if (storedPin) {
        setShowDeletePinModal(true);
        return;
      }

      confirmDeleteAllData();
    } catch (error) {
      console.log(
        'Delete PIN check error:',
        error
      );

      Alert.alert(
        'Error',
        'Could not verify the app PIN.'
      );
    }
  };

  const handleDeletePinVerify = async (enteredPin) => {
    try {
      const storedPin = await getStoredPin();

      if (!enteredPin) {
        Alert.alert(
          'PIN Required',
          'Please enter your PIN.'
        );

        return;
      }

      if (!storedPin) {
        setShowDeletePinModal(false);

        confirmDeleteAllData();

        return;
      }

      if (String(enteredPin) !== storedPin) {
        Alert.alert(
          'Incorrect PIN',
          'The PIN you entered is incorrect.'
        );

        return;
      }

      setShowDeletePinModal(false);

      confirmDeleteAllData();
    } catch (error) {
      console.log(
        'Delete PIN verification error:',
        error
      );

      Alert.alert(
        'Error',
        'Could not verify the PIN.'
      );
    }
  };

  const confirmDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all shops, dues, expenses, and other saved data. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: handleConfirmDeleteAllData,
        },
      ]
    );
  };

  const handleConfirmDeleteAllData = async () => {
    try {
      await clearAllData();

      Alert.alert(
        'Data Deleted',
        'All data has been deleted successfully.'
      );
    } catch (error) {
      console.log(
        'Clear data error:',
        error
      );

      Alert.alert(
        'Error',
        'Failed to delete all data. Please try again.'
      );
    }
  };

  // ==================================================
  // NOTIFICATIONS
  // ==================================================

  const handleNotifications = async (value) => {
    try {
      setNotificationsEnabled(value);

      await saveSettings({
        notifications: {
          enabled: value,
        },
      });
    } catch (error) {
      console.log(
        'Notification setting error:',
        error
      );
    }
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <>
      {/* ==================================================
          SETTINGS PAGE
      ================================================== */}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ==========================================
            GENERAL
        ========================================== */}

        <Text style={styles.sectionTitle}>
          General
        </Text>

        <View style={styles.card}>

          <View style={styles.settingRow}>

            <View style={styles.settingInfo}>

              <Text style={styles.settingTitle}>
                Warning Limit
              </Text>

              <Text style={styles.settingSubtitle}>
                Show a warning when total due reaches this amount.
              </Text>

            </View>

            <Text style={styles.valueText}>
              {currency}
              {Number(warningLimit).toFixed(0)}
            </Text>

          </View>

          <View style={styles.limitButtons}>

            {[500, 1000, 2000, 5000].map(
              (value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.limitButton,
                    warningLimit === value &&
                      styles.limitButtonActive,
                  ]}
                  onPress={() =>
                    handleWarningLimit(value)
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.limitButtonText,
                      warningLimit === value &&
                        styles.limitButtonTextActive,
                    ]}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              )
            )}

          </View>

        </View>

        {/* ==========================================
            APPEARANCE
        ========================================== */}

        <Text style={styles.sectionTitle}>
          Appearance
        </Text>

        <View style={styles.card}>

          <View style={styles.settingRow}>

            <View style={styles.settingInfo}>

              <Text style={styles.settingTitle}>
                Dark Mode
              </Text>

              <Text style={styles.settingSubtitle}>
                Use a darker appearance throughout the app.
              </Text>

            </View>

            <Switch
              value={themeName === 'dark'}
              onValueChange={handleToggleTheme}
              trackColor={{
                false: colors.border,
                true: colors.primary,
              }}
              thumbColor="#FFFFFF"
            />

          </View>

        </View>

        {/* ==========================================
            CURRENCY
        ========================================== */}

        <Text style={styles.sectionTitle}>
          Currency
        </Text>

        <View style={styles.card}>

          <Text style={styles.settingSubtitle}>
            Select the currency used throughout the app.
          </Text>

          <View style={styles.currencyContainer}>

            {currencies.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.currencyButton,
                  currency === item &&
                    styles.currencyButtonActive,
                ]}
                onPress={() =>
                  handleCurrencyChange(item)
                }
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.currencyText,
                    currency === item &&
                      styles.currencyTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}

          </View>

        </View>

        {/* ==========================================
            SECURITY
        ========================================== */}

        <Text style={styles.sectionTitle}>
          Security
        </Text>

        <View style={styles.card}>

          <View style={styles.settingRow}>

            <View style={styles.settingInfo}>

              <Text style={styles.settingTitle}>
                App Lock
              </Text>

              <Text style={styles.settingSubtitle}>
                Require a PIN when opening the app.
              </Text>

            </View>

            <Switch
              value={lockEnabled}
              onValueChange={handleToggleLock}
              trackColor={{
                false: colors.border,
                true: colors.primary,
              }}
              thumbColor="#FFFFFF"
            />

          </View>

          {lockEnabled && (
            <TouchableOpacity
              style={styles.actionRow}
              onPress={openChangePinModal}
              activeOpacity={0.7}
            >

              <View style={styles.actionLeft}>

                <Ionicons
                  name="key-outline"
                  size={20}
                  color={colors.primary}
                />

                <Text style={styles.actionText}>
                  Change PIN
                </Text>

              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textMuted}
              />

            </TouchableOpacity>
          )}

        </View>

        {/* ==========================================
            NOTIFICATIONS
        ========================================== */}

        <Text style={styles.sectionTitle}>
          Notifications
        </Text>

        <View style={styles.card}>

          <View style={styles.settingRow}>

            <View style={styles.settingInfo}>

              <Text style={styles.settingTitle}>
                Notifications
              </Text>

              <Text style={styles.settingSubtitle}>
                Enable app notifications and reminders.
              </Text>

            </View>

            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotifications}
              trackColor={{
                false: colors.border,
                true: colors.primary,
              }}
              thumbColor="#FFFFFF"
            />

          </View>

        </View>

        {/* ==========================================
            DATA MANAGEMENT
        ========================================== */}

        <Text style={styles.sectionTitle}>
          Data Management
        </Text>

        <View style={styles.card}>

          <TouchableOpacity
            style={styles.deleteRow}
            onPress={handleDeleteAllDataPress}
            activeOpacity={0.7}
          >

            <View style={styles.actionLeft}>

              <Ionicons
                name="trash-outline"
                size={21}
                color="#DC2626"
              />

              <View style={styles.deleteInfo}>

                <Text style={styles.deleteTitle}>
                  Delete All Data
                </Text>

                <Text style={styles.deleteSubtitle}>
                  Permanently delete all saved data.
                </Text>

              </View>

            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#DC2626"
            />

          </TouchableOpacity>

        </View>

        {/* ==========================================
            ABOUT
        ========================================== */}

        <Text style={styles.sectionTitle}>
          About
        </Text>

        <View style={styles.card}>

          <View style={styles.aboutRow}>

            <Text style={styles.aboutTitle}>
              Baki
            </Text>

            <Text style={styles.aboutVersion}>
              Version 1.5.0
            </Text>

          </View>

          <Text style={styles.aboutText}>
            A simple and reliable way to manage shops,
            dues, expenses, and payments.
          </Text>

        </View>

        <View style={styles.bottomSpace} />

      </ScrollView>

      {/* ==================================================
          SMALL APP LOCK MODAL
      ================================================== */}

      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={resetPinModal}
      >

        <View style={styles.smallModalOverlay}>

          <View style={styles.smallPinModal}>

            {/* ==========================================
                HEADER
            ========================================== */}

            <View style={styles.smallModalHeader}>

              <View style={styles.smallModalTitleArea}>

                <View style={styles.smallLockIcon}>

                  <Ionicons
                    name={
                      pinStep === 'recovery'
                        ? 'shield-checkmark'
                        : 'lock-closed'
                    }
                    size={20}
                    color={colors.primary}
                  />

                </View>

                <View style={{ flex: 1 }}>

                  <Text style={styles.smallModalTitle}>
                    {pinMode === 'enable'
                      ? pinStep === 'recovery'
                        ? 'Recovery Setup'
                        : 'Enable App Lock'
                      : pinMode === 'change'
                      ? pinStep === 'newPin'
                        ? 'New PIN'
                        : 'Verify PIN'
                      : 'Disable App Lock'}
                  </Text>

                  <Text style={styles.smallModalSubtitle}>
                    {pinMode === 'enable'
                      ? pinStep === 'recovery'
                        ? 'Set a recovery question'
                        : 'Create your security PIN'
                      : pinMode === 'change'
                      ? pinStep === 'newPin'
                        ? 'Create your new PIN'
                        : 'Verify your current PIN'
                      : 'Verify your PIN to continue'}
                  </Text>

                </View>

                <Pressable
                  onPress={resetPinModal}
                  style={styles.smallCloseButton}
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color={colors.textMuted}
                  />
                </Pressable>

              </View>

            </View>

            {/* ==========================================
                CONTENT
            ========================================== */}

            <View style={styles.smallModalContent}>

              {/* ========================================
                  ENABLE — CREATE PIN
              ======================================== */}

              {pinMode === 'enable' &&
                pinStep === 'pin' && (
                  <>

                    <View style={styles.smallInputGroup}>

                      <Text style={styles.smallInputLabel}>
                        Create PIN
                      </Text>

                      <TextInput
                        style={styles.smallPinInput}
                        value={pinInput}
                        onChangeText={setPinInput}
                        placeholder="4–6 digit PIN"
                        placeholderTextColor={
                          colors.textMuted
                        }
                        keyboardType="number-pad"
                        secureTextEntry
                        maxLength={6}
                        autoFocus
                        returnKeyType="next"
                      />

                    </View>

                    <View style={styles.smallInputGroup}>

                      <Text style={styles.smallInputLabel}>
                        Confirm PIN
                      </Text>

                      <TextInput
                        style={styles.smallPinInput}
                        value={confirmPinInput}
                        onChangeText={
                          setConfirmPinInput
                        }
                        placeholder="Re-enter PIN"
                        placeholderTextColor={
                          colors.textMuted
                        }
                        keyboardType="number-pad"
                        secureTextEntry
                        maxLength={6}
                        returnKeyType="done"
                      />

                    </View>

                    <Text style={styles.smallHint}>
                      Your PIN must contain 4–6 digits.
                    </Text>

                  </>
                )}

              {/* ========================================
                  ENABLE — RECOVERY
              ======================================== */}

              {pinMode === 'enable' &&
                pinStep === 'recovery' && (
                  <>

                    <View style={styles.smallInputGroup}>

                      <Text style={styles.smallInputLabel}>
                        Security Question
                      </Text>

                      <Pressable
                        style={
                          styles.smallQuestionSelector
                        }
                        onPress={() => {
                          Keyboard.dismiss();
                          setShowQuestionModal(true);
                        }}
                      >

                        <Text
                          style={[
                            styles.smallQuestionText,
                            !securityQuestion &&
                              styles.smallQuestionPlaceholder,
                          ]}
                          numberOfLines={2}
                        >
                          {securityQuestion ||
                            'Select a security question'}
                        </Text>

                        <Ionicons
                          name="chevron-down"
                          size={19}
                          color={colors.textMuted}
                        />

                      </Pressable>

                    </View>

                    <View style={styles.smallInputGroup}>

                      <Text style={styles.smallInputLabel}>
                        Answer
                      </Text>

                      <TextInput
                        style={styles.smallPinInput}
                        value={securityAnswer}
                        onChangeText={
                          setSecurityAnswer
                        }
                        placeholder="Enter your answer"
                        placeholderTextColor={
                          colors.textMuted
                        }
                        autoCapitalize="none"
                        returnKeyType="done"
                      />

                    </View>

                  </>
                )}

              {/* ========================================
                  CHANGE — CURRENT PIN
              ======================================== */}

              {pinMode === 'change' &&
                pinStep === 'pin' && (
                  <>

                    <View style={styles.smallInputGroup}>

                      <Text style={styles.smallInputLabel}>
                        Current PIN
                      </Text>

                      <TextInput
                        style={styles.smallPinInput}
                        value={currentPinInput}
                        onChangeText={
                          setCurrentPinInput
                        }
                        placeholder="Enter current PIN"
                        placeholderTextColor={
                          colors.textMuted
                        }
                        keyboardType="number-pad"
                        secureTextEntry
                        maxLength={6}
                        autoFocus
                        returnKeyType="done"
                      />

                    </View>

                    <Text style={styles.smallHint}>
                      Verify your current PIN before
                      creating a new one.
                    </Text>

                  </>
                )}

              {/* ========================================
                  CHANGE — NEW PIN
              ======================================== */}

              {pinMode === 'change' &&
                pinStep === 'newPin' && (
                  <>

                    <View style={styles.smallInputGroup}>

                      <Text style={styles.smallInputLabel}>
                        New PIN
                      </Text>

                      <TextInput
                        style={styles.smallPinInput}
                        value={pinInput}
                        onChangeText={setPinInput}
                        placeholder="4–6 digit PIN"
                        placeholderTextColor={
                          colors.textMuted
                        }
                        keyboardType="number-pad"
                        secureTextEntry
                        maxLength={6}
                        autoFocus
                        returnKeyType="next"
                      />

                    </View>

                    <View style={styles.smallInputGroup}>

                      <Text style={styles.smallInputLabel}>
                        Confirm New PIN
                      </Text>

                      <TextInput
                        style={styles.smallPinInput}
                        value={confirmPinInput}
                        onChangeText={
                          setConfirmPinInput
                        }
                        placeholder="Re-enter new PIN"
                        placeholderTextColor={
                          colors.textMuted
                        }
                        keyboardType="number-pad"
                        secureTextEntry
                        maxLength={6}
                        returnKeyType="done"
                      />

                    </View>

                  </>
                )}

              {/* ========================================
                  DISABLE — CURRENT PIN
              ======================================== */}

              {pinMode === 'disable' && (
                <View style={styles.smallInputGroup}>

                  <Text style={styles.smallInputLabel}>
                    Current PIN
                  </Text>

                  <TextInput
                    style={styles.smallPinInput}
                    value={currentPinInput}
                    onChangeText={
                      setCurrentPinInput
                    }
                    placeholder="Enter current PIN"
                    placeholderTextColor={
                      colors.textMuted
                    }
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={6}
                    autoFocus
                    returnKeyType="done"
                  />

                </View>
              )}

            </View>

            {/* ==========================================
                BUTTONS
            ========================================== */}

            <View style={styles.smallModalButtons}>

              <Pressable
                style={styles.smallCancelButton}
                onPress={() => {

                  if (
                    pinMode === 'enable' &&
                    pinStep === 'recovery'
                  ) {
                    Keyboard.dismiss();

                    setSecurityQuestion('');
                    setSecurityAnswer('');

                    setPinStep('pin');

                    return;
                  }

                  if (
                    pinMode === 'change' &&
                    pinStep === 'newPin'
                  ) {
                    Keyboard.dismiss();

                    setPinInput('');
                    setConfirmPinInput('');

                    setPinStep('pin');

                    return;
                  }

                  resetPinModal();

                }}
              >

                <Text style={styles.smallCancelText}>
                  {(
                    (pinMode === 'enable' &&
                      pinStep === 'recovery') ||
                    (pinMode === 'change' &&
                      pinStep === 'newPin')
                  )
                    ? 'Back'
                    : 'Cancel'}
                </Text>

              </Pressable>

              <Pressable
                style={styles.smallPrimaryButton}
                onPress={handleSavePin}
              >

                <Text style={styles.smallPrimaryText}>
                  {pinMode === 'enable'
                    ? pinStep === 'pin'
                      ? 'Continue'
                      : 'Save'
                    : pinMode === 'change'
                    ? pinStep === 'pin'
                      ? 'Verify'
                      : 'Save'
                    : 'Disable'}
                </Text>

              </Pressable>

            </View>

          </View>

        </View>

      </Modal>

      {/* ==================================================
          SECURITY QUESTION MODAL
      ================================================== */}

      <Modal
        visible={showQuestionModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setShowQuestionModal(false)
        }
      >

        <View style={styles.questionOverlay}>

          <View style={styles.questionModal}>

            <View style={styles.questionModalHeader}>

              <View style={{ flex: 1 }}>

                <Text style={styles.questionModalTitle}>
                  Security Question
                </Text>

                <Text
                  style={styles.questionModalSubtitle}
                >
                  Choose a question you will remember.
                </Text>

              </View>

              <TouchableOpacity
                onPress={() =>
                  setShowQuestionModal(false)
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.textMuted}
                />
              </TouchableOpacity>

            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              overScrollMode="never"
            >

              <View style={styles.questionList}>

                {securityQuestions.map(
                  (question) => (
                    <TouchableOpacity
                      key={question}
                      style={[
                        styles.questionOption,
                        securityQuestion ===
                          question &&
                          styles.questionOptionActive,
                      ]}
                      onPress={() => {
                        setSecurityQuestion(
                          question
                        );

                        setShowQuestionModal(
                          false
                        );
                      }}
                      activeOpacity={0.7}
                    >

                      <Text
                        style={[
                          styles.questionOptionText,
                          securityQuestion ===
                            question &&
                            styles.questionOptionTextActive,
                        ]}
                      >
                        {question}
                      </Text>

                      {securityQuestion ===
                        question && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color="#FFFFFF"
                        />
                      )}

                    </TouchableOpacity>
                  )
                )}

              </View>

            </ScrollView>

          </View>

        </View>

      </Modal>

      {/* ==================================================
          DELETE DATA PIN MODAL
      ================================================== */}

      <DeleteDataPinModal
        visible={showDeletePinModal}
        onClose={() =>
          setShowDeletePinModal(false)
        }
        onVerify={handleDeletePinVerify}
      />

    </>
  );
}

// ======================================================
// STYLES
// ======================================================

const makeStyles = (colors) =>
  StyleSheet.create({

    // ==================================================
    // MAIN SCREEN
    // ==================================================

    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      padding: spacing.md,
    },

    sectionTitle: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.7,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      marginLeft: 4,
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },

    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    settingInfo: {
      flex: 1,
      paddingRight: spacing.md,
    },

    settingTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },

    settingSubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 4,
    },

    valueText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '700',
    },

    // ==================================================
    // WARNING LIMIT
    // ==================================================

    limitButtons: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },

    limitButton: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 9,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },

    limitButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    limitButtonText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600',
    },

    limitButtonTextActive: {
      color: '#FFFFFF',
    },

    // ==================================================
    // CURRENCY
    // ==================================================

    currencyContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },

    currencyButton: {
      width: 48,
      height: 42,
      borderRadius: 9,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    currencyButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    currencyText: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
    },

    currencyTextActive: {
      color: '#FFFFFF',
    },

    // ==================================================
    // ACTION ROW
    // ==================================================

    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: spacing.md,
      paddingTop: spacing.md,
    },

    actionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    actionText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
    },

    // ==================================================
    // DELETE
    // ==================================================

    deleteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    deleteInfo: {
      marginLeft: spacing.sm,
    },

    deleteTitle: {
      color: '#DC2626',
      fontSize: 15,
      fontWeight: '700',
    },

    deleteSubtitle: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 3,
    },

    // ==================================================
    // ABOUT
    // ==================================================

    aboutRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    aboutTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
    },

    aboutVersion: {
      color: colors.textMuted,
      fontSize: 12,
    },

    aboutText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
      marginTop: spacing.sm,
    },

    bottomSpace: {
      height: 40,
    },

    // ==================================================
    // SMALL APP LOCK MODAL
    // ==================================================

    smallModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.62)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },

    smallPinModal: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: colors.card,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },

    smallModalHeader: {
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    smallModalTitleArea: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    smallLockIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + '18',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 11,
    },

    smallModalTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
    },

    smallModalSubtitle: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 3,
    },

    smallCloseButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 5,
    },

    smallModalContent: {
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 5,
    },

    smallInputGroup: {
      marginBottom: 14,
    },

    smallInputLabel: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 7,
    },

    smallPinInput: {
      height: 48,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 11,
      backgroundColor: colors.background,
      color: colors.text,
      paddingHorizontal: 14,
      fontSize: 16,
    },

    smallQuestionSelector: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 11,
      backgroundColor: colors.background,
      paddingHorizontal: 14,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    smallQuestionText: {
      flex: 1,
      color: colors.text,
      fontSize: 13,
      lineHeight: 18,
      paddingRight: 10,
    },

    smallQuestionPlaceholder: {
      color: colors.textMuted,
    },

    smallHint: {
      color: colors.textMuted,
      fontSize: 11,
      lineHeight: 16,
      marginTop: -3,
      marginBottom: 10,
    },

    smallModalButtons: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 18,
    },

    smallCancelButton: {
      flex: 1,
      height: 46,
      borderRadius: 11,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    smallCancelText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },

    smallPrimaryButton: {
      flex: 1,
      height: 46,
      borderRadius: 11,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },

    smallPrimaryText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },

    // ==================================================
    // QUESTION MODAL
    // ==================================================

    questionOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.60)',
      padding: spacing.lg,
    },

    questionModal: {
      width: '100%',
      maxWidth: 430,
      maxHeight: '80%',
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: spacing.lg,
    },

    questionModalHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },

    questionModalTitle: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '700',
    },

    questionModalSubtitle: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 3,
      paddingRight: 10,
    },

    questionList: {
      gap: 8,
    },

    questionOption: {
      minHeight: 50,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 11,
      paddingVertical: 10,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    questionOptionActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    questionOptionText: {
      flex: 1,
      color: colors.text,
      fontSize: 13,
      lineHeight: 18,
      paddingRight: 8,
    },

    questionOptionTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
  }); // 