import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { CategorySummary } from '../../types';
import { formatCurrency } from '../../services/calculations';
import {
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Receipt,
  MoreHorizontal,
} from 'lucide-react-native';

interface CategoryRankingListProps {
  categories: CategorySummary[];
  currencySymbol: string;
}

export const CategoryRankingList: React.FC<CategoryRankingListProps> = ({
  categories,
  currencySymbol,
}) => {
  const getCategoryIcon = (name: string, color: string) => {
    switch (name) {
      case 'Food':
        return <Utensils size={18} color={color} />;
      case 'Transport':
        return <Car size={18} color={color} />;
      case 'Shopping':
        return <ShoppingBag size={18} color={color} />;
      case 'Fun':
        return <Gamepad2 size={18} color={color} />;
      case 'Bills':
        return <Receipt size={18} color={color} />;
      default:
        return <MoreHorizontal size={18} color={color} />;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Category Breakdown</Text>
        <Text style={styles.subtitle}>Ranked by expenditure</Text>
      </View>

      {categories.length === 0 ? (
        <Text style={styles.emptyText}>No expenses for this period.</Text>
      ) : (
        <View style={styles.list}>
          {categories.map((cat, idx) => (
            <View
              key={cat.category}
              style={styles.item}
              accessibilityRole="text"
              accessibilityLabel={`${idx + 1}. ${cat.category}: ${formatCurrency(
                cat.amount,
                currencySymbol
              )}, ${cat.percentage}% of total expenses, ${cat.transactionCount} transactions`}
            >
              <View style={styles.left}>
                <View style={[styles.iconBox, { backgroundColor: cat.lightColor }]}>
                  {getCategoryIcon(cat.category, cat.color)}
                </View>
                <View>
                  <Text style={styles.name}>{cat.category}</Text>
                  <Text style={styles.txCount}>
                    {cat.transactionCount} {cat.transactionCount === 1 ? 'transaction' : 'transactions'}
                  </Text>
                </View>
              </View>

              <View style={styles.right}>
                <Text style={styles.amount}>
                  {formatCurrency(cat.amount, currencySymbol)}
                </Text>
                <View style={styles.percentPill}>
                  <Text style={[styles.percentText, { color: cat.color }]}>
                    {cat.percentage}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
    ...theme.shadows.sm,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  list: {
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  txCount: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 3,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  percentPill: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
