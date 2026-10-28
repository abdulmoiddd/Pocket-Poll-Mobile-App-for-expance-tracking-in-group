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

interface CategoryBreakdownProps {
  categories: CategorySummary[];
  currencySymbol: string;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  categories,
  currencySymbol,
}) => {
  const getCategoryIcon = (name: string, color: string) => {
    switch (name) {
      case 'Food':
        return <Utensils size={16} color={color} />;
      case 'Transport':
        return <Car size={16} color={color} />;
      case 'Shopping':
        return <ShoppingBag size={16} color={color} />;
      case 'Fun':
        return <Gamepad2 size={16} color={color} />;
      case 'Bills':
        return <Receipt size={16} color={color} />;
      default:
        return <MoreHorizontal size={16} color={color} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Category Breakdown</Text>
        <Text style={styles.subtitle}>By Total Expenditure</Text>
      </View>

      {categories.length === 0 ? (
        <Text style={styles.emptyText}>No expenses recorded yet.</Text>
      ) : (
        <View style={styles.list}>
          {categories.map((cat) => (
            <View
              key={cat.category}
              style={styles.item}
              accessibilityRole="text"
              accessibilityLabel={`${cat.category}: ${formatCurrency(cat.amount, currencySymbol)}, ${cat.percentage}% of total expenses`}
            >
              <View style={styles.topLine}>
                <View style={styles.leftGroup}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: cat.lightColor },
                    ]}
                  >
                    {getCategoryIcon(cat.category, cat.color)}
                  </View>
                  <Text style={styles.catName}>{cat.category}</Text>
                </View>

                <View style={styles.rightGroup}>
                  <Text style={styles.catAmount}>
                    {formatCurrency(cat.amount, currencySymbol)}
                  </Text>
                  <Text style={styles.catPercent}>{cat.percentage}%</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.min(100, Math.max(2, cat.percentage))}%`,
                      backgroundColor: cat.color,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  list: {
    gap: 14,
  },
  item: {
    gap: 6,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  catAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  catPercent: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
    minWidth: 32,
    textAlign: 'right',
  },
  track: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
