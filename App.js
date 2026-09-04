import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView, StatusBar, BackHandler, ToastAndroid, Platform, AppState } from 'react-native';
import ShopsScreen from './src/screens/ShopsScreen';
import ShopDetailScreen from './src/screens/ShopDetailScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AppLockScreen from './src/screens/AppLockScreen';
import BottomNav from './src/components/BottomNav';
import { setupNotifications } from './src/notifications';
import { getSettings } from './src/storage';
import { ThemeProvider, useApp } from './src/ThemeContext';

function AppInner() {
  const { colors, themeName, ready } = useApp();
  const [tab, setTab] = useState('shops'); // 'shops' | 'history' | 'settings'
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const [lockEnabled, setLockEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const appState = useRef(AppState.currentState);

  const backPressRef = useRef(false);
  const backTimerRef = useRef(null);

  useEffect(() => {
    setupNotifications();
  }, []);

  // Check app-lock setting once ready, and lock on cold start if enabled
  useEffect(() => {
    if (!ready) return;
    (async () => {
      const s = await getSettings();
      const enabled = !!(s.appLock && s.appLock.enabled);
      setLockEnabled(enabled);
      setLocked(enabled);
    })();
  }, [ready]);

  // Re-lock when the app comes back from background (if lock is enabled)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        if (lockEnabled) setLocked(true);
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [lockEnabled]);

  const bump = () => setRefreshToken((n) => n + 1);

  const openShop = (shopId) => setSelectedShopId(shopId);
  const closeShop = () => {
    setSelectedShopId(null);
    bump();
  };

  useEffect(() => {
    const onBackPress = () => {
      if (selectedShopId) {
        closeShop();
        return true;
      }
      if (tab !== 'shops') {
        setTab('shops');
        bump();
        return true;
      }
      if (backPressRef.current) {
        BackHandler.exitApp();
        return true;
      }
      backPressRef.current = true;
      if (Platform.OS === 'android') {
        ToastAndroid.show('আবার ব্যাক চাপুন অ্যাপ থেকে বের হতে', ToastAndroid.SHORT);
      }
      if (backTimerRef.current) clearTimeout(backTimerRef.current);
      backTimerRef.current = setTimeout(() => {
        backPressRef.current = false;
      }, 2000);
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      subscription.remove();
      if (backTimerRef.current) clearTimeout(backTimerRef.current);
    };
  }, [tab, selectedShopId]);

  if (!ready) return null;

  if (locked) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
        <AppLockScreen onUnlock={() => setLocked(false)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      {selectedShopId ? (
        <ShopDetailScreen shopId={selectedShopId} onBack={closeShop} />
      ) : tab === 'shops' ? (
        <ShopsScreen key={`shops-${refreshToken}`} onOpenShop={openShop} />
      ) : tab === 'history' ? (
        <HistoryScreen key={`history-${refreshToken}`} />
      ) : (
        <SettingsScreen
          key={`settings-${refreshToken}`}
          onAppLockChanged={(enabled) => setLockEnabled(enabled)}
        />
      )}
      {!selectedShopId && (
        <BottomNav
          tab={tab}
          onChange={(t) => {
            setTab(t);
            bump();
          }}
        />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}