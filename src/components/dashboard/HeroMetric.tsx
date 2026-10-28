import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { formatCurrency } from '../../services/calculations';
import { ShieldCheck, AlertCircle } from 'lucide-react-native';

interface HeroMetricProps {
  remainingBudget: number;
  totalBudget: number;
  totalExpenses: number;
  percentageSpent: number;
  isBelowThreshold: boolean;
  thresholdAmount: number;
  currencySymbol: string;
}

export const HeroMetric: React.FC<HeroMetricProps> = ({
  remainingBudget,
  totalBudget,
  totalExpenses,
  percentageSpent,
  isBelowThreshold,
  thresholdAmount,
  currencySymbol,
}) => {
  const isHealthy = !isBelowThreshold && remainingBudget > 0;
  const progressRatio = Math.min(100, Math.max(0, percentageSpent)) / 100;

  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel={`Pool Remaining Balance: ${formatCurrency(remainingBudget, currencySymbol)}. ${
        isBelowThreshold ? 'Warning: Budget is below threshold.' : 'Budget status is healthy.'
      }`}
    >
      <View style={styles.topRow}>
        <Text style={styles.metricLabel}>POOL REMAINING BALANCE</Text>
        <View
          style={[
            styles.statusPill,
            isHealthy ? styles.statusHealthy : styles.statusWarning,
          ]}
        >
          {isHealthy ? (
            <ShieldCheck size={12} color="#059669" />
          ) : (
            <AlertCircle size={12} color="#DC2626" />
          )}
          <Text
            style={[
              styles.statusText,
              { color: isHealthy ? '#059669' : '#DC2626' },
            ]}
          >
            {isHealthy ? 'Healthy Pool' : 'Low Budget'}
          </Text>
        </View>
      </View>

      <Text style={styles.heroAmount}>
        {formatCurrency(remainingBudget, currencySymbol)}
      </Text>

      {/* Progress Track */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.round(progressRatio * 100)}%`,
                backgroundColor: isBelowThreshold
                  ? theme.colors.danger
                  : percentageSpent > 75
                  ? theme.colors.warning
                  : theme.colors.primary,
              },
            ]}
          />
        </View>

        <View style={styles.progressLabelRow}>
          <Text style={styles.progressInfo}>
            Spent {formatCurrency(totalExpenses, currencySymbol)} of{' '}
            {formatCurrency(totalBudget, currencySymbol)}
          </Text>
          <Text style={styles.progressPercent}>{percentageSpent.toFixed(0)}%</Text>
        </View>
      </View>

      {isBelowThreshold && (
        <View style={styles.thresholdNotice}>
          <Text style={styles.thresholdText}>
            Below threshold of {formatCurrency(thresholdAmount, currencySymbol)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl, // 28px
    padding: 22,
    marginHorizontal: 20,
    marginTop: -20,
    ...theme.shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusHealthy: {
    backgroundColor: '#ECFDF5',
  },
  statusWarning: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroAmount: {
    fontSize: 38,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -1,
    marginVertical: 4,
  },
  progressContainer: {
    marginTop: 14,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  progressInfo: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  thresholdNotice: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  thresholdText: {
    fontSize: 12,
    color: theme.colors.danger,
    fontWeight: '600',
  },
});
