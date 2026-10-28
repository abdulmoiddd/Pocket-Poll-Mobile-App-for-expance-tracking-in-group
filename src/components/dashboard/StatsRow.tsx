import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { formatCurrency } from '../../services/calculations';
import { TrendingUp, TrendingDown, Users } from 'lucide-react-native';

interface StatsRowProps {
  totalBudget: number;
  totalExpenses: number;
  activeMembersCount: number;
  currencySymbol: string;
}

export const StatsRow: React.FC<StatsRowProps> = ({
  totalBudget,
  totalExpenses,
  activeMembersCount,
  currencySymbol,
}) => {
  return (
    <View style={styles.container}>
      {/* Total Pool Budget Card */}
      <View
        style={styles.card}
        accessibilityRole="summary"
        accessibilityLabel={`Total Pool Budget: ${formatCurrency(totalBudget, currencySymbol)}`}
      >
        <View style={[styles.iconWrapper, { backgroundColor: '#ECFDF5' }]}>
          <TrendingUp size={16} color={theme.colors.success} />
        </View>
        <Text style={styles.label}>Pool Budget</Text>
        <Text style={[styles.amount, { color: theme.colors.success }]}>
          +{formatCurrency(totalBudget, currencySymbol)}
        </Text>
      </View>

      {/* Total Expenses Card */}
      <View
        style={styles.card}
        accessibilityRole="summary"
        accessibilityLabel={`Total Expenses: ${formatCurrency(totalExpenses, currencySymbol)}`}
      >
        <View style={[styles.iconWrapper, { backgroundColor: '#FEF2F2' }]}>
          <TrendingDown size={16} color={theme.colors.danger} />
        </View>
        <Text style={styles.label}>Total Spent</Text>
        <Text style={[styles.amount, { color: '#DC2626' }]}>
          -{formatCurrency(totalExpenses, currencySymbol)}
        </Text>
      </View>

      {/* Active Members Card */}
      <View
        style={styles.card}
        accessibilityRole="summary"
        accessibilityLabel={`Active Members: ${activeMembersCount}`}
      >
        <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primaryLight }]}>
          <Users size={16} color={theme.colors.primary} />
        </View>
        <Text style={styles.label}>Members</Text>
        <Text style={[styles.amount, { color: theme.colors.textPrimary }]}>
          {activeMembersCount} Active
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 14,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    ...theme.shadows.sm,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  amount: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
