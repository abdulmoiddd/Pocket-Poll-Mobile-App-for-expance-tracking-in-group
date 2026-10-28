import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { usePocketPool } from '../context/PocketPoolContext';
import { Header } from '../components/common/Header';
import { HeroMetric } from '../components/dashboard/HeroMetric';
import { StatsRow } from '../components/dashboard/StatsRow';
import { SpendingTrendChart } from '../components/dashboard/SpendingTrendChart';
import { CategoryBreakdown } from '../components/dashboard/CategoryBreakdown';
import { TransactionList } from '../components/dashboard/TransactionList';
import { AlertBanner } from '../components/common/AlertBanner';
import { theme } from '../theme';
import { Transaction } from '../types';
import { formatCurrency } from '../services/calculations';
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Trash2,
  X,
  Share2,
} from 'lucide-react-native';

interface DashboardScreenProps {
  onNavigateToAdd: (defaultType?: 'expense' | 'contribution') => void;
  onNavigateToSettings: () => void;
  onNavigateToInsights: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToAdd,
  onNavigateToSettings,
  onNavigateToInsights,
}) => {
  const {
    budget,
    transactions,
    settings,
    alerts,
    categorySummaries,
    spendingTrend,
    unreadAlertsCount,
    markAlertsAsRead,
    dismissAlert,
    lockApp,
    deleteTransaction,
    exportReport,
  } = usePocketPool();

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isExportingTx, setIsExportingTx] = useState(false);

  // Active unread alert if budget is below threshold
  const activeAlert = alerts.length > 0 ? alerts[0] : null;

  const handleExportSingleTx = async (tx: Transaction, format: 'pdf' | 'csv') => {
    setIsExportingTx(true);
    try {
      await exportReport(format, 'single', tx.id);
    } catch {
      Alert.alert('Error', 'Failed to generate single transaction invoice');
    } finally {
      setIsExportingTx(false);
    }
  };

  const handleDeleteTx = (id: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this record? This will adjust the pool budget.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTransaction(id);
            setSelectedTx(null);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Purple Gradient Header */}
        <Header
          subtitle={settings.groupName}
          showLogo={true}
          unreadAlerts={unreadAlertsCount}
          onAlertPress={markAlertsAsRead}
          onLockPress={settings.biometricEnabled ? lockApp : undefined}
        />

        {/* Hero Metric Card overlapping header */}
        <HeroMetric
          remainingBudget={budget.remainingBudget}
          totalBudget={budget.totalBudget}
          totalExpenses={budget.totalExpenses}
          percentageSpent={budget.percentageSpent}
          isBelowThreshold={budget.isBelowThreshold}
          thresholdAmount={settings.thresholdAmount}
          currencySymbol={settings.currencySymbol}
        />

        {/* Low Budget Alert Banner if active */}
        {budget.isBelowThreshold && (
          <AlertBanner
            type={budget.remainingBudget <= 0 ? 'danger' : 'warning'}
            message={
              activeAlert?.message ||
              `Pool balance has dropped below your threshold of ${settings.currencySymbol}${settings.thresholdAmount.toFixed(
                2
              )}.`
            }
            onPress={onNavigateToSettings}
            onDismiss={activeAlert ? () => dismissAlert(activeAlert.id) : undefined}
          />
        )}

        {/* Quick Action Buttons */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.actionPill}
            onPress={() => onNavigateToAdd('contribution')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Add Contribution to pool"
          >
            <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
              <ArrowDownLeft size={16} color="#059669" />
            </View>
            <Text style={styles.actionText}>Add Deposit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionPill}
            onPress={() => onNavigateToAdd('expense')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Add Expense from pool"
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
              <ArrowUpRight size={16} color="#DC2626" />
            </View>
            <Text style={styles.actionText}>Record Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionPill}
            onPress={onNavigateToSettings}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Export Invoices & Reports"
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.primaryLight }]}>
              <FileText size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionText}>Export Report</Text>
          </TouchableOpacity>
        </View>

        {/* 3 Stats Row */}
        <StatsRow
          totalBudget={budget.totalBudget}
          totalExpenses={budget.totalExpenses}
          activeMembersCount={budget.activeMembersCount}
          currencySymbol={settings.currencySymbol}
        />

        {/* Spending Trend Line Chart */}
        <SpendingTrendChart
          trendData={spendingTrend}
          currencySymbol={settings.currencySymbol}
        />

        {/* Category Breakdown Progress Bars */}
        <CategoryBreakdown
          categories={categorySummaries}
          currencySymbol={settings.currencySymbol}
        />

        {/* Recent Transactions List */}
        <TransactionList
          transactions={transactions.slice(0, 8)}
          currencySymbol={settings.currencySymbol}
          onTransactionPress={(tx) => setSelectedTx(tx)}
          onViewAllPress={onNavigateToInsights}
        />
      </ScrollView>

      {/* Transaction Details Modal & Single Invoice Generator */}
      <Modal
        visible={!!selectedTx}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTx(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedTx && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalSheetTitle}>Transaction Receipt</Text>
                    <Text style={styles.modalSheetDate}>{selectedTx.date}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedTx(null)}>
                    <X size={22} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Amount display */}
                <View style={styles.modalAmountBox}>
                  <Text
                    style={[
                      styles.modalAmountText,
                      {
                        color:
                          selectedTx.type === 'contribution' ? '#059669' : '#1F2937',
                      },
                    ]}
                  >
                    {selectedTx.type === 'contribution' ? '+' : '-'}
                    {formatCurrency(selectedTx.amount, settings.currencySymbol)}
                  </Text>
                  <Text style={styles.modalTypeText}>
                    {selectedTx.type === 'contribution'
                      ? 'MEMBER CONTRIBUTION'
                      : `EXPENSE: ${selectedTx.category?.toUpperCase() || 'GENERAL'}`}
                  </Text>
                </View>

                {/* Details list */}
                <View style={styles.detailsList}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Member</Text>
                    <Text style={styles.detailValue}>{selectedTx.memberName}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Method</Text>
                    <Text style={styles.detailValue}>{selectedTx.paymentMethod}</Text>
                  </View>

                  {selectedTx.notes ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Description / Notes</Text>
                      <Text style={styles.detailValue}>{selectedTx.notes}</Text>
                    </View>
                  ) : null}

                  {selectedTx.receiptName ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Receipt File</Text>
                      <Text style={[styles.detailValue, { color: theme.colors.primary }]}>
                        📎 {selectedTx.receiptName}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Export single invoice buttons */}
                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, styles.pdfBtn]}
                    onPress={() => handleExportSingleTx(selectedTx, 'pdf')}
                    disabled={isExportingTx}
                  >
                    <FileText size={16} color="#FFFFFF" />
                    <Text style={styles.modalBtnText}>Export PDF Invoice</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionBtn, styles.deleteBtn]}
                    onPress={() => handleDeleteTx(selectedTx.id)}
                  >
                    <Trash2 size={16} color={theme.colors.danger} />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 90, // room for floating bottom tab bar
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 14,
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.full,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    ...theme.shadows.sm,
    gap: 6,
    justifyContent: 'center',
  },
  actionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: theme.borderRadius.full,
    borderTopRightRadius: theme.borderRadius.full,
    padding: 24,
    paddingBottom: 40,
    ...theme.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalSheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  modalSheetDate: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  modalAmountBox: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: theme.borderRadius.md,
    marginBottom: 20,
  },
  modalAmountText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  modalTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  detailsList: {
    gap: 12,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
    paddingVertical: 14,
    gap: 8,
  },
  pdfBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  deleteBtn: {
    width: 48,
    backgroundColor: theme.colors.dangerLight,
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
