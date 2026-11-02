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
  BudgetPool,
} from '../types';
import { StorageService, DEFAULT_SETTINGS, INITIAL_POOLS } from '../services/storage';
import { FirebaseService } from '../services/firebase';
import {
  calculateBudgetSummary,
  checkThresholdAlert,
  getCategorySummaries,
  getMemberContributionSummaries,
  getSpendingTrend,
} from '../services/calculations';
import { exportToCSV, exportToPDF } from '../services/export';
import { BiometricsService } from '../services/biometrics';
import { useToast } from './ToastContext';

interface PocketPoolContextType {
  // State
  isLoading: boolean;
  isLocked: boolean;
  isCloudSyncActive: boolean;
  pools: BudgetPool[];
  activePoolId: string;
  activePool: BudgetPool;
  allTransactions: Transaction[];
  transactions: Transaction[]; // Active pool's isolated transactions
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
  toggleCloudSync: () => Promise<void>;
  switchPool: (poolId: string) => Promise<void>;
  createPool: (name: string, description?: string) => Promise<BudgetPool>;
  deletePool: (poolId: string) => Promise<void>;
  renamePool: (poolId: string, newName: string) => Promise<void>;
  updatePool: (poolId: string, updates: Partial<BudgetPool>) => Promise<void>;
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
  resetToZero: () => Promise<void>;
  exportJSONBackup: () => Promise<string>;
  importJSONBackup: (json: string) => Promise<boolean>;
  uploadLocalDataToCloud: () => Promise<{ poolsCount: number; txCount: number; membersCount: number }>;
  downloadCloudDataToLocal: () => Promise<{ poolsCount: number; txCount: number; membersCount: number }>;
}

const PocketPoolContext = createContext<PocketPoolContextType | undefined>(undefined);

const MEMBER_COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#14B8A6'];

export const PocketPoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  let toastApi: ReturnType<typeof useToast>['toast'] | undefined;
  try {
    const t = useToast();
    toastApi = t.toast;
  } catch {
    // Graceful fallback if rendered without ToastProvider
  }

  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [isCloudSyncActive, setIsCloudSyncActive] = useState(true);
  const [pools, setPools] = useState<BudgetPool[]>(INITIAL_POOLS);
  const [activePoolId, setActivePoolId] = useState<string>(INITIAL_POOLS[0].id);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [alerts, setAlerts] = useState<ThresholdAlert[]>([]);

  // 1. Initialize data from local JSON storage first (instant offline availability)
  useEffect(() => {
    async function loadData() {
      try {
        const data = await StorageService.initialize();
        setPools(data.pools);
        setActivePoolId(data.activePoolId);
        setAllTransactions(data.transactions);
        setMembers(data.members);
        setSettings(data.settings);
        setAlerts(data.alerts);

        if (data.settings.biometricEnabled) {
          setIsLocked(true);
        }
      } catch (err) {
        console.error('Failed to initialize PocketPool local storage:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // 2. Set up Firestore Real-time Listeners (Budgets, Members, Settings)
  useEffect(() => {
    // Real-time listener for budgets collection
    const unsubBudgets = FirebaseService.subscribeToBudgets((cloudBudgets) => {
      if (cloudBudgets.length > 0) {
        setPools(cloudBudgets);
        StorageService.savePools(cloudBudgets);
      } else if (!isLoading && pools.length > 0) {
        // First sync to fresh Firestore: seed initial pools to cloud
        pools.forEach((p) => FirebaseService.saveBudget(p));
      }
    });

    // Real-time listener for members collection
    const unsubMembers = FirebaseService.subscribeToMembers((cloudMembers) => {
      if (cloudMembers.length > 0) {
        setMembers(cloudMembers);
        StorageService.saveMembers(cloudMembers);
      } else if (!isLoading && members.length > 0) {
        members.forEach((m) => FirebaseService.saveMember(m));
      }
    });

    // Real-time listener for settings document
    const unsubSettings = FirebaseService.subscribeToSettings((cloudSettings) => {
      if (cloudSettings) {
        setSettings((prev) => ({ ...prev, ...cloudSettings }));
        StorageService.saveSettings(cloudSettings);
      }
    });

    return () => {
      unsubBudgets();
      unsubMembers();
      unsubSettings();
    };
  }, [isLoading]);

  // 3. Set up Firestore Real-time Listener for Active Budget's Sub-collection Transactions
  useEffect(() => {
    if (!activePoolId) return;

    const unsubTxs = FirebaseService.subscribeToTransactions(activePoolId, (cloudTxs) => {
      if (cloudTxs.length > 0) {
        setAllTransactions((prev) => {
          // Replace or merge transactions for this pool
          const otherPoolsTxs = prev.filter((tx) => (tx.poolId || prev[0]?.poolId) !== activePoolId);
          const updated = [...cloudTxs, ...otherPoolsTxs];
          StorageService.saveTransactions(updated);
          return updated;
        });
      } else if (!isLoading) {
        // If local has transactions for this pool not yet in Firestore, queue them to Firestore
        const localTxs = allTransactions.filter(
          (tx) => (tx.poolId || pools[0]?.id) === activePoolId
        );
        if (localTxs.length > 0) {
          localTxs.forEach((tx) => FirebaseService.saveTransaction(activePoolId, tx));
        }
      }
    });

    return () => {
      unsubTxs();
    };
  }, [activePoolId, isLoading]);

  // Compute active budget pool object
  const activePool = useMemo<BudgetPool>(() => {
    const found = pools.find((p) => p.id === activePoolId);
    if (found) return found;
    if (pools.length > 0) return pools[0];
    return {
      id: 'pool_default',
      name: 'Main Budget',
      createdAt: Date.now(),
    };
  }, [pools, activePoolId]);

  // Compute transactions strictly isolated to the active budget pool (ZERO data bleed)
  const transactions = useMemo<Transaction[]>(() => {
    return allTransactions.filter((tx) => {
      const txPool = tx.poolId || pools[0]?.id || 'pool_summer_trip';
      return txPool === activePool.id;
    });
  }, [allTransactions, activePool.id, pools]);

  // Compute budget summary for active pool
  const budget = useMemo(() => {
    const threshold = activePool.thresholdAmount || settings.thresholdAmount;
    return calculateBudgetSummary(transactions, threshold, members);
  }, [transactions, activePool.thresholdAmount, settings.thresholdAmount, members]);

  // Compute category breakdown for active pool
  const categorySummaries = useMemo(() => {
    return getCategorySummaries(transactions);
  }, [transactions]);

  // Compute member contributions for active pool
  const memberSummaries = useMemo(() => {
    return getMemberContributionSummaries(transactions, members);
  }, [transactions, members]);

  // Compute spending trend (last 7 days) for active pool
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
   * Toggle between Cloud Sync enabled and pure local offline cache mode
   */
  const toggleCloudSync = async () => {
    if (isCloudSyncActive) {
      await FirebaseService.disableCloudSync();
      setIsCloudSyncActive(false);
      toastApi?.info('Offline Mode Active', 'Operating entirely from local Firestore cache.');
    } else {
      await FirebaseService.enableCloudSync();
      setIsCloudSyncActive(true);
      toastApi?.success('Cloud Sync Restored', 'Synchronizing with Firebase Cloud backend.');
    }
  };

  /**
   * Switch active budget pool
   */
  const switchPool = async (poolId: string) => {
    const targetPool = pools.find((p) => p.id === poolId);
    if (!targetPool) return;
    setActivePoolId(poolId);
    await StorageService.saveActivePoolId(poolId);
  };

  /**
   * Create a new budget pool and immediately sync to Firebase + local cache
   */
  const createPool = async (name: string, description?: string): Promise<BudgetPool> => {
    const trimmed = name.trim();
    const newPool: BudgetPool = {
      id: `pool_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed || 'Untitled Budget',
      description: description?.trim() || undefined,
      createdAt: Date.now(),
    };

    const updatedPools = [...pools, newPool];
    setPools(updatedPools);
    setActivePoolId(newPool.id);

    // Save to local JSON storage immediately for instant UI response
    await Promise.all([
      StorageService.savePools(updatedPools),
      StorageService.saveActivePoolId(newPool.id),
    ]);

    // Queue to Firebase in background (relies on Firestore offline persistence)
    FirebaseService.saveBudget(newPool).catch((err) => {
      console.warn('Background budget sync queued in offline persistence:', err);
    });

    return newPool;
  };

  /**
   * Update an existing budget pool in Firestore & local cache
   */
  const updatePool = async (poolId: string, updates: Partial<BudgetPool>) => {
    const updatedPools = pools.map((p) => (p.id === poolId ? { ...p, ...updates } : p));
    setPools(updatedPools);

    await StorageService.savePools(updatedPools);

    const target = updatedPools.find((p) => p.id === poolId);
    if (target) {
      FirebaseService.saveBudget(target).catch((err) => {
        console.warn('Background budget update sync queued in offline persistence:', err);
      });
    }
  };

  /**
   * Rename an existing budget pool
   */
  const renamePool = async (poolId: string, newName: string) => {
    await updatePool(poolId, { name: newName.trim() });
  };

  /**
   * Delete a budget pool. If active, switches to the next available pool.
   * At least one pool is always retained.
   */
  const deletePool = async (poolId: string) => {
    if (pools.length <= 1) {
      throw new Error('Cannot delete the only budget pool.');
    }

    const updatedPools = pools.filter((p) => p.id !== poolId);
    const updatedTxs = allTransactions.filter((tx) => (tx.poolId || pools[0]?.id) !== poolId);

    setPools(updatedPools);
    setAllTransactions(updatedTxs);

    let nextActiveId = activePoolId;
    if (activePoolId === poolId) {
      nextActiveId = updatedPools[0].id;
      setActivePoolId(nextActiveId);
    }

    await Promise.all([
      StorageService.savePools(updatedPools),
      StorageService.saveTransactions(updatedTxs),
      StorageService.saveActivePoolId(nextActiveId),
    ]);

    FirebaseService.deleteBudget(poolId).catch((err) => {
      console.warn('Background budget deletion queued in offline persistence:', err);
    });
  };

  /**
   * Adds transaction (contribution or expense) attributed to active pool
   * Immediately updates local JSON state and UI optimistically without blocking.
   * Syncs payload to Firestore in the background using offline persistence.
   */
  const addTransaction = async (
    txData: Omit<Transaction, 'id' | 'createdAt'>
  ): Promise<Transaction> => {
    const previousBudget = budget.remainingBudget;

    const newTransaction: Transaction = {
      ...txData,
      poolId: txData.poolId || activePool.id,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now(),
      amount: Number(txData.amount) || 0,
    };

    const updatedAll = [newTransaction, ...allTransactions];
    setAllTransactions(updatedAll);

    // Save to local JSON storage immediately (instant offline durability)
    await StorageService.saveTransactions(updatedAll);

    // Queue to Firebase in background without blocking caller or UI thread
    FirebaseService.saveTransaction(newTransaction.poolId || activePool.id, newTransaction).catch(
      (err) => {
        console.warn('Background transaction sync queued in offline persistence:', err);
      }
    );

    // Calculate updated budget for active pool
    const updatedActiveTxs = [newTransaction, ...transactions];
    const newBudgetSummary = calculateBudgetSummary(
      updatedActiveTxs,
      activePool.thresholdAmount || settings.thresholdAmount,
      members
    );

    // Check threshold alert trigger
    const alertCheck = checkThresholdAlert(
      previousBudget,
      newBudgetSummary.remainingBudget,
      activePool.thresholdAmount || settings.thresholdAmount,
      settings.currencySymbol
    );

    if (alertCheck.shouldTrigger) {
      const newAlert: ThresholdAlert = {
        id: `alert_${Date.now()}`,
        timestamp: Date.now(),
        remainingBudget: newBudgetSummary.remainingBudget,
        threshold: activePool.thresholdAmount || settings.thresholdAmount,
        read: false,
        message: `[${activePool.name}] ${alertCheck.message}`,
      };
      const updatedAlerts = [newAlert, ...alerts];
      setAlerts(updatedAlerts);
      await StorageService.saveAlerts(updatedAlerts);

      // Trigger interactive toaster notification on mobile
      if (toastApi) {
        if (alertCheck.alertType === 'danger') {
          toastApi.danger(`🚨 ${activePool.name}: Deficit Alert!`, alertCheck.message, {
            actionText: 'Review Pool',
            duration: 6000,
          });
        } else {
          toastApi.warning(`⚠️ ${activePool.name}: Low Budget!`, alertCheck.message, {
            actionText: 'Settings',
            duration: 5000,
          });
        }
      }
    }

    return newTransaction;
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    const targetTx = allTransactions.find((t) => t.id === id);
    const updated = allTransactions.filter((t) => t.id !== id);
    setAllTransactions(updated);

    const budgetId = targetTx?.poolId || activePool.id;
    await StorageService.saveTransactions(updated);

    // Background sync deletion to Firebase
    FirebaseService.deleteTransaction(budgetId, id).catch((err) => {
      console.warn('Background transaction deletion queued in offline persistence:', err);
    });
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
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      totalContributed: initialDeposit && initialDeposit > 0 ? initialDeposit : 0,
      joinedAt: new Date().toISOString().split('T')[0],
    };

    const updated = [...members, newMember];
    setMembers(updated);

    // Save to local storage immediately
    await StorageService.saveMembers(updated);

    // Background sync to Firebase
    FirebaseService.saveMember(newMember).catch((err) => {
      console.warn('Background member sync queued in offline persistence:', err);
    });

    // If an initial deposit was specified, automatically record contribution into active pool
    if (initialDeposit && initialDeposit > 0) {
      await addTransaction({
        poolId: activePool.id,
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
    FirebaseService.deleteMember(id).catch((err) => {
      console.warn('Background member deletion queued in offline persistence:', err);
    });
  };

  const updateMember = async (id: string, updates: Partial<Member>): Promise<void> => {
    const updated = members.map((m) => (m.id === id ? { ...m, ...updates } : m));
    setMembers(updated);
    await StorageService.saveMembers(updated);
    const target = updated.find((m) => m.id === id);
    if (target) {
      FirebaseService.saveMember(target).catch((err) => {
        console.warn('Background member update queued in offline persistence:', err);
      });
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>): Promise<void> => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await StorageService.saveSettings(updated);
    FirebaseService.saveSettings(updated).catch((err) => {
      console.warn('Background settings sync queued in offline persistence:', err);
    });
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
      const poolName = activePool?.name || settings.groupName;
      if (format === 'csv') {
        const { filePath } = await exportToCSV(
          transactions,
          settings,
          timeframe,
          specificTransactionId,
          poolName
        );
        return { success: true, filePath };
      } else {
        const { uri } = await exportToPDF(
          transactions,
          settings,
          timeframe,
          specificTransactionId,
          poolName
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
    const data = await StorageService.initialize();
    setPools(data.pools);
    setActivePoolId(data.activePoolId);
    setAllTransactions([...data.transactions]);
    setMembers([...data.members]);
    setSettings({ ...data.settings });
    setAlerts([...data.alerts]);

    // Reseed Firestore
    data.pools.forEach((p) => FirebaseService.saveBudget(p));
    data.members.forEach((m) => FirebaseService.saveMember(m));
    data.transactions.forEach((tx) => FirebaseService.saveTransaction(tx.poolId || 'pool_summer_trip', tx));
  };

  const resetToZero = async (): Promise<void> => {
    await StorageService.resetToZero();
    const data = await StorageService.initialize();
    setPools(data.pools);
    setActivePoolId(data.activePoolId);
    setAllTransactions([]);
    setMembers([]);
    setSettings({ ...DEFAULT_SETTINGS, activePoolId: data.activePoolId });
    setAlerts([]);
  };

  const exportJSONBackup = async (): Promise<string> => {
    return StorageService.exportFullDatabaseJSON();
  };

  const importJSONBackup = async (json: string): Promise<boolean> => {
    const success = await StorageService.importFullDatabaseJSON(json);
    if (success) {
      const data = await StorageService.initialize();
      setPools(data.pools);
      setActivePoolId(data.activePoolId);
      setAllTransactions(data.transactions);
      setMembers(data.members);
      setSettings(data.settings);
      setAlerts(data.alerts);

      // Sync imported backup into Firestore
      data.pools.forEach((p) => FirebaseService.saveBudget(p));
      data.members.forEach((m) => FirebaseService.saveMember(m));
      data.transactions.forEach((tx) => FirebaseService.saveTransaction(tx.poolId || 'pool_summer_trip', tx));
    }
    return success;
  };

  /**
   * Explicitly uploads all local device data (pools, transactions, members, settings) to Firebase Cloud Firestore
   */
  const uploadLocalDataToCloud = async (): Promise<{
    poolsCount: number;
    txCount: number;
    membersCount: number;
  }> => {
    let poolsCount = 0;
    let txCount = 0;
    let membersCount = 0;

    for (const pool of pools) {
      await FirebaseService.saveBudget(pool);
      poolsCount++;
    }

    for (const tx of allTransactions) {
      const pId = tx.poolId || pools[0]?.id || 'pool_summer_trip';
      await FirebaseService.saveTransaction(pId, tx);
      txCount++;
    }

    for (const member of members) {
      await FirebaseService.saveMember(member);
      membersCount++;
    }

    await FirebaseService.saveSettings(settings);

    return { poolsCount, txCount, membersCount };
  };

  /**
   * Explicitly downloads all cloud data from Firebase Cloud Firestore and updates local device storage & UI state
   */
  const downloadCloudDataToLocal = async (): Promise<{
    poolsCount: number;
    txCount: number;
    membersCount: number;
  }> => {
    const cloudBudgets = await FirebaseService.getBudgetsOnce();
    const finalPools = cloudBudgets.length > 0 ? cloudBudgets : pools;

    const allDownloadedTxs: Transaction[] = [];
    for (const pool of finalPools) {
      const txs = await FirebaseService.getTransactionsOnce(pool.id);
      allDownloadedTxs.push(...txs);
    }

    const cloudMembers = await FirebaseService.getMembersOnce();
    const finalMembers = cloudMembers.length > 0 ? cloudMembers : members;

    const cloudSettings = await FirebaseService.getSettingsOnce();
    const finalSettings = cloudSettings || settings;

    // Update state
    setPools(finalPools);
    setAllTransactions(allDownloadedTxs);
    setMembers(finalMembers);
    setSettings(finalSettings);

    // Save to local storage
    await StorageService.savePools(finalPools);
    await StorageService.saveTransactions(allDownloadedTxs);
    await StorageService.saveMembers(finalMembers);
    await StorageService.saveSettings(finalSettings);

    return {
      poolsCount: finalPools.length,
      txCount: allDownloadedTxs.length,
      membersCount: finalMembers.length,
    };
  };

  return (
    <PocketPoolContext.Provider
      value={{
        isLoading,
        isLocked,
        isCloudSyncActive,
        pools,
        activePoolId,
        activePool,
        allTransactions,
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
        toggleCloudSync,
        switchPool,
        createPool,
        deletePool,
        renamePool,
        updatePool,
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
        resetToZero,
        exportJSONBackup,
        importJSONBackup,
        uploadLocalDataToCloud,
        downloadCloudDataToLocal,
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
