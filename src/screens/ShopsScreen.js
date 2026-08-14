import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { getShops, getDuesByShop, deleteShop, getSettings,getExpenseStats } from '../storage';
import { resolveWarningLimit, getDueLevel } from '../dueAlerts';
import { colors, spacing, CURRENCY } from '../theme';
import AddShopModal from '../components/AddShopModal';
import DueBreakdownModal from '../components/DueBreakdownModal';
import DueCircle from '../components/DueCircle';
import ExpenseStats from '../components/ExpenseStats';

const EMPTY_STATS = { today: 0, yesterday: 0, last7Days: 0, last30Days: 0,  thisWeek: 0, thisMonth: 0 };

export default function ShopsScreen({ onOpenShop }) {
  const [shops, setShops] = useState([]);
  const [dues, setDues] = useState({});
  const [stats, setStats] = useState(EMPTY_STATS);
  const [settings, setSettings] = useState({ defaultWarningLimit: null });
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [breakdownVisible, setBreakdownVisible] = useState(false);
  const [query, setQuery] = useState('');

  const load = async () => {
    const [shopList, dueMap, s,expenseStats] = await Promise.all([getShops(), getDuesByShop(), getSettings(),getExpenseStats()]);
    setShops(shopList.sort((a, b) => b.createdAt - a.createdAt));
    setDues(dueMap);
    setSettings(s);
    setStats(expenseStats);
    setLoading(false);
  };



  useEffect(() => {
    load();
  }, []);

  const totalDue = Object.values(dues).reduce((s, v) => s + Math.max(v, 0), 0);

  const filteredShops = shops.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()));

  const handleAdded = async () => {
    setModalVisible(false);
    await load();
  };

  const handleLongPress = (shop) => {
    Alert.alert('Delete shop?', `This removes "${shop.name}" and all its history.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteShop(shop.id);
          await load();
        },
      },
    ]);
  };

  const dueStyleFor = (shop, due) => {
    if (due <= 0) return styles.dueClear;
    const limit = resolveWarningLimit(shop, settings);
    const level = getDueLevel(due, limit);
    if (level === 'danger') return styles.dueDanger;
    if (level === 'warning') return styles.dueWarning;
    return styles.dueOwed;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Due Bills</Text>
       
         <View style={styles.statsRow}>
              <DueCircle amount={totalDue} onPress={() => setBreakdownVisible(true)} />
              <ExpenseStats thisWeek={stats.thisWeek} thisMonth={stats.thisMonth} />
          </View> 
          
        <TextInput
          style={styles.search}
          placeholder="Search shops..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        data={filteredShops}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>
              {query ? 'No shops match your search.' : 'No shops yet. Tap + to add your first shop.'}
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const due = dues[item.id] || 0;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => onOpenShop(item.id)}
              onLongPress={() => handleLongPress(item)}
            >
              <Text style={styles.shopName}>{item.name}</Text>
              <Text style={[styles.due, dueStyleFor(item, due)]}>
                {due > 0 ? `${CURRENCY}${due.toFixed(2)} Due` : 'Settled ✓'}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AddShopModal visible={modalVisible} onClose={() => setModalVisible(false)} onAdded={handleAdded} />
      <DueBreakdownModal visible={breakdownVisible} breakdown={stats} onClose={() => setBreakdownVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.lg, paddingBottom: spacing.md },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  totalLabel: { color: colors.textMuted, fontSize: 13 },
  totalAmount: { color: colors.danger, fontSize: 32, fontWeight: '800', marginTop: 2 },
  search: {
    marginTop: spacing.md,
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 10,
    padding: spacing.md,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  due: { fontSize: 15, fontWeight: '700' },
  dueOwed: { color: colors.danger },
  dueWarning: { color: colors.warning },
  dueDanger: { color: colors.danger },
  dueClear: { color: colors.success },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#fff', fontSize: 30, marginTop: -2 },
});