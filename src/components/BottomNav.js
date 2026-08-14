import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

const TABS = [
  { key: 'shops', label: 'Shops', icon: 'storefront', iconOutline: 'storefront-outline' },
  { key: 'history', label: 'History', icon: 'time', iconOutline: 'time-outline' },
];

export default function BottomNav({ tab, onChange }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={styles.item}
              activeOpacity={0.7}
              onPress={() => onChange(t.key)}
            >
              {active && <View />}
              <View style={[ active && styles.iconWrapActive]}>
                <Ionicons
                  name={active ? t.icon : t.iconOutline}
                  size={22}
                  color={active ? colors.primary : colors.textMuted}
                />
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  activeDot: {
    position: 'absolute',
    top: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.cardAlt,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});