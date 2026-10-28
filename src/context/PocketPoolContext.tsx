import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  Transaction,
  Member,
  AppSettings,
  ThresholdAlert,
  BudgetSummary,
  CategorySummary,
  MemberContributionSummary,
  SpendingTrendPoint,
  ExportFormat,
  ExportTimeframe,
  PaymentMethod,
} from '../types';
import { StorageService, DEFAULT_SETTINGS } from '../services/storage';
import {
  calculateBudgetSummary,
  checkThresholdAlert,
  getCategorySummaries,
  getMemberContributionSummaries,
  getSpendingTrend,
} from '../services/calculations';
import { exportToCSV, exportToPDF } from '../services/export';
import { BiometricsService } from '../services/biometrics';

interface PocketPoolContextType {
  // State
  isLoading: boolean;
  isLocked: boolean;
  transactions: Transaction[];
  members: Member[];
  settings: AppSettings;
  alerts: ThresholdAlert[];
  budget: BudgetSummary;
  categorySummaries: CategorySummary[];
  memberSummaries: MemberContributionSummary[];
  spendingTrend: SpendingTrendPoint[];
  unreadAlertsCount: number;

  // Actions
  unlockApp: () => void;
  lockApp: () => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  addMember: (
    memberOrName:
      | string
      | {
          name: string;
          email?: string;
          phone?: string;
          avatarColor?: string;
          initialDeposit?: number;
          paymentMethod?: PaymentMethod;
        },
    email?: string
  ) => Promise<Member>;
  deleteMember: (id: string) => Promise<void>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  dismissAlert: (id: string) => Promise<void>;
  markAlertsAsRead: () => Promise<void>;
  exportReport: (
    format: ExportFormat,
    timeframe: ExportTimeframe,
    specificTransactionId?: string
  ) => Promise<{ success: boolean; filePath?: string; uri?: string }>;
  resetToDefaults: () => Promise<void>;
  exportJSONBackup: () => Promise<string>;
  importJSONBackup: (json: string) => Promise<boolean>;
}

const PocketPoolContext = createContext<PocketPoolContextType | undefined>(undefined);

const MEMBER_COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#14B8A6'];

export const PocketPoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [alerts, setAlerts] = useState<ThresholdAlert[]>([]);

  // Initialize data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await StorageService.initialize();
        setTransactions(data.transactions);
        setMembers(data.members);
        setSettings(data.settings);
        setAlerts(data.alerts);

        // Check if biometric lock is required
        if (data.settings.biometricEnabled) {
          setIsLocked(true);
        }
      } catch (err) {
        console.error('Failed to initialize PocketPool storage:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute budget summary
  const budget = useMemo(() => {
    return calculateBudgetSummary(transactions, settings.thresholdAmount, members);
  }, [transactions, settings.thresholdAmount, members]);

  // Compute category breakdown
  const categorySummaries = useMemo(() => {
    return getCategorySummaries(transactions);
  }, [transactions]);

  // Compute member contributions
  const memberSummaries = useMemo(() => {
    return getMemberContributionSummaries(transactions, members);
  }, [transactions, members]);

  // Compute spending trend (last 7 days)
  const spendingTrend = useMemo(() => {
    return getSpendingTrend(transactions, 7);
  }, [transactions]);

  // Count unread alerts
  const unreadAlertsCount = useMemo(() => {
    return alerts.filter((a) => !a.read).length;
  }, [alerts]);

  const unlockApp = () => {
    setIsLocked(false);
  };

  const lockApp = () => {
    setIsLocked(true);
  };

  /**
   * Adds transaction (contribution or expense)
   * Deducts expense from Total Budget or adds contribution to Total Budget.
   * Checks and triggers threshold alert if budget drops below threshold.
   */
  const addTransaction = async (
    txData: Omit<Transaction, 'id' | 'createdAt'>
  ): Promise<Transaction> => {
    const previousBudget = budget.remainingBudget;

    const newTransaction: Transaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now(),
      amount: Number(txData.amount) || 0,
    };

    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);
    await StorageService.saveTransactions(updatedTransactions);

    // Calculate updated budget
    const newBudgetSummary = calculateBudgetSummary(
      updatedTransactions,
      settings.thresholdAmount,
      members
    );

    // Check threshold alert trigger
    const alertCheck = checkThresholdAlert(
      previousBudget,
      newBudgetSummary.remainingBudget,
      settings.thresholdAmount,
      settings.currencySymbol
    );

    if (alertCheck.shouldTrigger) {
      const newAlert: ThresholdAlert = {
        id: `alert_${Date.now()}`,
        timestamp: Date.now(),
        remainingBudget: newBudgetSummary.remainingBudget,
        threshold: settings.thresholdAmount,
        read: false,
        message: alertCheck.message,
      };
      const updatedAlerts = [newAlert, ...alerts];
      setAlerts(updatedAlerts);
      await StorageService.saveAlerts(updatedAlerts);
    }

    return newTransaction;
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    await StorageService.saveTransactions(updated);
  };

  const addMember = async (
    memberOrName:
      | string
      | {
          name: string;
          email?: string;
          phone?: string;
          avatarColor?: string;
          initialDeposit?: number;
          paymentMethod?: PaymentMethod;
        },
    emailParam?: string
  ): Promise<Member> => {
    let name: string;
    let email: string | undefined;
    let phone: string | undefined;
    let avatarColor: string | undefined;
    let initialDeposit: number | undefined;
    let paymentMethod: PaymentMethod | undefined;

    if (typeof memberOrName === 'string') {
      name = memberOrName;
      email = emailParam;
    } else {
      name = memberOrName.name;
      email = memberOrName.email;
      phone = memberOrName.phone;
      avatarColor = memberOrName.avatarColor;
      initialDeposit = memberOrName.initialDeposit;
      paymentMethod = memberOrName.paymentMethod;
    }

    const initials = name
      .trim()
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const color = avatarColor || MEMBER_COLORS[members.length % MEMBER_COLORS.length];

    const newMember: Member = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 3)}`,
      name: name.trim(),
      avatarColor: color,
      avatarText: initials || 'PP',
      email: email?.trim(),
      phone: phone?.trim(),
      totalContributed: initialDeposit && initialDeposit > 0 ? initialDeposit : 0,
      joinedAt: new Date().toISOString().split('T')[0],
    };

    const updated = [...members, newMember];
    setMembers(updated);
    await StorageService.saveMembers(updated);

    // If an initial deposit was specified, automatically record contribution
    if (initialDeposit && initialDeposit > 0) {
      await addTransaction({
        type: 'contribution',
        amount: initialDeposit,
        memberId: newMember.id,
        memberName: newMember.name,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod || 'Bank Transfer',
        notes: `Initial pool deposit upon joining`,
      });
    }

    return newMember;
  };

  const deleteMember = async (id: string): Promise<void> => {
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated);
    await StorageService.saveMembers(updated);
  };

  const updateMember = async (id: string, updates: Partial<Member>): Promise<void> => {
    const updated = members.map((m) => (m.id === id ? { ...m, ...updates } : m));
    setMembers(updated);
    await StorageService.saveMembers(updated);
  };

  const updateSettings = async (newSettings: Partial<AppSettings>): Promise<void> => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await StorageService.saveSettings(updated);
  };

  const dismissAlert = async (id: string): Promise<void> => {
    const updated = alerts.filter((a) => a.id !== id);
    setAlerts(updated);
    await StorageService.saveAlerts(updated);
  };

  const markAlertsAsRead = async (): Promise<void> => {
    const updated = alerts.map((a) => ({ ...a, read: true }));
    setAlerts(updated);
    await StorageService.saveAlerts(updated);
  };

  const exportReport = async (
    format: ExportFormat,
    timeframe: ExportTimeframe,
    specificTransactionId?: string
  ): Promise<{ success: boolean; filePath?: string; uri?: string }> => {
    try {
      if (format === 'csv') {
        const { filePath } = await exportToCSV(
          transactions,
          settings,
          timeframe,
          specificTransactionId
        );
        return { success: true, filePath };
      } else {
        const { uri } = await exportToPDF(
          transactions,
          settings,
          timeframe,
          specificTransactionId
        );
        return { success: true, uri };
      }
    } catch (err) {
      console.error('Export error:', err);
      return { success: false };
    }
  };

  const resetToDefaults = async (): Promise<void> => {
    await StorageService.resetToDefaults();
    const [txs, mems, sets, alts] = await Promise.all([
      StorageService.loadTransactions(),
      StorageService.loadMembers(),
      StorageService.loadSettings(),
      StorageService.loadAlerts(),
    ]);
    setTransactions([...txs]);
    setMembers([...mems]);
    setSettings({ ...sets });
    setAlerts([...alts]);
  };

  const exportJSONBackup = async (): Promise<string> => {
    return StorageService.exportFullDatabaseJSON();
  };

  const importJSONBackup = async (json: string): Promise<boolean> => {
    const success = await StorageService.importFullDatabaseJSON(json);
    if (success) {
      const data = await StorageService.initialize();
      setTransactions(data.transactions);
      setMembers(data.members);
      setSettings(data.settings);
      setAlerts(data.alerts);
    }
    return success;
  };

  return (
    <PocketPoolContext.Provider
      value={{
        isLoading,
        isLocked,
        transactions,
        members,
        settings,
        alerts,
        budget,
        categorySummaries,
        memberSummaries,
        spendingTrend,
        unreadAlertsCount,
        unlockApp,
        lockApp,
        addTransaction,
        deleteTransaction,
        addMember,
        deleteMember,
        updateMember,
        updateSettings,
        dismissAlert,
        markAlertsAsRead,
        exportReport,
        resetToDefaults,
        exportJSONBackup,
        importJSONBackup,
      }}
    >
      {children}
    </PocketPoolContext.Provider>
  );
};

export const usePocketPool = (): PocketPoolContextType => {
  const context = useContext(PocketPoolContext);
  if (!context) {
    throw new Error('usePocketPool must be used within a PocketPoolProvider');
  }
  return context;
};
