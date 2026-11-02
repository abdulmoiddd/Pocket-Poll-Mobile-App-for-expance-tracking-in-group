/**
 * PocketPool Unified API Service Layer
 * 
 * Provides a standardized, typed API interface for all core PocketPool operations:
 * - Budget Pools management (CRUD & context switching)
 * - Transactions & Expenses (optimistic recording & filtering)
 * - Group Members management
 * - Application Settings & Preferences
 * - Real-time Cloud Synchronization & Offline Persistence
 * - Financial Calculations & Metric Summaries
 * - Report Generation (PDF invoices & CSV exports)
 * - Database Backup & Restoration
 */

import { StorageService } from './storage';
import { FirebaseService, sanitizeFirestorePayload } from './firebase';
import {
  calculateBudgetSummary,
  getCategorySummaries,
  getMemberContributionSummaries,
  getSpendingTrend,
} from './calculations';
import { exportToPDF, exportToCSV, generateCSV, generateInvoiceHTML } from './export';
import {
  BudgetPool,
  Transaction,
  Member,
  AppSettings,
  BudgetSummary,
  CategorySummary,
  MemberContributionSummary,
  SpendingTrendPoint,
  ExportTimeframe,
} from '../types';

export const PocketPoolApi = {
  // =========================================================================
  // BUDGET POOLS API
  // =========================================================================

  async getBudgets(): Promise<BudgetPool[]> {
    return await StorageService.loadPools();
  },

  async getActiveBudgetId(): Promise<string> {
    return await StorageService.loadActivePoolId();
  },

  async createBudget(name: string, description?: string, thresholdAmount: number = 200): Promise<BudgetPool> {
    const trimmed = name.trim();
    const newPool: BudgetPool = {
      id: `pool_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed || 'Untitled Budget',
      description: description?.trim() || undefined,
      createdAt: Date.now(),
      thresholdAmount,
    };

    const currentPools = await StorageService.loadPools();
    const updatedPools = [...currentPools, newPool];

    await StorageService.savePools(updatedPools);
    await StorageService.saveActivePoolId(newPool.id);

    FirebaseService.saveBudget(newPool).catch((err) => {
      console.warn('[PocketPoolApi] Background budget creation sync queued:', err);
    });

    return newPool;
  },

  async updateBudget(budgetId: string, updates: Partial<BudgetPool>): Promise<BudgetPool> {
    const currentPools = await StorageService.loadPools();
    const target = currentPools.find((p) => p.id === budgetId);
    if (!target) throw new Error(`Budget pool ${budgetId} not found.`);

    const updated = { ...target, ...updates };
    const updatedPools = currentPools.map((p) => (p.id === budgetId ? updated : p));

    await StorageService.savePools(updatedPools);

    FirebaseService.saveBudget(updated).catch((err) => {
      console.warn('[PocketPoolApi] Background budget update sync queued:', err);
    });

    return updated;
  },

  async deleteBudget(budgetId: string): Promise<void> {
    const currentPools = await StorageService.loadPools();
    if (currentPools.length <= 1) {
      throw new Error('Cannot delete the only remaining budget pool.');
    }

    const updatedPools = currentPools.filter((p) => p.id !== budgetId);
    const allTxs = await StorageService.loadTransactions();
    const updatedTxs = allTxs.filter((tx) => (tx.poolId || currentPools[0]?.id) !== budgetId);

    const currentActiveId = await StorageService.loadActivePoolId();
    let nextActiveId = currentActiveId;
    if (currentActiveId === budgetId) {
      nextActiveId = updatedPools[0].id;
      await StorageService.saveActivePoolId(nextActiveId);
    }

    await StorageService.savePools(updatedPools);
    await StorageService.saveTransactions(updatedTxs);

    FirebaseService.deleteBudget(budgetId).catch((err) => {
      console.warn('[PocketPoolApi] Background budget delete sync queued:', err);
    });
  },

  async switchBudget(budgetId: string): Promise<void> {
    const currentPools = await StorageService.loadPools();
    const target = currentPools.find((p) => p.id === budgetId);
    if (!target) throw new Error(`Budget pool ${budgetId} does not exist.`);
    await StorageService.saveActivePoolId(budgetId);
  },

  // =========================================================================
  // TRANSACTIONS API (Expenses & Deposits)
  // =========================================================================

  async getTransactions(budgetId?: string): Promise<Transaction[]> {
    const all = await StorageService.loadTransactions();
    if (!budgetId) return all;
    const currentPools = await StorageService.loadPools();
    const defaultPoolId = currentPools[0]?.id || 'pool_summer_trip';
    return all.filter((tx) => (tx.poolId || defaultPoolId) === budgetId);
  },

  async recordTransaction(
    txData: Omit<Transaction, 'id' | 'createdAt'>
  ): Promise<Transaction> {
    const activeId = txData.poolId || (await StorageService.loadActivePoolId());
    const newTransaction: Transaction = {
      ...txData,
      poolId: activeId,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now(),
      amount: Number(txData.amount) || 0,
    };

    const currentAll = await StorageService.loadTransactions();
    const updatedAll = [newTransaction, ...currentAll];

    await StorageService.saveTransactions(updatedAll);

    FirebaseService.saveTransaction(activeId, newTransaction).catch((err) => {
      console.warn('[PocketPoolApi] Background transaction sync queued:', err);
    });

    return newTransaction;
  },

  async deleteTransaction(transactionId: string): Promise<void> {
    const currentAll = await StorageService.loadTransactions();
    const targetTx = currentAll.find((t) => t.id === transactionId);
    const updated = currentAll.filter((t) => t.id !== transactionId);

    await StorageService.saveTransactions(updated);

    const budgetId = targetTx?.poolId || (await StorageService.loadActivePoolId());
    FirebaseService.deleteTransaction(budgetId, transactionId).catch((err) => {
      console.warn('[PocketPoolApi] Background transaction delete sync queued:', err);
    });
  },

  // =========================================================================
  // GROUP MEMBERS API
  // =========================================================================

  async getMembers(): Promise<Member[]> {
    return await StorageService.loadMembers();
  },

  async addMember(memberData: {
    name: string;
    email?: string;
    phone?: string;
    avatarColor?: string;
    initialDeposit?: number;
  }): Promise<Member> {
    const trimmedName = memberData.name.trim();
    if (!trimmedName) throw new Error('Member name is required.');

    const initials = trimmedName
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newMember: Member = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 3)}`,
      name: trimmedName,
      avatarColor: memberData.avatarColor || '#7B66FF',
      avatarText: initials || 'PP',
      email: memberData.email?.trim() || undefined,
      phone: memberData.phone?.trim() || undefined,
      totalContributed: memberData.initialDeposit && memberData.initialDeposit > 0 ? memberData.initialDeposit : 0,
      joinedAt: new Date().toISOString().split('T')[0],
    };

    const currentMembers = await StorageService.loadMembers();
    const updatedMembers = [...currentMembers, newMember];

    await StorageService.saveMembers(updatedMembers);

    FirebaseService.saveMember(newMember).catch((err) => {
      console.warn('[PocketPoolApi] Background member sync queued:', err);
    });

    if (memberData.initialDeposit && memberData.initialDeposit > 0) {
      await this.recordTransaction({
        type: 'contribution',
        amount: memberData.initialDeposit,
        memberId: newMember.id,
        memberName: newMember.name,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Bank Transfer',
        notes: 'Initial pool deposit upon joining',
      });
    }

    return newMember;
  },

  async deleteMember(memberId: string): Promise<void> {
    const currentMembers = await StorageService.loadMembers();
    const updated = currentMembers.filter((m) => m.id !== memberId);
    await StorageService.saveMembers(updated);

    FirebaseService.deleteMember(memberId).catch((err) => {
      console.warn('[PocketPoolApi] Background member delete sync queued:', err);
    });
  },

  // =========================================================================
  // SETTINGS API
  // =========================================================================

  async getSettings(): Promise<AppSettings> {
    return await StorageService.loadSettings();
  },

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    const current = await StorageService.loadSettings();
    const updated = { ...current, ...updates };

    await StorageService.saveSettings(updated);

    FirebaseService.saveSettings(updated).catch((err) => {
      console.warn('[PocketPoolApi] Background settings sync queued:', err);
    });

    return updated;
  },

  // =========================================================================
  // ANALYTICS & METRIC SUMMARIES API
  // =========================================================================

  async getBudgetSummary(budgetId?: string): Promise<BudgetSummary> {
    const targetBudgetId = budgetId || (await StorageService.loadActivePoolId());
    const txs = await this.getTransactions(targetBudgetId);
    const members = await this.getMembers();
    const settings = await this.getSettings();
    const pools = await this.getBudgets();
    const activePool = pools.find((p) => p.id === targetBudgetId);
    const threshold = activePool?.thresholdAmount || settings.thresholdAmount;

    return calculateBudgetSummary(txs, threshold, members);
  },

  async getCategoryBreakdown(budgetId?: string): Promise<CategorySummary[]> {
    const targetBudgetId = budgetId || (await StorageService.loadActivePoolId());
    const txs = await this.getTransactions(targetBudgetId);
    return getCategorySummaries(txs);
  },

  async getMemberShares(budgetId?: string): Promise<MemberContributionSummary[]> {
    const targetBudgetId = budgetId || (await StorageService.loadActivePoolId());
    const txs = await this.getTransactions(targetBudgetId);
    const members = await this.getMembers();
    return getMemberContributionSummaries(txs, members);
  },

  async getSpendingTrend(days: number = 7, budgetId?: string): Promise<SpendingTrendPoint[]> {
    const targetBudgetId = budgetId || (await StorageService.loadActivePoolId());
    const txs = await this.getTransactions(targetBudgetId);
    return getSpendingTrend(txs, days);
  },

  // =========================================================================
  // EXPORT & REPORTING API
  // =========================================================================

  async generatePdfReport(params: {
    timeframe: ExportTimeframe;
    budgetId?: string;
    singleTxId?: string;
  }): Promise<{ uri: string; html: string }> {
    const targetBudgetId = params.budgetId || (await StorageService.loadActivePoolId());
    const pools = await this.getBudgets();
    const activePool = pools.find((p) => p.id === targetBudgetId);
    const txs = await this.getTransactions(targetBudgetId);
    const settings = await this.getSettings();

    return await exportToPDF(
      txs,
      settings,
      params.timeframe,
      params.singleTxId,
      activePool?.name || settings.groupName
    );
  },

  async generateCsvReport(params: {
    timeframe: ExportTimeframe;
    budgetId?: string;
    singleTxId?: string;
  }): Promise<{ filePath: string; content: string }> {
    const targetBudgetId = params.budgetId || (await StorageService.loadActivePoolId());
    const txs = await this.getTransactions(targetBudgetId);
    const settings = await this.getSettings();

    return await exportToCSV(
      txs,
      settings,
      params.timeframe,
      params.singleTxId
    );
  },

  // =========================================================================
  // CLOUD SYNCHRONIZATION API
  // =========================================================================

  isSyncOnline(): boolean {
    return FirebaseService.isSyncEnabled();
  },

  async enableCloudSync(): Promise<void> {
    await FirebaseService.enableCloudSync();
  },

  async disableCloudSync(): Promise<void> {
    await FirebaseService.disableCloudSync();
  },

  async waitForSync(timeoutMs: number = 3000): Promise<boolean> {
    return await FirebaseService.waitForSync(timeoutMs);
  },

  async uploadLocalDataToCloud(): Promise<{ poolsCount: number; txCount: number; membersCount: number }> {
    const pools = await StorageService.loadPools();
    const allTransactions = await StorageService.loadTransactions();
    const members = await StorageService.loadMembers();
    const settings = await StorageService.loadSettings();

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
  },

  async downloadCloudDataToLocal(): Promise<{ poolsCount: number; txCount: number; membersCount: number }> {
    const cloudBudgets = await FirebaseService.getBudgetsOnce();
    const pools = cloudBudgets.length > 0 ? cloudBudgets : await StorageService.loadPools();

    const allDownloadedTxs: Transaction[] = [];
    for (const pool of pools) {
      const txs = await FirebaseService.getTransactionsOnce(pool.id);
      allDownloadedTxs.push(...txs);
    }

    const cloudMembers = await FirebaseService.getMembersOnce();
    const members = cloudMembers.length > 0 ? cloudMembers : await StorageService.loadMembers();

    const cloudSettings = await FirebaseService.getSettingsOnce();
    const settings = cloudSettings || (await StorageService.loadSettings());

    await StorageService.savePools(pools);
    await StorageService.saveTransactions(allDownloadedTxs);
    await StorageService.saveMembers(members);
    await StorageService.saveSettings(settings);

    return {
      poolsCount: pools.length,
      txCount: allDownloadedTxs.length,
      membersCount: members.length,
    };
  },

  sanitizePayload: sanitizeFirestorePayload,

  // =========================================================================
  // BACKUP & DATABASE MANAGEMENT API
  // =========================================================================

  async exportBackupJSON(): Promise<string> {
    return await StorageService.exportFullDatabaseJSON();
  },

  async importBackupJSON(jsonString: string): Promise<boolean> {
    return await StorageService.importFullDatabaseJSON(jsonString);
  },

  async resetDatabase(mode: 'zero' | 'demo' = 'zero'): Promise<void> {
    if (mode === 'zero') {
      await StorageService.resetToZero();
    } else {
      await StorageService.resetToDefaults();
    }
  },
};
