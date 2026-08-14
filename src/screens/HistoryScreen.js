import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet } from 'react-native';
import { getTransactions, getShops } from '../storage';
import { colors, spacing, CURRENCY } from '../theme';

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState([]);
  const [shopNames, setShopNames] = useState({});
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      const [txs, shops] = await Promise.all([getTransactions(), getShops()]);
      const nameMap = {};
      shops.forEach((s) => {
        nameMap[s.id] = s.name;
      });
      setShopNames(nameMap);
      setTransactions(txs.sort((a, b) => b.timestamp - a.timestamp));
    })();
  }, []);

  const now = new Date();
  const monthTotal = transactions
    .filter((t) => t.type === 'purchase')
    .filter((t) => {
      const d = new Date(t.timestamp);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const q = query.trim().toLowerCase();
  const filtered = transactions.filter((t) => {
    if (!q) return true;
    const shopName = (shopNames[t.shopId] || '').toLowerCase();
    const product = (t.productName || '').toLowerCase();
    const note = (t.note || '').toLowerCase();
    return shopName.includes(q) || product.includes(q) || note.includes(q);
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All activity</Text>
        <Text style={styles.subLabel}>Spent this month</Text>
        <Text style={styles.subAmount}>{CURRENCY}{monthTotal.toFixed(2)}</Text>
        <TextInput
          style={styles.search}
          placeholder="Search shop, item, or note..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={styles.empty}>{q ? 'No matches.' : 'No activity yet.'}</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: spacing.sm }}>
              <Text style={styles.label}>
                {item.type === 'purchase' ? item.productName || 'Purchase' : 'Payment'} ·{' '}
                {shopNames[item.shopId] || 'Unknown shop'}
              </Text>
              {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
              <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
            </View>
            <Text style={item.type === 'purchase' ? styles.plus : styles.minus}>
              {item.type === 'purchase' ? '+' : '-'}{CURRENCY}{item.amount.toFixed(2)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.lg },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  subLabel: { color: colors.textMuted, marginTop: spacing.md, fontSize: 13 },
  subAmount: { color: colors.text, fontSize: 24, fontWeight: '800' },
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
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { color: colors.text, fontWeight: '600' },
  note: { color: colors.textMuted, fontSize: 12, marginTop: 1, fontStyle: 'italic' },
  time: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  plus: { color: colors.danger, fontWeight: '700' },
  minus: { color: colors.success, fontWeight: '700' },
});