import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  getShops,
  getProductsByShop,
  getTransactionsByShop,
  computeDue,
  addTransaction,
  deleteTransaction,
  deleteProduct,
  updateShopLimit,
  getSettings,
} from '../storage';

import { useApp, spacing } from '../ThemeContext';
import {
  resolveWarningLimit,
  checkThresholdCrossed,
} from '../dueAlerts';

import { sendDueAlert } from '../notifications';

import AddProductModal from '../components/AddProductModal';
import PaymentModal from '../components/PaymentModal';
import SetLimitModal from '../components/SetLimitModal';
import CustomEntryModal from '../components/CustomEntryModal';
import UndoSnackbar from '../components/UndoSnackbar';

function formatTime(ts) {
  const d = new Date(ts);

  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ShopDetailScreen({
  shopId,
  onBack,
}) {
  const { colors, currency } = useApp();
  const styles = makeStyles(colors);

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({
    defaultWarningLimit: null,
  });

  const [refreshing, setRefreshing] = useState(false);

  const [addProductVisible, setAddProductVisible] =
    useState(false);

  const [paymentVisible, setPaymentVisible] =
    useState(false);

  const [limitModalVisible, setLimitModalVisible] =
    useState(false);

  const [customEntryVisible, setCustomEntryVisible] =
    useState(false);

  const [undoTx, setUndoTx] = useState(null);
  const [snackbarVisible, setSnackbarVisible] =
    useState(false);

  // -----------------------------------------
  // Load
  // -----------------------------------------

  const load = useCallback(async () => {
    try {
      const [shops, prods, txs, s] =
        await Promise.all([
          getShops(),
          getProductsByShop(shopId),
          getTransactionsByShop(shopId),
          getSettings(),
        ]);

      const currentShop =
        shops.find((sh) => sh.id === shopId) || null;

      setShop(currentShop);
      setProducts(prods || []);

      const sortedTransactions = [
        ...(txs || []),
      ].sort(
        (a, b) =>
          Number(b.timestamp || 0) -
          Number(a.timestamp || 0)
      );

      setTransactions(sortedTransactions);
      setSettings(
        s || {
          defaultWarningLimit: null,
        }
      );
    } catch (error) {
      console.log(
        'Shop detail load error:',
        error
      );
    }
  }, [shopId]);

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

  if (!shop) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Loading...
        </Text>
      </View>
    );
  }

  // -----------------------------------------
  // Due
  // -----------------------------------------

  const due = Math.max(
    Number(computeDue(transactions) || 0),
    0
  );

  const currentLimit = resolveWarningLimit(
    shop,
    settings
  );

  // -----------------------------------------
  // Notifications
  // -----------------------------------------

  const notifyIfCrossed = async (
    prevDue,
    newDue
  ) => {
    try {
      const limit = resolveWarningLimit(
        shop,
        settings
      );

      const crossed = checkThresholdCrossed(
        prevDue,
        newDue,
        limit
      );

      if (crossed) {
        await sendDueAlert(
          shop.name,
          newDue,
          crossed,
          currency
        );
      }
    } catch (error) {
      console.log(
        'Due notification error:',
        error
      );
    }
  };

  // -----------------------------------------
  // Quick Add
  // -----------------------------------------

  const showUndo = (tx) => {
    setUndoTx(tx);
    setSnackbarVisible(true);
  };

  const handleQuickAdd = async (product) => {
    try {
      const prevDue = due;
      const amount = Number(product.price || 0);

      const newTx = await addTransaction({
        shopId,
        type: 'purchase',
        amount,
        productName: product.name,
      });

      await load();

      await notifyIfCrossed(
        prevDue,
        prevDue + amount
      );

      showUndo(newTx);
    } catch (error) {
      console.log(
        'Quick add error:',
        error
      );

      Alert.alert(
        'Error',
        'Could not add this item.'
      );
    }
  };

  // -----------------------------------------
  // Custom Entry
  // -----------------------------------------

  const handleCustomEntry = async ({
    type,
    amount,
    note,
  }) => {
    try {
      const prevDue = due;
      const numericAmount = Number(amount || 0);

      const newTx = await addTransaction({
        shopId,
        type,
        amount: numericAmount,
        note,
      });

      setCustomEntryVisible(false);

      await load();

      if (type === 'purchase') {
        await notifyIfCrossed(
          prevDue,
          prevDue + numericAmount
        );
      }

      showUndo(newTx);
    } catch (error) {
      console.log(
        'Custom entry error:',
        error
      );

      Alert.alert(
        'Error',
        'Could not save this entry.'
      );
    }
  };

  // -----------------------------------------
  // Undo
  // -----------------------------------------

  const handleUndo = async () => {
    if (!undoTx) return;

    try {
      await deleteTransaction(undoTx.id);

      setSnackbarVisible(false);
      setUndoTx(null);

      await load();
    } catch (error) {
      Alert.alert(
        'Error',
        'Could not undo this entry.'
      );
    }
  };

  const handleHideSnackbar = () => {
    setSnackbarVisible(false);
    setUndoTx(null);
  };

  // -----------------------------------------
  // Limit
  // -----------------------------------------

  const handleSaveLimit = async (limit) => {
    try {
      await updateShopLimit(shopId, limit);

      setLimitModalVisible(false);

      await load();
    } catch (error) {
      Alert.alert(
        'Error',
        'Could not update the warning limit.'
      );
    }
  };

  // -----------------------------------------
  // Delete Product
  // -----------------------------------------

  const handleDeleteProduct = (product) => {
    Alert.alert(
      'Remove Product?',
      `Remove "${product.name}" from the quick-add list?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              await load();
            } catch (error) {
              Alert.alert(
                'Error',
                'Could not remove this product.'
              );
            }
          },
        },
      ]
    );
  };

  // -----------------------------------------
  // Delete Transaction
  // -----------------------------------------

  const handleDeleteTransaction = (tx) => {
    if (tx.type === 'payment') {
      Alert.alert(
        'Payment Cannot Be Deleted',
        'To maintain accounting integrity, payment entries cannot be deleted.'
      );

      return;
    }

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
                'Could not delete this entry.'
              );
            }
          },
        },
      ]
    );
  };

  // -----------------------------------------
  // Undo message
  // -----------------------------------------

  const undoMessage = undoTx
    ? `${
        undoTx.type === 'purchase'
          ? undoTx.productName || 'Item added'
          : 'Payment'
      } · ${currency}${Number(
        undoTx.amount || 0
      ).toFixed(2)}`
    : '';

  // -----------------------------------------
  // Transaction Item
  // -----------------------------------------

  const renderTransaction = ({ item }) => {
    const isPurchase =
      item.type === 'purchase';

    const amount = Number(
      item.amount || 0
    );

    return (
      <TouchableOpacity
        style={styles.transactionCard}
        activeOpacity={0.75}
        onLongPress={() =>
          handleDeleteTransaction(item)
        }
      >
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
            size={20}
            color={
              isPurchase
                ? colors.danger
                : colors.success
            }
          />
        </View>

        <View style={styles.transactionInfo}>
          <Text
            style={styles.transactionTitle}
            numberOfLines={1}
          >
            {isPurchase
              ? item.productName ||
                'Purchase'
              : 'Payment'}
          </Text>

          {item.note ? (
            <Text
              style={styles.transactionNote}
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

            <Text style={styles.transactionTime}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
        </View>

        <View style={styles.amountBox}>
          <Text
            style={[
              styles.transactionAmount,
              isPurchase
                ? styles.purchaseAmount
                : styles.paymentAmount,
            ]}
          >
            {isPurchase ? '+' : '-'}
            {currency}
            {amount.toFixed(2)}
          </Text>

          <Text style={styles.transactionType}>
            {isPurchase
              ? 'Purchase'
              : 'Payment'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // -----------------------------------------
  // Render
  // -----------------------------------------

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) =>
          String(item.id)
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={
          styles.listContent
        }
        ListHeaderComponent={
          <>
            {/* Header */}

            <View style={styles.topHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="arrow-back"
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>

              <View style={styles.shopHeaderInfo}>
                <View style={styles.shopIcon}>
                  <Ionicons
                    name="storefront-outline"
                    size={21}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.shopHeaderText}>
                  <Text
                    style={styles.shopName}
                    numberOfLines={1}
                  >
                    {shop.name}
                  </Text>

                  <Text
                    style={styles.shopSubtitle}
                  >
                    Shop account
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.moreButton}
                onPress={() =>
                  setLimitModalVisible(true)
                }
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Balance Card */}

            <View style={styles.balanceCard}>
              <View
                style={styles.balanceHeader}
              >
                <View>
                  <Text
                    style={styles.balanceLabel}
                  >
                    CURRENT DUE
                  </Text>

                  <Text
                    style={[
                      styles.balanceStatus,
                      due > 0
                        ? styles.statusOwed
                        : styles.statusClear,
                    ]}
                  >
                    {due > 0
                      ? 'Outstanding balance'
                      : 'Account settled'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusIcon,
                    due > 0
                      ? styles.statusIconOwed
                      : styles.statusIconClear,
                  ]}
                >
                  <Ionicons
                    name={
                      due > 0
                        ? 'alert-circle-outline'
                        : 'checkmark-circle-outline'
                    }
                    size={22}
                    color={
                      due > 0
                        ? colors.danger
                        : colors.success
                    }
                  />
                </View>
              </View>

              <Text
                style={[
                  styles.dueAmount,
                  due > 0
                    ? styles.owed
                    : styles.clear,
                ]}
              >
                {currency}
                {due.toFixed(2)}
              </Text>

              {currentLimit ? (
                <TouchableOpacity
                  style={styles.limitBadge}
                  onPress={() =>
                    setLimitModalVisible(true)
                  }
                >
                  <Ionicons
                    name="notifications-outline"
                    size={14}
                    color={colors.primary}
                  />

                  <Text
                    style={styles.limitText}
                  >
                    Warning at {currency}
                    {Number(
                      currentLimit
                    ).toFixed(2)}
                  </Text>

                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.setLimitBadge}
                  onPress={() =>
                    setLimitModalVisible(true)
                  }
                >
                  <Ionicons
                    name="notifications-off-outline"
                    size={14}
                    color={colors.textMuted}
                  />

                  <Text
                    style={
                      styles.setLimitText
                    }
                  >
                    Set a due warning limit
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Main Actions */}

            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={() =>
                  setPaymentVisible(true)
                }
                activeOpacity={0.8}
              >
                <View
                  style={styles.actionIcon}
                >
                  <Ionicons
                    name="cash-outline"
                    size={21}
                    color="#FFFFFF"
                  />
                </View>

                <View
                  style={styles.actionTextBox}
                >
                  <Text
                    style={styles.primaryActionTitle}
                  >
                    Make Payment
                  </Text>

                  <Text
                    style={
                      styles.primaryActionSubtitle
                    }
                  >
                    Record a payment
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={() =>
                  setCustomEntryVisible(true)
                }
                activeOpacity={0.8}
              >
                <View
                  style={styles.secondaryIcon}
                >
                  <Ionicons
                    name="create-outline"
                    size={21}
                    color={colors.primary}
                  />
                </View>

                <View
                  style={styles.actionTextBox}
                >
                  <Text
                    style={
                      styles.secondaryActionTitle
                    }
                  >
                    Custom Entry
                  </Text>

                  <Text
                    style={
                      styles.secondaryActionSubtitle
                    }
                  >
                    Add a custom transaction
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Quick Add */}

            <View style={styles.sectionHeader}>
              <View>
                <Text
                  style={styles.sectionTitle}
                >
                  Quick Add
                </Text>

                <Text
                  style={styles.sectionSubtitle}
                >
                  Tap an item to add it instantly
                </Text>
              </View>

              {products.length > 0 && (
                <Text
                  style={styles.itemCount}
                >
                  {products.length} items
                </Text>
              )}
            </View>

            <View style={styles.productGrid}>
              {products.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() =>
                    handleQuickAdd(product)
                  }
                  onLongPress={() =>
                    handleDeleteProduct(
                      product
                    )
                  }
                  activeOpacity={0.75}
                >
                  <View
                    style={
                      styles.productIcon
                    }
                  >
                    <Ionicons
                      name="cube-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>

                  <Text
                    style={
                      styles.productName
                    }
                    numberOfLines={2}
                  >
                    {product.name}
                  </Text>

                  <Text
                    style={
                      styles.productPrice
                    }
                  >
                    {currency}
                    {Number(
                      product.price || 0
                    ).toFixed(2)}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Add Product */}

              <TouchableOpacity
                style={styles.addProductCard}
                onPress={() =>
                  setAddProductVisible(true)
                }
                activeOpacity={0.75}
              >
                <View
                  style={
                    styles.addProductIcon
                  }
                >
                  <Ionicons
                    name="add"
                    size={23}
                    color={colors.primary}
                  />
                </View>

                <Text
                  style={
                    styles.addProductText
                  }
                >
                  Add Item
                </Text>

                <Text
                  style={
                    styles.addProductSubtext
                  }
                >
                  Quick add
                </Text>
              </TouchableOpacity>
            </View>

            {/* History Header */}

            <View
              style={[
                styles.sectionHeader,
                styles.historyHeader,
              ]}
            >
              <View>
                <Text
                  style={styles.sectionTitle}
                >
                  Transaction History
                </Text>

                <Text
                  style={styles.sectionSubtitle}
                >
                  Recent activity for this shop
                </Text>
              </View>

              {transactions.length > 0 && (
                <View
                  style={styles.historyCount}
                >
                  <Text
                    style={styles.historyCountText}
                  >
                    {transactions.length}
                  </Text>
                </View>
              )}
            </View>

            {transactions.length > 0 && (
              <View style={styles.hintBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={14}
                  color={colors.textMuted}
                />

                <Text style={styles.hint}>
                  Long-press a purchase to delete it.
                  Payments cannot be deleted.
                </Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="receipt-outline"
                size={31}
                color={colors.textMuted}
              />
            </View>

            <Text
              style={styles.emptyTitle}
            >
              No Transactions Yet
            </Text>

            <Text
              style={styles.emptyText}
            >
              Add a product, record a payment,
              or create a custom entry to get
              started.
            </Text>
          </View>
        }
        renderItem={renderTransaction}
      />

      {/* -------------------------------- */}
      {/* Modals */}
      {/* -------------------------------- */}

      <AddProductModal
        visible={addProductVisible}
        shopId={shopId}
        onClose={() =>
          setAddProductVisible(false)
        }
        onAdded={() => {
          setAddProductVisible(false);
          load();
        }}
      />

      <PaymentModal
        visible={paymentVisible}
        shopId={shopId}
        currentDue={due}
        onClose={() =>
          setPaymentVisible(false)
        }
        onPaid={(tx) => {
          setPaymentVisible(false);
          load();
          showUndo(tx);
        }}
      />

      <SetLimitModal
        visible={limitModalVisible}
        currentLimit={currentLimit}
        onClose={() =>
          setLimitModalVisible(false)
        }
        onSave={handleSaveLimit}
      />

      <CustomEntryModal
        visible={customEntryVisible}
        onClose={() =>
          setCustomEntryVisible(false)
        }
        onSave={handleCustomEntry}
      />

      <UndoSnackbar
        visible={snackbarVisible}
        message={undoMessage}
        onUndo={handleUndo}
        onHide={handleHideSnackbar}
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

    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        colors.background || colors.bg,
    },

    loadingText: {
      color: colors.textMuted,
      fontSize: 14,
    },

    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 120,
    },

    // ---------------------------------------
    // Header
    // ---------------------------------------

    topHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },

    shopHeaderInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },

    shopIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    shopHeaderText: {
      flex: 1,
      marginLeft: spacing.sm,
    },

    shopName: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },

    shopSubtitle: {
      color: colors.textMuted,
      fontSize: 11,
      marginTop: 2,
    },

    moreButton: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: spacing.sm,
    },

    // ---------------------------------------
    // Balance
    // ---------------------------------------

    balanceCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,

      elevation: 2,
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 4,
      },
    },

    balanceHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },

    balanceLabel: {
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
    },

    balanceStatus: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 3,
    },

    statusOwed: {
      color: colors.danger,
    },

    statusClear: {
      color: colors.success,
    },

    statusIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },

    statusIconOwed: {
      backgroundColor:
        'rgba(220,38,38,0.10)',
    },

    statusIconClear: {
      backgroundColor:
        'rgba(22,163,74,0.10)',
    },

    dueAmount: {
      fontSize: 36,
      fontWeight: '900',
      letterSpacing: -1,
      // marginTop: spacing.sm,
    },

    owed: {
      color: colors.danger,
    },

    clear: {
      color: colors.success,
    },

    limitBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        'rgba(59,130,246,0.08)',
      borderRadius: 9,
      paddingHorizontal: 9,
      paddingVertical: 6,
      marginTop: spacing.md,
      gap: 5,
    },

    limitText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '600',
    },

    setLimitBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 9,
      paddingHorizontal: 9,
      paddingVertical: 6,
      marginTop: spacing.md,
      gap: 5,
    },

    setLimitText: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '600',
    },

    // ---------------------------------------
    // Actions
    // ---------------------------------------

    actionsSection: {
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },

    primaryAction: {
      minHeight: 68,
      borderRadius: 15,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
    },

    secondaryAction: {
      minHeight: 68,
      borderRadius: 15,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
    },

    actionIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor:
        'rgba(255,255,255,0.16)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    secondaryIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor:
        'rgba(59,130,246,0.09)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    actionTextBox: {
      flex: 1,
      marginLeft: spacing.sm,
    },

    primaryActionTitle: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },

    primaryActionSubtitle: {
      color: 'rgba(255,255,255,0.72)',
      fontSize: 11,
      marginTop: 2,
    },

    secondaryActionTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },

    secondaryActionSubtitle: {
      color: colors.textMuted,
      fontSize: 11,
      marginTop: 2,
    },

    // ---------------------------------------
    // Sections
    // ---------------------------------------

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },

    historyHeader: {
      marginTop: spacing.xl || 24,
    },

    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },

    sectionSubtitle: {
      color: colors.textMuted,
      fontSize: 11,
      marginTop: 3,
    },

    itemCount: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '600',
    },

    // ---------------------------------------
    // Products
    // ---------------------------------------

    productGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },

    productCard: {
      width: '31.5%',
      minHeight: 115,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    productIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor:
        'rgba(59,130,246,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 7,
    },

    productName: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '700',
      textAlign: 'center',
      lineHeight: 16,
    },

    productPrice: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
      marginTop: 4,
    },

    addProductCard: {
      width: '31.8%',
      minHeight: 115,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
    },

    addProductIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor:
        'rgba(59,130,246,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 7,
    },

    addProductText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
    },

    addProductSubtext: {
      color: colors.textMuted,
      fontSize: 10,
      marginTop: 3,
    },

    // ---------------------------------------
    // History
    // ---------------------------------------

    historyCount: {
      minWidth: 28,
      height: 28,
      borderRadius: 9,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    historyCountText: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
    },

    hintBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 9,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: spacing.sm,
      gap: 6,
    },

    hint: {
      flex: 1,
      color: colors.textMuted,
      fontSize: 10,
      lineHeight: 14,
    },

    transactionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },

    transactionIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },

    purchaseIcon: {
      backgroundColor:
        'rgba(220,38,38,0.10)',
    },

    paymentIcon: {
      backgroundColor:
        'rgba(22,163,74,0.10)',
    },

    transactionInfo: {
      flex: 1,
      minWidth: 0,
      paddingRight: spacing.sm,
    },

    transactionTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },

    transactionNote: {
      color: colors.textMuted,
      fontSize: 11,
      fontStyle: 'italic',
      marginTop: 3,
    },

    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 5,
    },

    transactionTime: {
      color: colors.textMuted,
      fontSize: 10,
      marginLeft: 4,
    },

    amountBox: {
      alignItems: 'flex-end',
      minWidth: 78,
    },

    transactionAmount: {
      fontSize: 13,
      fontWeight: '800',
    },

    purchaseAmount: {
      color: colors.danger,
    },

    paymentAmount: {
      color: colors.success,
    },

    transactionType: {
      color: colors.textMuted,
      fontSize: 9,
      marginTop: 4,
    },

    // ---------------------------------------
    // Empty
    // ---------------------------------------

    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: spacing.xl || 30,
    },

    emptyIcon: {
      width: 68,
      height: 68,
      borderRadius: 21,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },

    emptyTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },

    emptyText: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
      marginTop: 6,
      maxWidth: 290,
    },
  });