import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  getTransactions,
  getShops,
  deleteTransaction,
} from '../storage';

import { useApp, spacing } from '../ThemeContext';

function formatTime(ts) {
  const d = new Date(ts);

  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDayLabel(ts) {
  const date = new Date(ts);
  const today = new Date();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (
    date.toDateString() === today.toDateString()
  ) {
    return 'Today';
  }

  if (
    date.toDateString() === yesterday.toDateString()
  ) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year:
      date.getFullYear() !== today.getFullYear()
        ? 'numeric'
        : undefined,
  });
}

export default function HistoryScreen() {
  const { colors, currency } = useApp();
  const styles = makeStyles(colors);

  const [transactions, setTransactions] = useState([]);
  const [shopNames, setShopNames] = useState({});
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [txs, shops] = await Promise.all([
        getTransactions(),
        getShops(),
      ]);

      const nameMap = {};

      shops.forEach((shop) => {
        nameMap[shop.id] = shop.name;
      });

      const sortedTransactions = [...txs].sort(
        (a, b) => b.timestamp - a.timestamp
      );

      setShopNames(nameMap);
      setTransactions(sortedTransactions);
    } catch (error) {
      console.log('History load error:', error);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  // -----------------------------------------
  // Statistics
  // -----------------------------------------

  const now = new Date();

  const monthPurchases = transactions
    .filter((t) => t.type === 'purchase')
    .filter((t) => {
      const d = new Date(t.timestamp);

      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    })
    .reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0
    );

  const monthPayments = transactions
    .filter((t) => t.type !== 'purchase')
    .filter((t) => {
      const d = new Date(t.timestamp);

      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    })
    .reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0
    );

  const q = query.trim().toLowerCase();

  const filtered = transactions.filter((t) => {
    if (!q) return true;

    const shopName = (
      shopNames[t.shopId] || ''
    ).toLowerCase();

    const product = (
      t.productName || ''
    ).toLowerCase();

    const note = (
      t.note || ''
    ).toLowerCase();

    return (
      shopName.includes(q) ||
      product.includes(q) ||
      note.includes(q)
    );
  });

  // -----------------------------------------
  // Delete
  // -----------------------------------------

  const handleDelete = (tx) => {
    Alert.alert(
      'Delete Entry?',
      'This transaction will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(tx.id);
              await load();
            } catch (error) {
              Alert.alert(
                'Error',
                'Could not delete this transaction.'
              );
            }
          },
        },
      ]
    );
  };

  // -----------------------------------------
  // Transaction Item
  // -----------------------------------------

  const renderTransaction = ({ item, index }) => {
    const isPurchase = item.type === 'purchase';

    const amount = Number(item.amount || 0);

    const shopName =
      shopNames[item.shopId] || 'Unknown shop';

    const title = isPurchase
      ? item.productName || 'Purchase'
      : 'Payment';

    return (
      <TouchableOpacity
        style={styles.transactionCard}
        activeOpacity={0.75}
        onLongPress={() => handleDelete(item)}
      >
        {/* Icon */}
        <View
          style={[
            styles.transactionIcon,
            isPurchase
              ? styles.purchaseIcon
              : styles.paymentIcon,
          ]}
        >
          <Ionicons
            name={
              isPurchase
                ? 'cart-outline'
                : 'cash-outline'
            }
            size={21}
            color={
              isPurchase
                ? colors.danger
                : colors.success
            }
          />
        </View>

        {/* Main Content */}
        <View style={styles.transactionContent}>
          <Text
            style={styles.transactionTitle}
            numberOfLines={1}
          >
            {title}
          </Text>

          <View style={styles.shopRow}>
            <Ionicons
              name="storefront-outline"
              size={13}
              color={colors.textMuted}
            />

            <Text
              style={styles.shopName}
              numberOfLines={1}
            >
              {shopName}
            </Text>
          </View>

          {item.note ? (
            <Text
              style={styles.note}
              numberOfLines={1}
            >
              {item.note}
            </Text>
          ) : null}

          <View style={styles.timeRow}>
            <Ionicons
              name="time-outline"
              size={12}
              color={colors.textMuted}
            />

            <Text style={styles.time}>
              {getDayLabel(item.timestamp)} ·{' '}
              {formatTime(item.timestamp)
                .split(', ')
                .slice(-1)[0]}
            </Text>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.amountContainer}>
          <Text
            style={[
              styles.amount,
              isPurchase
                ? styles.purchaseAmount
                : styles.paymentAmount,
            ]}
          >
            {isPurchase ? '+' : '-'}
            {currency}
            {amount.toFixed(2)}
          </Text>

          <Text style={styles.typeLabel}>
            {isPurchase ? 'Purchase' : 'Payment'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* -------------------------------- */}
      {/* Header */}
      {/* -------------------------------- */}

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>
              Activity
            </Text>

            <Text style={styles.subtitle}>
              Your recent transactions
            </Text>
          </View>

          <View style={styles.historyIcon}>
            <Ionicons
              name="time-outline"
              size={22}
              color={colors.primary}
            />
          </View>
        </View>

        {/* Summary Card */}

        <View style={styles.summaryCard}>
          <View style={styles.summaryMain}>
            <Text style={styles.summaryLabel}>
              Spent this month
            </Text>

            <Text style={styles.summaryAmount}>
              {currency}
              {monthPurchases.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryStats}>
            <View style={styles.miniStat}>
              <View
                style={[
                  styles.miniIcon,
                  styles.purchaseMiniIcon,
                ]}
              >
                <Ionicons
                  name="arrow-up"
                  size={13}
                  color={colors.danger}
                />
              </View>

              <View>
                <Text style={styles.miniLabel}>
                  Purchases
                </Text>

                <Text style={styles.miniAmount}>
                  {currency}
                  {monthPurchases.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.miniStat}>
              <View
                style={[
                  styles.miniIcon,
                  styles.paymentMiniIcon,
                ]}
              >
                <Ionicons
                  name="arrow-down"
                  size={13}
                  color={colors.success}
                />
              </View>

              <View>
                <Text style={styles.miniLabel}>
                  Payments
                </Text>

                <Text style={styles.miniAmount}>
                  {currency}
                  {monthPayments.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Search */}

        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textMuted}
          />

          <TextInput
            style={styles.search}
            placeholder="Search shop, item, or note..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />

          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={10}
            >
              <Ionicons
                name="close-circle"
                size={19}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* -------------------------------- */}
      {/* Transaction List */}
      {/* -------------------------------- */}

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderTransaction}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 &&
            styles.emptyListContent,
        ]}
        ListHeaderComponent={
          filtered.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                Recent Activity
              </Text>

              <Text style={styles.countText}>
                {filtered.length}{' '}
                {filtered.length === 1
                  ? 'entry'
                  : 'entries'}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={
                  q
                    ? 'search-outline'
                    : 'receipt-outline'
                }
                size={34}
                color={colors.textMuted}
              />
            </View>

            <Text style={styles.emptyTitle}>
              {q
                ? 'No results found'
                : 'No activity yet'}
            </Text>

            <Text style={styles.emptyText}>
              {q
                ? 'Try searching with a different shop, item, or note.'
                : 'Your purchases and payments will appear here.'}
            </Text>

            {q && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setQuery('')}
              >
                <Text
                  style={styles.clearSearchText}
                >
                  Clear Search
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        colors.background || colors.bg,
    },

    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },

    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },

    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.5,
    },

    subtitle: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 3,
    },

    historyIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ---------------------------------------
    // Summary
    // ---------------------------------------

    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,

      elevation: 2,
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 3,
      },
    },

    summaryMain: {
      paddingBottom: spacing.md,
    },

    summaryLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
    },

    summaryAmount: {
      color: colors.text,
      fontSize: 27,
      fontWeight: '800',
      marginTop: 3,
    },

    summaryDivider: {
      height: 1,
      backgroundColor: colors.border,
    },

    summaryStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: spacing.md,
    },

    miniStat: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },

    miniIcon: {
      width: 30,
      height: 30,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },

    purchaseMiniIcon: {
      backgroundColor: 'rgba(220,38,38,0.10)',
    },

    paymentMiniIcon: {
      backgroundColor: 'rgba(22,163,74,0.10)',
    },

    miniLabel: {
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: '500',
    },

    miniAmount: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
      marginTop: 1,
    },

    // ---------------------------------------
    // Search
    // ---------------------------------------

    searchContainer: {
      height: 50,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
    },

    search: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      marginLeft: spacing.sm,
      paddingVertical: 0,
    },

    // ---------------------------------------
    // List
    // ---------------------------------------

    listContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: 110,
    },

    emptyListContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },

    listHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },

    listTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },

    countText: {
      color: colors.textMuted,
      fontSize: 12,
    },

    // ---------------------------------------
    // Transaction Card
    // ---------------------------------------

    transactionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 15,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,

      elevation: 1,
      shadowOpacity: 0.03,
      shadowRadius: 5,
      shadowOffset: {
        width: 0,
        height: 2,
      },
    },

    transactionIcon: {
      width: 44,
      height: 44,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },

    purchaseIcon: {
      backgroundColor: 'rgba(220,38,38,0.10)',
    },

    paymentIcon: {
      backgroundColor: 'rgba(22,163,74,0.10)',
    },

    transactionContent: {
      flex: 1,
      minWidth: 0,
      paddingRight: spacing.sm,
    },

    transactionTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },

    shopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },

    shopName: {
      color: colors.textMuted,
      fontSize: 12,
      marginLeft: 4,
      flexShrink: 1,
    },

    note: {
      color: colors.textMuted,
      fontSize: 11,
      fontStyle: 'italic',
      marginTop: 3,
    },

    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },

    time: {
      color: colors.textMuted,
      fontSize: 10,
      marginLeft: 3,
    },

    // ---------------------------------------
    // Amount
    // ---------------------------------------

    amountContainer: {
      alignItems: 'flex-end',
      minWidth: 75,
    },

    amount: {
      fontSize: 14,
      fontWeight: '800',
    },

    purchaseAmount: {
      color: colors.danger,
    },

    paymentAmount: {
      color: colors.success,
    },

    typeLabel: {
      color: colors.textMuted,
      fontSize: 9,
      marginTop: 4,
    },

    // ---------------------------------------
    // Empty State
    // ---------------------------------------

    emptyState: {
      alignItems: 'center',
      paddingHorizontal: spacing.xl || 30,
    },

    emptyIcon: {
      width: 70,
      height: 70,
      borderRadius: 22,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },

    emptyTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
      textAlign: 'center',
    },

    emptyText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'center',
      marginTop: 6,
      maxWidth: 290,
    },

    clearSearchButton: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.primary,
    },

    clearSearchText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
  });