import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { usePocketPool } from '../context/PocketPoolContext';
import { Header } from '../components/common/Header';
import { HeroMetric } from '../components/dashboard/HeroMetric';
import { StatsRow } from '../components/dashboard/StatsRow';
import { SpendingTrendChart } from '../components/dashboard/SpendingTrendChart';
import { CategoryBreakdown } from '../components/dashboard/CategoryBreakdown';
import { TransactionList } from '../components/dashboard/TransactionList';
import { AlertBanner } from '../components/common/AlertBanner';
import { ExportManager } from '../components/settings/ExportManager';
import { theme } from '../theme';
import { Transaction, ExportFormat, ExportTimeframe } from '../types';
import { formatCurrency } from '../services/calculations';
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Trash2,
  X,
  Share2,
  Eye,
  Camera,
  Bell,
  CheckCircle,
  AlertTriangle,
  Download,
  Receipt,
  Users,
} from 'lucide-react-native';

interface DashboardScreenProps {
  onNavigateToAdd: (defaultType?: 'expense' | 'contribution') => void;
  onNavigateToSettings: () => void;
  onNavigateToInsights: () => void;
  onNavigateToMembers: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToAdd,
  onNavigateToSettings,
  onNavigateToInsights,
  onNavigateToMembers,
}) => {
  const {
    budget,
    transactions,
    members,
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
  const [fullscreenImageUri, setFullscreenImageUri] = useState<string | null>(null);
  const [alertsModalVisible, setAlertsModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);

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

  const handleShareReceiptPicture = async (uri: string, name?: string) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Receipt - ${name || 'Expense'}`,
        });
      } else {
        Alert.alert('Saved', 'Receipt picture is stored with your local expense data.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not share receipt picture.');
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
          onAlertPress={() => {
            markAlertsAsRead();
            setAlertsModalVisible(true);
          }}
          onLockPress={settings.biometricEnabled ? lockApp : undefined}
          rightAction={
            <TouchableOpacity
              onPress={onNavigateToMembers}
              style={styles.groupHeaderBadge}
              accessibilityRole="button"
              accessibilityLabel="View and manage group members"
            >
              <Users size={16} color="#FFFFFF" />
              <Text style={styles.groupHeaderBadgeText}>
                {members.length}
              </Text>
            </TouchableOpacity>
          }
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
            onPress={() => setExportModalVisible(true)}
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
          activeMembersCount={members.length}
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
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 560 }}>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalSheetTitle}>Transaction Detail</Text>
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

                {/* Receipt Picture Card */}
                {selectedTx.receiptUri ? (
                  <View style={styles.modalReceiptCard}>
                    <View style={styles.receiptHeaderRow}>
                      <View style={styles.receiptTitleWithIcon}>
                        <Receipt size={16} color={theme.colors.primary} />
                        <Text style={styles.receiptCardLabel}>RECEIPT PICTURE</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setFullscreenImageUri(selectedTx.receiptUri || null)}
                        style={styles.expandReceiptBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Enlarge receipt picture"
                      >
                        <Eye size={13} color={theme.colors.primary} />
                        <Text style={styles.expandReceiptText}>Enlarge</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={() => setFullscreenImageUri(selectedTx.receiptUri || null)}
                      activeOpacity={0.9}
                      style={styles.receiptImageContainer}
                    >
                      <Image
                        source={{ uri: selectedTx.receiptUri }}
                        style={styles.receiptImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        handleShareReceiptPicture(
                          selectedTx.receiptUri!,
                          selectedTx.receiptName
                        )
                      }
                      style={styles.saveReceiptPictureBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Save or share receipt picture"
                    >
                      <Share2 size={15} color="#059669" />
                      <Text style={styles.saveReceiptPictureText}>
                        Save / Share Receipt Picture
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

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
                    accessibilityRole="button"
                    accessibilityLabel="Export PDF invoice"
                  >
                    <FileText size={16} color="#FFFFFF" />
                    <Text style={styles.modalBtnText}>Export PDF Invoice</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionBtn, styles.deleteBtn]}
                    onPress={() => handleDeleteTx(selectedTx.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Delete transaction"
                  >
                    <Trash2 size={16} color={theme.colors.danger} />
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Fullscreen Receipt Viewer Modal */}
      <Modal
        visible={!!fullscreenImageUri}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenImageUri(null)}
      >
        <View style={styles.fullscreenOverlay}>
          <View style={styles.fullscreenHeader}>
            <Text style={styles.fullscreenTitle}>Receipt Picture</Text>
            <TouchableOpacity
              onPress={() => setFullscreenImageUri(null)}
              style={styles.fullscreenCloseBtn}
            >
              <X size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {fullscreenImageUri && (
            <View style={styles.fullscreenImgWrapper}>
              <Image
                source={{ uri: fullscreenImageUri }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            </View>
          )}

          <View style={styles.fullscreenFooter}>
            <TouchableOpacity
              onPress={() => {
                if (fullscreenImageUri) {
                  handleShareReceiptPicture(fullscreenImageUri, 'receipt_photo.png');
                }
              }}
              style={styles.fullscreenShareBtn}
            >
              <Share2 size={18} color="#FFFFFF" />
              <Text style={styles.fullscreenShareText}>Save / Share Picture</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notifications / Alerts Sheet Modal */}
      <Modal
        visible={alertsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAlertsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.alertsTitleRow}>
                <Bell size={22} color={theme.colors.primary} />
                <Text style={styles.modalSheetTitle}>Budget &amp; Pool Alerts</Text>
              </View>
              <TouchableOpacity onPress={() => setAlertsModalVisible(false)}>
                <X size={22} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {alerts.length === 0 ? (
              <View style={styles.emptyAlertsBox}>
                <CheckCircle size={36} color="#059669" />
                <Text style={styles.emptyAlertsTitle}>All Good!</Text>
                <Text style={styles.emptyAlertsText}>
                  No low budget threshold alerts or warnings. Pool finances are in healthy shape.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 380 }}>
                {alerts.map((alt) => (
                  <View key={alt.id} style={styles.alertCard}>
                    <AlertTriangle size={20} color={theme.colors.warning} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.alertCardMessage}>{alt.message}</Text>
                      <Text style={styles.alertCardTime}>
                        {new Date(alt.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => dismissAlert(alt.id)}>
                      <X size={16} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              onPress={() => setAlertsModalVisible(false)}
              style={styles.closeAlertsBtn}
            >
              <Text style={styles.closeAlertsText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Quick Invoicing & Export Modal */}
      <Modal
        visible={exportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalSheetTitle}>Export Report &amp; Invoices</Text>
              <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                <X size={22} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <ExportManager
                onExport={async (format, timeframe) => {
                  return exportReport(format, timeframe);
                }}
              />
            </ScrollView>
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
    paddingBottom: 90,
  },
  groupHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
  },
  groupHeaderBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
    paddingHorizontal: 8,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: theme.borderRadius.full,
    borderTopRightRadius: theme.borderRadius.full,
    padding: 24,
    paddingBottom: 36,
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
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: theme.borderRadius.md,
    marginBottom: 16,
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
  modalReceiptCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 16,
  },
  receiptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 0.6,
  },
  expandReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandReceiptText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  receiptImageContainer: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  receiptImage: {
    width: '100%',
    height: '100%',
  },
  saveReceiptPictureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: theme.borderRadius.full,
    paddingVertical: 8,
    marginTop: 10,
  },
  saveReceiptPictureText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  detailsList: {
    gap: 12,
    marginBottom: 20,
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
    ...theme.shadows.button,
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
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 16,
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullscreenTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  fullscreenCloseBtn: {
    padding: 6,
  },
  fullscreenImgWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenFooter: {
    alignItems: 'center',
  },
  fullscreenShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  fullscreenShareText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  alertsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emptyAlertsBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyAlertsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 10,
  },
  emptyAlertsText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 10,
  },
  alertCardMessage: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  alertCardTime: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 4,
  },
  closeAlertsBtn: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  closeAlertsText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
});
