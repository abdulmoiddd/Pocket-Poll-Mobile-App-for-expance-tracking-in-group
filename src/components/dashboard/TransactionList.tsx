import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
import { Transaction } from '../../types';
import { formatCurrency, getCategoryTheme } from '../../services/calculations';
import {
  FileText,
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  MoreHorizontal,
} from 'lucide-react-native';

interface TransactionListProps {
  transactions: Transaction[];
  currencySymbol: string;
  onTransactionPress?: (tx: Transaction) => void;
  onViewAllPress?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  currencySymbol,
  onTransactionPress,
  onViewAllPress,
}) => {
  const getCategoryIcon = (tx: Transaction) => {
    if (tx.type === 'contribution') {
      return <ArrowDownLeft size={16} color={theme.colors.success} />;
    }
    switch (tx.category) {
      case 'Food':
        return <Utensils size={16} color={theme.colors.food} />;
      case 'Transport':
        return <Car size={16} color={theme.colors.transport} />;
      case 'Shopping':
        return <ShoppingBag size={16} color={theme.colors.shopping} />;
      case 'Fun':
        return <Gamepad2 size={16} color={theme.colors.fun} />;
      case 'Bills':
        return <Receipt size={16} color={theme.colors.bills} />;
      default:
        return <ArrowUpRight size={16} color={theme.colors.danger} />;
    }
  };

  const getIconBackground = (tx: Transaction) => {
    if (tx.type === 'contribution') return '#ECFDF5';
    if (!tx.category) return '#FEF2F2';
    return getCategoryTheme(tx.category).lightColor;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activity</Text>
        {onViewAllPress && (
          <TouchableOpacity onPress={onViewAllPress} accessibilityRole="button">
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No activity recorded yet.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {transactions.map((tx) => {
            const isContribution = tx.type === 'contribution';

            return (
              <TouchableOpacity
                key={tx.id}
                style={styles.item}
                onPress={() => onTransactionPress && onTransactionPress(tx)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${tx.type}: ${tx.notes || tx.category || 'Transaction'}, ${
                  isContribution ? 'plus' : 'minus'
                } ${formatCurrency(tx.amount, currencySymbol)} by ${tx.memberName}`}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: getIconBackground(tx) },
                  ]}
                >
                  {getCategoryIcon(tx)}
                </View>

                <View style={styles.centerCol}>
                  <Text style={styles.txTitle} numberOfLines={1}>
                    {tx.notes || (isContribution ? 'Contribution' : tx.category || 'Expense')}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{tx.memberName}</Text>
                    <Text style={styles.metaDot}>&bull;</Text>
                    <Text style={styles.metaText}>{tx.date}</Text>
                    {tx.receiptName && (
                      <>
                        <Text style={styles.metaDot}>&bull;</Text>
                        <Text style={styles.receiptIndicator}>📎 Receipt</Text>
                      </>
                    )}
                  </View>
                </View>

                <View style={styles.amountCol}>
                  <Text
                    style={[
                      styles.amountText,
                      { color: isContribution ? '#059669' : '#1F2937' },
                    ]}
                  >
                    {isContribution ? '+' : '-'}
                    {formatCurrency(tx.amount, currencySymbol)}
                  </Text>
                  <Text style={styles.paymentMethodText}>{tx.paymentMethod}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
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
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
    ...theme.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  list: {
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  centerCol: {
    flex: 1,
    marginRight: 8,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  metaDot: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  receiptIndicator: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
  },
  paymentMethodText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
});
