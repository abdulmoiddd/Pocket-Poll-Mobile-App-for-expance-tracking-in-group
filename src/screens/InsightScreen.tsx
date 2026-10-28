import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { usePocketPool } from '../context/PocketPoolContext';
import { Header } from '../components/common/Header';
import { PeriodSegmentedControl, InsightPeriod } from '../components/insight/PeriodSegmentedControl';
import { InsightHeroMetric } from '../components/insight/InsightHeroMetric';
import { InsightLineChart } from '../components/insight/InsightLineChart';
import { CategoryRankingList } from '../components/insight/CategoryRankingList';
import { ContributionShareList } from '../components/insight/ContributionShareList';
import { theme } from '../theme';
import { getSpendingTrend, getCategorySummaries } from '../services/calculations';

export const InsightScreen: React.FC = () => {
  const { transactions, settings, memberSummaries, unreadAlertsCount, lockApp } = usePocketPool();
  const [selectedPeriod, setSelectedPeriod] = useState<InsightPeriod>('month');

  // Filter transactions according to selected period
  const periodFiltered = useMemo(() => {
    const now = new Date().getTime();
    const dayMs = 86400000;
    const days = selectedPeriod === 'month' ? 30 : selectedPeriod === 'quarter' ? 90 : 365;
    const cutoff = now - days * dayMs;

    return transactions.filter((tx) => new Date(tx.date).getTime() >= cutoff);
  }, [transactions, selectedPeriod]);

  // Total spent in this period
  const totalPeriodSpend = useMemo(() => {
    return periodFiltered
      .filter((tx) => tx.type === 'expense')
      .reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);
  }, [periodFiltered]);

  // Categories in this period
  const periodCategories = useMemo(() => {
    return getCategorySummaries(periodFiltered);
  }, [periodFiltered]);

  // Spending trend points (last 7 or 14 points)
  const chartPoints = useMemo(() => {
    const count = selectedPeriod === 'month' ? 7 : selectedPeriod === 'quarter' ? 10 : 12;
    return getSpendingTrend(periodFiltered, count);
  }, [periodFiltered, selectedPeriod]);

  // Period label for hero
  const periodLabel =
    selectedPeriod === 'month' ? 'month' : selectedPeriod === 'quarter' ? 'quarter' : 'year';

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* White Header per requirements */}
        <Header
          title="Insights & Analytics"
          subtitle="Spending breakdowns & pool distributions"
          variant="white"
          showLogo={true}
          unreadAlerts={unreadAlertsCount}
          onLockPress={settings.biometricEnabled ? lockApp : undefined}
        />

        {/* Segmented Control (Month, Quarter, Year) */}
        <PeriodSegmentedControl
          selectedPeriod={selectedPeriod}
          onSelectPeriod={setSelectedPeriod}
        />

        {/* Hero Metric with comparison badge */}
        <InsightHeroMetric
          totalSpend={totalPeriodSpend}
          currencySymbol={settings.currencySymbol}
          periodLabel={periodLabel}
          changePercentage={-8.6} // Spending comparison badge
        />

        {/* Spending Trend Line Chart */}
        <InsightLineChart
          trendData={chartPoints}
          currencySymbol={settings.currencySymbol}
        />

        {/* Vertical list of category breakdowns */}
        <CategoryRankingList
          categories={periodCategories}
          currencySymbol={settings.currencySymbol}
        />

        {/* Member contribution distribution */}
        <ContributionShareList
          memberSummaries={memberSummaries}
          currencySymbol={settings.currencySymbol}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 90,
  },
});
