import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import {
  getShops,
  getProductsByShop,
  getTransactionsByShop,
  computeDue,
  addTransaction,
  deleteProduct,
  updateShopLimit,
  getSettings,
} from '../storage';
import { colors, spacing, CURRENCY } from '../theme';
import { resolveWarningLimit, checkThresholdCrossed } from '../dueAlerts';
import { sendDueAlert } from '../notifications';
import AddProductModal from '../components/AddProductModal';
import PaymentModal from '../components/PaymentModal';
import SetLimitModal from '../components/SetLimitModal';
import CustomEntryModal from '../components/CustomEntryModal';

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ShopDetailScreen({ shopId, onBack }) {
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({ defaultWarningLimit: null });
  const [addProductVisible, setAddProductVisible] = useState(false);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [customEntryVisible, setCustomEntryVisible] = useState(false);

  const load = useCallback(async () => {
    const [shops, prods, txs, s] = await Promise.all([
      getShops(),
      getProductsByShop(shopId),
      getTransactionsByShop(shopId),
      getSettings(),
    ]);
    setShop(shops.find((sh) => sh.id === shopId) || null);
    setProducts(prods);
    setTransactions(txs);
    setSettings(s);
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  const due = computeDue(transactions);

  const notifyIfCrossed = async (prevDue, newDue) => {
    const limit = resolveWarningLimit(shop, settings);
    const crossed = checkThresholdCrossed(prevDue, newDue, limit);
    if (crossed) await sendDueAlert(shop.name, newDue, crossed, CURRENCY);
  };

  const handleQuickAdd = async (product) => {
    const prevDue = due;
    await addTransaction({ shopId, type: 'purchase', amount: product.price, productName: product.name });
    await load();
    await notifyIfCrossed(prevDue, prevDue + product.price);
  };

  const handleCustomEntry = async ({ type, amount, note }) => {
    const prevDue = due;
    await addTransaction({ shopId, type, amount, note });
    setCustomEntryVisible(false);
    await load();
    if (type === 'purchase') {
      await notifyIfCrossed(prevDue, prevDue + amount);
    }
  };

  const handleSaveLimit = async (limit) => {
    await updateShopLimit(shopId, limit);
    setLimitModalVisible(false);
    await load();
  };

  const handleDeleteProduct = (product) => {
    Alert.alert('Remove product?', `Remove "${product.name}" from the quick-add list.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteProduct(product.id);
          load();
        },
      },
    ]);
  };

  if (!shop) return null;

  const currentLimit = resolveWarningLimit(shop, settings);

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <TouchableOpacity onPress={onBack}>
                <Text style={styles.back}>‹ Back</Text>
              </TouchableOpacity>
              <Text style={styles.shopName}>{shop.name}</Text>
              <Text style={styles.dueLabel}>Current due</Text>
              <Text style={[styles.dueAmount, due > 0 ? styles.owed : styles.clear]}>
                {CURRENCY}{Math.max(due, 0).toFixed(2)}
              </Text>

              <TouchableOpacity onPress={() => setLimitModalVisible(true)}>
                <Text style={styles.limitLink}>
                  {currentLimit
                    ? `Warning limit: ${CURRENCY}${currentLimit.toFixed(2)} · Change`
                    : 'Set a due warning limit'}
                </Text>
              </TouchableOpacity>

              <View style={styles.actionsRow}>
                <TouchableOpacity style={[styles.payBtn, { flex: 1 }]} onPress={() => setPaymentVisible(true)}>
                  <Text style={styles.payBtnText}>Make a payment</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.payBtn, styles.customBtn, { flex: 1 }]}
                  onPress={() => setCustomEntryVisible(true)}
                >
                  <Text style={styles.customBtnText}>Custom entry</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Quick add</Text>
            <View style={styles.grid}>
              {products.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.productBtn}
                  onPress={() => handleQuickAdd(p)}
                  onLongPress={() => handleDeleteProduct(p)}
                >
                  <Text style={styles.productName}>{p.name}</Text>
                  <Text style={styles.productPrice}>{CURRENCY}{p.price.toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.addProductBtn} onPress={() => setAddProductVisible(true)}>
                <Text style={styles.addProductText}>+ Add item</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>History</Text>
          </>
        }
        ListEmptyComponent={<Text style={styles.empty}>No activity yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.txRow}>
            <View style={{ flex: 1, paddingRight: spacing.sm }}>
              <Text style={styles.txLabel}>
                {item.type === 'purchase' ? item.productName || 'Purchase' : 'Payment'}
              </Text>
              {item.note ? <Text style={styles.txNote}>{item.note}</Text> : null}
              <Text style={styles.txTime}>{formatTime(item.timestamp)}</Text>
            </View>
            <Text style={item.type === 'purchase' ? styles.txPlus : styles.txMinus}>
              {item.type === 'purchase' ? '+' : '-'}{CURRENCY}{item.amount.toFixed(2)}
            </Text>
          </View>
        )}
      />

      <AddProductModal
        visible={addProductVisible}
        shopId={shopId}
        onClose={() => setAddProductVisible(false)}
        onAdded={() => {
          setAddProductVisible(false);
          load();
        }}
      />
      <PaymentModal
        visible={paymentVisible}
        shopId={shopId}
        currentDue={Math.max(due, 0)}
        onClose={() => setPaymentVisible(false)}
        onPaid={() => {
          setPaymentVisible(false);
          load();
        }}
      />
      <SetLimitModal
        visible={limitModalVisible}
        currentLimit={currentLimit}
        onClose={() => setLimitModalVisible(false)}
        onSave={handleSaveLimit}
      />
      <CustomEntryModal
        visible={customEntryVisible}
        onClose={() => setCustomEntryVisible(false)}
        onSave={handleCustomEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingVertical: spacing.lg },
  back: { color: colors.primary, fontSize: 16, marginBottom: spacing.sm },
  shopName: { color: colors.text, fontSize: 20, fontWeight: '700' },
  dueLabel: { color: colors.textMuted, marginTop: spacing.sm, fontSize: 13 },
  dueAmount: { fontSize: 34, fontWeight: '800', marginTop: 2 },
  owed: { color: colors.danger },
  clear: { color: colors.success },
  limitLink: { color: colors.primary, fontSize: 13, marginTop: spacing.sm },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  payBtn: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: 10, alignItems: 'center' },
  payBtnText: { color: '#fff', fontWeight: '700' },
  customBtn: { backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border },
  customBtnText: { color: colors.text, fontWeight: '700' },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  productBtn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minWidth: 90,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  productName: { color: colors.text, fontWeight: '600' },
  productPrice: { color: colors.primary, marginTop: 2, fontSize: 13 },
  addProductBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  addProductText: { color: colors.textMuted, fontWeight: '600' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 20 },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txLabel: { color: colors.text, fontWeight: '600' },
  txNote: { color: colors.textMuted, fontSize: 12, marginTop: 1, fontStyle: 'italic' },
  txTime: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  txPlus: { color: colors.danger, fontWeight: '700' },
  txMinus: { color: colors.success, fontWeight: '700' },
});