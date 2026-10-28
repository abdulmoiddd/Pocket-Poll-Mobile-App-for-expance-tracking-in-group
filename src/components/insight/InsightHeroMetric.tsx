import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { formatCurrency } from '../../services/calculations';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react-native';

interface InsightHeroMetricProps {
  totalSpend: number;
  currencySymbol: string;
  periodLabel: string;
  changePercentage: number; // e.g. -12.4
}

export const InsightHeroMetric: React.FC<InsightHeroMetricProps> = ({
  totalSpend,
  currencySymbol,
  periodLabel,
  changePercentage,
}) => {
  const isReduced = changePercentage <= 0;

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`Total spending for this ${periodLabel}: ${formatCurrency(totalSpend, currencySymbol)}, which is ${Math.abs(
        changePercentage
      )}% ${isReduced ? 'lower' : 'higher'} than previous ${periodLabel}`}
    >
      <Text style={styles.label}>TOTAL SPENDING ({periodLabel.toUpperCase()})</Text>
      <View style={styles.metricRow}>
        <Text style={styles.amount}>
          {formatCurrency(totalSpend, currencySymbol)}
        </Text>

        <View
          style={[
            styles.badge,
            { backgroundColor: isReduced ? '#ECFDF5' : '#FEF2F2' },
          ]}
        >
          {isReduced ? (
            <ArrowDownRight size={14} color="#059669" />
          ) : (
            <ArrowUpRight size={14} color="#DC2626" />
          )}
          <Text
            style={[
              styles.badgeText,
              { color: isReduced ? '#059669' : '#DC2626' },
            ]}
          >
            {Math.abs(changePercentage).toFixed(1)}%
          </Text>
        </View>
      </View>
      <Text style={styles.comparisonText}>
        {isReduced
          ? `Great job! Spent ${Math.abs(changePercentage)}% less than previous ${periodLabel}.`
          : `Expenses are up ${changePercentage}% compared to previous ${periodLabel}.`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
    ...theme.shadows.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amount: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  comparisonText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
});
