import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';

import {
  getShops,
  getDuesByShop,
  deleteShop,
  getSettings,
  getExpenseStats,
  toggleShopPin,
} from '../storage';

import {
  resolveWarningLimit,
  getDueLevel,
} from '../dueAlerts';

import { useApp, spacing } from '../ThemeContext';

import AddShopModal from '../components/AddShopModal';
import DueBreakdownModal from '../components/DueBreakdownModal';
import DueCircle from '../components/DueCircle';
import ExpenseStats from '../components/ExpenseStats';

const EMPTY_STATS = {
  today: 0,
  yesterday: 0,
  last7Days: 0,
  last30Days: 0,
  thisWeek: 0,
  thisMonth: 0,
};

export default function ShopsScreen({ onOpenShop }) {
  const { colors, currency } = useApp();
  const styles = makeStyles(colors);

  const [shops, setShops] = useState([]);
  const [dues, setDues] = useState({});
  const [stats, setStats] = useState(EMPTY_STATS);

  const [settings, setSettings] = useState({
    defaultWarningLimit: null,
  });

  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [breakdownVisible, setBreakdownVisible] = useState(false);
  const [query, setQuery] = useState('');

  // ==================================================
  // SORT SHOPS
  // ==================================================

  const sortShops = (list) => {
    return [...list].sort((a, b) => {
      // Pinned shops first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // Newest pinned first
      if (a.pinned && b.pinned) {
        return (
          Number(b.pinnedAt || 0) -
          Number(a.pinnedAt || 0)
        );
      }

      // Normal shops
      const aTime =
        a.lastUsedAt ||
        a.createdAt ||
        0;

      const bTime =
        b.lastUsedAt ||
        b.createdAt ||
        0;

      return bTime - aTime;
    });
  };

  // ==================================================
  // LOAD
  // ==================================================

  const load = async () => {
    try {
      const [
        shopList,
        dueMap,
        s,
        expenseStats,
      ] = await Promise.all([
        getShops(),
        getDuesByShop(),
        getSettings(),
        getExpenseStats(),
      ]);

      setShops(
        sortShops(shopList || [])
      );

      setDues(dueMap || {});

      setSettings(
        s || {
          defaultWarningLimit: null,
        }
      );

      setStats(
        expenseStats || EMPTY_STATS
      );
    } catch (error) {
      console.error(
        'Failed to load shops:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ==================================================
  // TOTAL DUE
  // ==================================================

  const totalDue = Object.values(dues).reduce(
    (sum, value) =>
      sum + Math.max(Number(value) || 0, 0),
    0
  );

  // ==================================================
  // SEARCH
  // ==================================================

  const searchText = query.trim().toLowerCase();

  const filteredShops = shops.filter((shop) =>
    String(shop.name || '')
      .toLowerCase()
      .includes(searchText)
  );

  // ==================================================
  // SHOP ADDED
  // ==================================================

  const handleAdded = async () => {
    setModalVisible(false);
    await load();
  };

  // ==================================================
  // DELETE SHOP
  // ==================================================

  const handleLongPress = (shop) => {
    Alert.alert(
      'Delete Shop?',
      `This removes "${shop.name}" and all its history.`,
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
              await deleteShop(shop.id);
              await load();
            } catch (error) {
              console.error(
                'Failed to delete shop:',
                error
              );

              Alert.alert(
                'Error',
                'Could not delete this shop. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  // ==================================================
  // TOGGLE PIN
  // ==================================================

  const handleTogglePin = async (shop) => {
    try {
      const result =
        await toggleShopPin(shop.id);

      // Maximum 3 pinned shops
      if (
        !result.success &&
        result.reason === 'limit'
      ) {
        Alert.alert(
          'Pin Limit Reached',
          'You can pin up to 3 shops. Unpin another shop first to pin this one.'
        );

        return;
      }

      await load();
    } catch (error) {
      console.error(
        'Failed to toggle shop pin:',
        error
      );

      Alert.alert(
        'Error',
        'Could not update shop pin. Please try again.'
      );
    }
  };

  // ==================================================
  // DUE STYLE
  // ==================================================

  const getDueMeta = (shop, due) => {
    if (due <= 0) {
      return {
        color: colors.success,
        label: 'Settled',
      };
    }

    const limit = resolveWarningLimit(
      shop,
      settings
    );

    const level = getDueLevel(
      due,
      limit
    );

    if (level === 'danger') {
      return {
        color: colors.danger,
        label: 'High due',
      };
    }

    if (level === 'warning') {
      return {
        color: colors.warning,
        label: 'Warning',
      };
    }

    return {
      color: colors.danger,
      label: 'Outstanding',
    };
  };

  // ==================================================
  // SHOP CARD
  // ==================================================

  const renderShop = ({ item }) => {
    const due = Math.max(
      Number(dues[item.id] || 0),
      0
    );

    const dueMeta = getDueMeta(
      item,
      due
    );

    return (
      <TouchableOpacity
        style={[
          styles.card,
          item.pinned && styles.cardPinned,
        ]}
        onPress={() =>
          onOpenShop(item.id)
        }
        onLongPress={() =>
          handleLongPress(item)
        }
        activeOpacity={0.75}
      >
        {/* Main row */}
        <View style={styles.cardRow}>

          {/* Shop icon */}
          <View
            style={[
              styles.shopIcon,
              item.pinned &&
                styles.shopIconPinned,
            ]}
          >
            <Ionicons
              name="storefront-outline"
              size={19}
              color={colors.primary}
            />
          </View>

          {/* Shop information */}
          <View style={styles.shopInfo}>
            <Text
              style={styles.shopName}
              numberOfLines={1}
            >
              {item.name}
            </Text>

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      dueMeta.color,
                  },
                ]}
              />

              <Text
                style={[
                  styles.statusText,
                  {
                    color: dueMeta.color,
                  },
                ]}
              >
                {dueMeta.label}
              </Text>
            </View>
          </View>

          {/* Due */}
          <View style={styles.dueContainer}>
            <Text style={styles.dueLabel}>
              DUE
            </Text>

            <Text
              style={[
                styles.dueAmount,
                {
                  color: dueMeta.color,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {due > 0
                ? `${currency}${due.toFixed(2)}`
                : '—'}
            </Text>
          </View>

          {/* Pin */}
          <TouchableOpacity
            style={[
              styles.pinButton,
              item.pinned &&
                styles.pinButtonActive,
            ]}
            onPress={() =>
              handleTogglePin(item)
            }
            hitSlop={{
              top: 10,
              bottom: 10,
              left: 10,
              right: 10,
            }}
            activeOpacity={0.7}
          >
            <AntDesign
              name="pushpin"
              size={18}
              color={
                item.pinned
                  ? colors.primary
                  : colors.textMuted
              }
              style={{
    transform: [
      {
        rotate: item.pinned ? '90deg' : '0deg',
      },
    ],
  }}
            />
          </TouchableOpacity>
        </View>

        {/* Small bottom line */}
        <View
          style={[
            styles.cardFooter,
            item.pinned &&
              styles.cardFooterPinned,
          ]}
        >
          <Text style={styles.footerText}>
            {due > 0
              ? `${currency}${due.toFixed(
                  2
                )} outstanding`
              : 'Account settled'}
          </Text>

          <Ionicons
            name="chevron-forward"
            size={15}
            color={colors.textMuted}
          />
        </View>
      </TouchableOpacity>
    );
  };

  // ==================================================
  // UI
  // ==================================================

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredShops}
        keyExtractor={(item) =>
          String(item.id)
        }
        renderItem={renderShop}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={colors.primary}
          />
        }

        // ============================================
        // HEADER
        // ============================================

        ListHeaderComponent={
          <View style={styles.header}>

            {/* Top header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>
                  My Due Bills
                </Text>

                <Text
                  style={styles.subtitle}
                >
                  {shops.length}{' '}
                  {shops.length === 1
                    ? 'shop'
                    : 'shops'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={() =>
                  setModalVisible(true)
                }
                activeOpacity={0.75}
              >
                <Ionicons
                  name="add"
                  size={22}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Total due
            <View style={styles.totalCard}>
              <View>
                <Text
                  style={styles.totalLabel}
                >
                  TOTAL DUE
                </Text>

                <Text
                  style={styles.totalAmount}
                >
                  {currency}
                  {totalDue.toFixed(2)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.breakdownButton}
                onPress={() =>
                  setBreakdownVisible(
                    true
                  )
                }
                activeOpacity={0.7}
              >
                <Text
                  style={
                    styles.breakdownText
                  }
                >
                  Breakdown
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View> */}

            {/* Stats */}
            <View style={styles.statsRow}>
              <DueCircle
                amount={totalDue}
                onPress={() =>
                  setBreakdownVisible(
                    true
                  )
                }
              />

              <ExpenseStats
                thisWeek={stats.thisWeek}
                thisMonth={stats.thisMonth}
              />
            </View>

            {/* Search */}
            <View
              style={styles.searchContainer}
            >
              <Ionicons
                name="search-outline"
                size={18}
                color={colors.textMuted}
              />

              <TextInput
                style={styles.searchInput}
                placeholder="Search shops..."
                placeholderTextColor={
                  colors.textMuted
                }
                value={query}
                onChangeText={setQuery}
              />

              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() =>
                    setQuery('')
                  }
                  hitSlop={{
                    top: 10,
                    bottom: 10,
                    left: 10,
                    right: 10,
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={
                      colors.textMuted
                    }
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Section */}
            <View
              style={styles.sectionHeader}
            >
              <Text
                style={styles.sectionTitle}
              >
                Shops
              </Text>

              {shops.some(
                (shop) => shop.pinned
              ) && (
                <View
                  style={
                    styles.pinnedInfo
                  }
                >
                  <Ionicons
                    name="pin"
                    size={12}
                    color={colors.primary}
                  />

                  <Text
                    style={
                      styles.pinnedInfoText
                    }
                  >
                    {
                      shops.filter(
                        (shop) =>
                          shop.pinned
                      ).length
                    }{' '}
                    pinned
                  </Text>
                </View>
              )}
            </View>
          </View>
        }

        // ============================================
        // EMPTY
        // ============================================

        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <View
                style={styles.emptyIcon}
              >
                <Ionicons
                  name={
                    query
                      ? 'search-outline'
                      : 'storefront-outline'
                  }
                  size={28}
                  color={colors.textMuted}
                />
              </View>

              <Text
                style={styles.emptyTitle}
              >
                {query
                  ? 'No shops found'
                  : 'No shops yet'}
              </Text>

              <Text
                style={styles.emptyText}
              >
                {query
                  ? 'Try a different shop name.'
                  : 'Add your first shop to start tracking due bills.'}
              </Text>

              {!query && (
                <TouchableOpacity
                  style={
                    styles.emptyAddButton
                  }
                  onPress={() =>
                    setModalVisible(true)
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="add"
                    size={17}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.emptyAddText
                    }
                  >
                    Add Shop
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
      />

      {/* ============================================
          FAB
      ============================================ */}

      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          setModalVisible(true)
        }
        activeOpacity={0.85}
      >
        <Ionicons
          name="add"
          size={26}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      {/* ============================================
          ADD SHOP
      ============================================ */}

      <AddShopModal
        visible={modalVisible}
        onClose={() =>
          setModalVisible(false)
        }
        onAdded={handleAdded}
      />

      {/* ============================================
          DUE BREAKDOWN
      ============================================ */}

      <DueBreakdownModal
        visible={breakdownVisible}
        breakdown={stats}
        onClose={() =>
          setBreakdownVisible(false)
        }
      />
    </View>
  );
}

// ==================================================
// STYLES
// ==================================================

function makeStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    listContent: {
      paddingBottom: 110,
    },

    // ==============================================
    // HEADER
    // ==============================================

    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },

    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.4,
    },

    subtitle: {
      color: colors.textMuted,
      fontSize: 11,
      marginTop: 3,
    },

    addButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ==============================================
    // TOTAL CARD
    // ==============================================

    totalCard: {
      backgroundColor: colors.card,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },

    totalLabel: {
      color: colors.textMuted,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.8,
    },

    totalAmount: {
      color: colors.text,
      fontSize: 23,
      fontWeight: '900',
      marginTop: 2,
    },

    breakdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },

    breakdownText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '700',
    },

    // ==============================================
    // STATS
    // ==============================================

    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },

    // ==============================================
    // SEARCH
    // ==============================================

    searchContainer: {
      height: 46,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
    },

    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 13,
      marginLeft: spacing.sm,
      paddingVertical: 0,
    },

    // ==============================================
    // SECTION
    // ==============================================

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },

    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },

    pinnedInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    pinnedInfoText: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '600',
    },

    // ==============================================
    // SHOP CARD
    // ==============================================

    card: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },

    cardPinned: {
      borderColor: colors.primary,
    },

    cardRow: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
    },

    shopIcon: {
      width: 40,
      height: 40,
      borderRadius: 11,
      backgroundColor: colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },

    shopIconPinned: {
      backgroundColor:
        'rgba(59,130,246,0.08)',
    },

    shopInfo: {
      flex: 1,
      minWidth: 0,
      paddingRight: spacing.sm,
    },

    shopName: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },

    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 5,
    },

    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 5,
    },

    statusText: {
      fontSize: 10,
      fontWeight: '600',
    },

    // ==============================================
    // DUE
    // ==============================================

    dueContainer: {
      alignItems: 'flex-end',
      marginRight: 4,
      maxWidth: 95,
    },

    dueLabel: {
      color: colors.textMuted,
      fontSize: 8,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginBottom: 2,
    },

    dueAmount: {
      fontSize: 14,
      fontWeight: '800',
    },

    // ==============================================
    // PIN
    // ==============================================

    pinButton: {
      width: 34,
      height: 34,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 4,
    },

    pinButtonActive: {
      backgroundColor:
        'rgba(59,130,246,0.08)',
    },

    // ==============================================
    // FOOTER
    // ==============================================

    cardFooter: {
      height: 28,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.bg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    cardFooterPinned: {
      backgroundColor:
        'rgba(59,130,246,0.04)',
    },

    footerText: {
      color: colors.textMuted,
      fontSize: 9,
      fontWeight: '500',
    },

    // ==============================================
    // EMPTY
    // ==============================================

    empty: {
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: 45,
    },

    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 20,
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
      fontSize: 11,
      textAlign: 'center',
      lineHeight: 17,
      marginTop: 5,
      maxWidth: 280,
    },

    emptyAddButton: {
      marginTop: spacing.md,
      height: 40,
      paddingHorizontal: spacing.md,
      borderRadius: 11,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },

    emptyAddText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },

    // ==============================================
    // FAB
    // ==============================================

    fab: {
      position: 'absolute',
      right: spacing.lg,
      bottom: 86,
      width: 54,
      height: 54,
      borderRadius: 17,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 6,
      shadowOffset: {
        width: 0,
        height: 3,
      },
    },
  });
}