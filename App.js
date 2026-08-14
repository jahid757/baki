import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import ShopsScreen from './src/screens/ShopsScreen';
import ShopDetailScreen from './src/screens/ShopDetailScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import BottomNav from './src/components/BottomNav';
import { colors } from './src/theme';
import { setupNotifications } from './src/notifications';

export default function App() {
  const [tab, setTab] = useState('shops'); // 'shops' | 'history'
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    setupNotifications();
  }, []);

  const bump = () => setRefreshToken((n) => n + 1);

  const openShop = (shopId) => setSelectedShopId(shopId);
  const closeShop = () => {
    setSelectedShopId(null);
    bump();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      {selectedShopId ? (
        <ShopDetailScreen shopId={selectedShopId} onBack={closeShop} />
      ) : tab === 'shops' ? (
        <ShopsScreen key={`shops-${refreshToken}`} onOpenShop={openShop} />
      ) : (
        <HistoryScreen key={`history-${refreshToken}`} />
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