import { BudgetPool, Transaction, Member, AppSettings } from '../types';

/**
 * Standard Firebase Realtime Database Configuration Parameters
 * Extracted from google-services.json (Spark Free Tier - No Paid Account Required)
 */
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyARNVG3qYy5EG6YkLcbRKeTJjCH7OZ3Khg',
  authDomain: 'pocket-pool-by-moid.firebaseapp.com',
  databaseURL: 'https://pocket-pool-by-moid-default-rtdb.firebaseio.com',
  projectId: 'pocket-pool-by-moid',
  storageBucket: 'pocket-pool-by-moid.firebasestorage.app',
  messagingSenderId: '190036364480',
  appId: '1:190036364480:android:3a17cec463bc1b6b8e3125',
};

// Cloud sync network flag
let isCloudSyncActive = true;

// Active subscription listeners
type Listener<T> = (data: T, isFromCache: boolean) => void;
const budgetListeners = new Set<Listener<BudgetPool[]>>();
const transactionListeners = new Map<string, Set<Listener<Transaction[]>>>();
const memberListeners = new Set<Listener<Member[]>>();
const settingsListeners = new Set<Listener<AppSettings>>();

// In-Memory Offline Cache & Persistence Layer (Free Tier Offline-First)
const localCache = {
  budgets: new Map<string, BudgetPool>(),
  transactions: new Map<string, Map<string, Transaction>>(), // budgetId -> (txId -> tx)
  members: new Map<string, Member>(),
  settings: null as AppSettings | null,
};

// Pending Offline Write Queue
interface PendingWrite {
  type: 'save_budget' | 'delete_budget' | 'save_tx' | 'delete_tx' | 'save_member' | 'delete_member' | 'save_settings';
  budgetId?: string;
  txId?: string;
  memberId?: string;
  payload?: any;
}
let pendingQueue: PendingWrite[] = [];

/**
 * Recursively sanitizes data payloads:
 * - Strips undefined values to prevent JSON serialization errors.
 * - Safely converts empty strings for optional fields to null.
 */
export function sanitizeFirestorePayload<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    } else if (value === null) {
      result[key] = null;
    } else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = sanitizeFirestorePayload(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
export const sanitizePayload = sanitizeFirestorePayload;

/**
 * Helper to make network requests with timeout to Firebase Realtime Database REST API.
 * Never throws unhandled exceptions; fails gracefully to protect offline operation.
 */
async function firebaseFetch(path: string, options: { method?: string; body?: any; timeoutMs?: number } = {}): Promise<any> {
  if (!isCloudSyncActive) {
    return null;
  }

  const url = `${FIREBASE_CONFIG.databaseURL}/${path}.json`;
  const timeoutMs = options.timeoutMs ?? 3500;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller?.signal,
    };
    if (options.body !== undefined) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const res = await fetch(url, fetchOptions);
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch (err) {
    // Offline or network timeout - fail gracefully without throwing
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Flushes offline queued writes to Firebase Realtime Database
 */
async function flushPendingWrites(): Promise<void> {
  if (!isCloudSyncActive || pendingQueue.length === 0) return;

  const currentBatch = [...pendingQueue];
  pendingQueue = [];

  for (const item of currentBatch) {
    try {
      switch (item.type) {
        case 'save_budget':
          await firebaseFetch(`budgets/${item.budgetId}`, { method: 'PUT', body: item.payload });
          break;
        case 'delete_budget':
          await firebaseFetch(`budgets/${item.budgetId}`, { method: 'DELETE' });
          await firebaseFetch(`transactions/${item.budgetId}`, { method: 'DELETE' });
          break;
        case 'save_tx':
          await firebaseFetch(`transactions/${item.budgetId}/${item.txId}`, { method: 'PUT', body: item.payload });
          break;
        case 'delete_tx':
          await firebaseFetch(`transactions/${item.budgetId}/${item.txId}`, { method: 'DELETE' });
          break;
        case 'save_member':
          await firebaseFetch(`members/${item.memberId}`, { method: 'PUT', body: item.payload });
          break;
        case 'delete_member':
          await firebaseFetch(`members/${item.memberId}`, { method: 'DELETE' });
          break;
        case 'save_settings':
          await firebaseFetch('settings', { method: 'PUT', body: item.payload });
          break;
      }
    } catch {
      // Re-queue if write failed
      pendingQueue.push(item);
    }
  }
}

/**
 * Firebase Realtime Database Service (100% Free Tier - No Paid Account Needed)
 * Provides offline-first local caching, zero-IndexedDB dependency, and cloud sync.
 */
export const FirebaseService = {
  db: { name: 'pocket-pool-rtdb', url: FIREBASE_CONFIG.databaseURL },
  app: { name: '[DEFAULT]', options: FIREBASE_CONFIG },

  isSyncEnabled(): boolean {
    return isCloudSyncActive;
  },

  async enableCloudSync(): Promise<void> {
    isCloudSyncActive = true;
    await flushPendingWrites();
  },

  async disableCloudSync(): Promise<void> {
    isCloudSyncActive = false;
  },

  async waitForSync(timeoutMs: number = 3000): Promise<boolean> {
    const start = Date.now();
    while (pendingQueue.length > 0 && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 50));
    }
    return pendingQueue.length === 0;
  },

  async terminate(): Promise<void> {
    budgetListeners.clear();
    transactionListeners.clear();
    memberListeners.clear();
    settingsListeners.clear();
  },

  // ==========================================
  // BUDGET POOLS
  // ==========================================

  async saveBudget(budget: BudgetPool): Promise<void> {
    const payload = sanitizeFirestorePayload({
      id: budget.id,
      name: budget.name,
      description: budget.description?.trim() || null,
      createdAt: budget.createdAt || Date.now(),
      thresholdAmount: budget.thresholdAmount ?? 200,
      updatedAt: Date.now(),
    });

    localCache.budgets.set(budget.id, {
      id: payload.id,
      name: payload.name,
      description: payload.description,
      createdAt: payload.createdAt,
      thresholdAmount: payload.thresholdAmount,
    });

    if (isCloudSyncActive) {
      firebaseFetch(`budgets/${budget.id}`, { method: 'PUT', body: payload }).catch(() => {
        pendingQueue.push({ type: 'save_budget', budgetId: budget.id, payload });
      });
    } else {
      pendingQueue.push({ type: 'save_budget', budgetId: budget.id, payload });
    }

    const allBudgets = Array.from(localCache.budgets.values());
    budgetListeners.forEach((fn) => fn(allBudgets, !isCloudSyncActive));
  },

  async deleteBudget(budgetId: string): Promise<void> {
    localCache.budgets.delete(budgetId);
    localCache.transactions.delete(budgetId);

    if (isCloudSyncActive) {
      firebaseFetch(`budgets/${budgetId}`, { method: 'DELETE' });
      firebaseFetch(`transactions/${budgetId}`, { method: 'DELETE' });
    } else {
      pendingQueue.push({ type: 'delete_budget', budgetId });
    }

    const allBudgets = Array.from(localCache.budgets.values());
    budgetListeners.forEach((fn) => fn(allBudgets, !isCloudSyncActive));
  },

  subscribeToBudgets(
    callback: (budgets: BudgetPool[], isFromCache: boolean) => void,
    _onError?: (error: Error) => void
  ): () => void {
    budgetListeners.add(callback);
    callback(Array.from(localCache.budgets.values()), !isCloudSyncActive);

    // Initial background cloud fetch if online
    if (isCloudSyncActive) {
      this.getBudgetsOnce().then((cloudBudgets) => {
        if (cloudBudgets.length > 0) {
          callback(cloudBudgets, false);
        }
      }).catch(() => {});
    }

    return () => {
      budgetListeners.delete(callback);
    };
  },

  async getBudgetsOnce(): Promise<BudgetPool[]> {
    if (isCloudSyncActive) {
      const data = await firebaseFetch('budgets');
      if (data && typeof data === 'object') {
        const budgets: BudgetPool[] = Array.isArray(data)
          ? data.filter(Boolean)
          : Object.values(data);
        budgets.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        budgets.forEach((b) => localCache.budgets.set(b.id, b));
        return budgets;
      }
    }
    return Array.from(localCache.budgets.values());
  },

  // ==========================================
  // TRANSACTIONS
  // ==========================================

  async saveTransaction(budgetId: string, transaction: Transaction): Promise<void> {
    const payload = sanitizeFirestorePayload({
      id: transaction.id,
      poolId: budgetId,
      type: transaction.type,
      amount: Number(transaction.amount) || 0,
      memberId: transaction.memberId || '',
      memberName: transaction.memberName || '',
      date: transaction.date || new Date().toISOString().split('T')[0],
      paymentMethod: transaction.paymentMethod || 'Cash',
      notes: transaction.notes || '',
      category: transaction.category || null,
      receiptName: transaction.receiptName || null,
      receiptUri: transaction.receiptUri || null,
      createdAt: transaction.createdAt || Date.now(),
      updatedAt: Date.now(),
    });

    if (!localCache.transactions.has(budgetId)) {
      localCache.transactions.set(budgetId, new Map());
    }
    const poolTxMap = localCache.transactions.get(budgetId)!;
    poolTxMap.set(transaction.id, { ...transaction, poolId: budgetId });

    if (isCloudSyncActive) {
      firebaseFetch(`transactions/${budgetId}/${transaction.id}`, { method: 'PUT', body: payload }).catch(() => {
        pendingQueue.push({ type: 'save_tx', budgetId, txId: transaction.id, payload });
      });
    } else {
      pendingQueue.push({ type: 'save_tx', budgetId, txId: transaction.id, payload });
    }

    const listeners = transactionListeners.get(budgetId);
    if (listeners) {
      const allTxs = Array.from(poolTxMap.values());
      listeners.forEach((fn) => fn(allTxs, !isCloudSyncActive));
    }
  },

  async deleteTransaction(budgetId: string, transactionId: string): Promise<void> {
    const poolTxMap = localCache.transactions.get(budgetId);
    if (poolTxMap) {
      poolTxMap.delete(transactionId);
    }

    if (isCloudSyncActive) {
      firebaseFetch(`transactions/${budgetId}/${transactionId}`, { method: 'DELETE' });
    } else {
      pendingQueue.push({ type: 'delete_tx', budgetId, txId: transactionId });
    }

    const listeners = transactionListeners.get(budgetId);
    if (listeners && poolTxMap) {
      const allTxs = Array.from(poolTxMap.values());
      listeners.forEach((fn) => fn(allTxs, !isCloudSyncActive));
    }
  },

  subscribeToTransactions(
    budgetId: string,
    callback: (transactions: Transaction[], isFromCache: boolean) => void,
    _onError?: (error: Error) => void
  ): () => void {
    if (!transactionListeners.has(budgetId)) {
      transactionListeners.set(budgetId, new Set());
    }
    const set = transactionListeners.get(budgetId)!;
    set.add(callback);

    const cached = localCache.transactions.get(budgetId);
    callback(cached ? Array.from(cached.values()) : [], !isCloudSyncActive);

    if (isCloudSyncActive) {
      this.getTransactionsOnce(budgetId).then((cloudTxs) => {
        if (cloudTxs.length > 0) {
          callback(cloudTxs, false);
        }
      }).catch(() => {});
    }

    return () => {
      set.delete(callback);
    };
  },

  async getTransactionsOnce(budgetId: string): Promise<Transaction[]> {
    if (isCloudSyncActive) {
      const data = await firebaseFetch(`transactions/${budgetId}`);
      if (data && typeof data === 'object') {
        const txs: Transaction[] = Array.isArray(data)
          ? data.filter(Boolean)
          : Object.values(data);
        txs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        if (!localCache.transactions.has(budgetId)) {
          localCache.transactions.set(budgetId, new Map());
        }
        const poolMap = localCache.transactions.get(budgetId)!;
        txs.forEach((t) => poolMap.set(t.id, t));

        return txs;
      }
    }
    const cached = localCache.transactions.get(budgetId);
    return cached ? Array.from(cached.values()) : [];
  },

  // ==========================================
  // MEMBERS
  // ==========================================

  async saveMember(member: Member): Promise<void> {
    const payload = sanitizeFirestorePayload({
      id: member.id,
      name: member.name || '',
      avatarColor: member.avatarColor || '#7B66FF',
      avatarText: member.avatarText || 'PP',
      email: member.email?.trim() || null,
      phone: member.phone?.trim() || null,
      totalContributed: Number(member.totalContributed) || 0,
      joinedAt: member.joinedAt || new Date().toISOString().split('T')[0],
      updatedAt: Date.now(),
    });

    localCache.members.set(member.id, payload as Member);

    if (isCloudSyncActive) {
      firebaseFetch(`members/${member.id}`, { method: 'PUT', body: payload }).catch(() => {
        pendingQueue.push({ type: 'save_member', memberId: member.id, payload });
      });
    } else {
      pendingQueue.push({ type: 'save_member', memberId: member.id, payload });
    }

    const allMembers = Array.from(localCache.members.values());
    memberListeners.forEach((fn) => fn(allMembers, !isCloudSyncActive));
  },

  async deleteMember(memberId: string): Promise<void> {
    localCache.members.delete(memberId);

    if (isCloudSyncActive) {
      firebaseFetch(`members/${memberId}`, { method: 'DELETE' });
    } else {
      pendingQueue.push({ type: 'delete_member', memberId });
    }

    const allMembers = Array.from(localCache.members.values());
    memberListeners.forEach((fn) => fn(allMembers, !isCloudSyncActive));
  },

  subscribeToMembers(
    callback: (members: Member[], isFromCache: boolean) => void,
    _onError?: (error: Error) => void
  ): () => void {
    memberListeners.add(callback);
    callback(Array.from(localCache.members.values()), !isCloudSyncActive);

    if (isCloudSyncActive) {
      this.getMembersOnce().then((cloudMembers) => {
        if (cloudMembers.length > 0) {
          callback(cloudMembers, false);
        }
      }).catch(() => {});
    }

    return () => {
      memberListeners.delete(callback);
    };
  },

  async getMembersOnce(): Promise<Member[]> {
    if (isCloudSyncActive) {
      const data = await firebaseFetch('members');
      if (data && typeof data === 'object') {
        const members: Member[] = Array.isArray(data)
          ? data.filter(Boolean)
          : Object.values(data);
        members.forEach((m) => localCache.members.set(m.id, m));
        return members;
      }
    }
    return Array.from(localCache.members.values());
  },

  // ==========================================
  // SETTINGS
  // ==========================================

  async saveSettings(settings: AppSettings): Promise<void> {
    const payload = sanitizeFirestorePayload({
      currencySymbol: settings.currencySymbol || '$',
      currencyCode: settings.currencyCode || 'USD',
      groupName: settings.groupName || 'PocketPool',
      thresholdAmount: settings.thresholdAmount ?? 200,
      biometricEnabled: !!settings.biometricEnabled,
      pinCode: settings.pinCode || '1234',
      activePoolId: settings.activePoolId || null,
      isFirstLaunch: !!settings.isFirstLaunch,
      updatedAt: Date.now(),
    });

    localCache.settings = payload as AppSettings;

    if (isCloudSyncActive) {
      firebaseFetch('settings', { method: 'PUT', body: payload }).catch(() => {
        pendingQueue.push({ type: 'save_settings', payload });
      });
    } else {
      pendingQueue.push({ type: 'save_settings', payload });
    }

    settingsListeners.forEach((fn) => fn(payload as AppSettings, !isCloudSyncActive));
  },

  subscribeToSettings(
    callback: (settings: AppSettings, isFromCache: boolean) => void,
    _onError?: (error: Error) => void
  ): () => void {
    settingsListeners.add(callback);
    if (localCache.settings) {
      callback(localCache.settings, !isCloudSyncActive);
    }

    if (isCloudSyncActive) {
      this.getSettingsOnce().then((cloudSettings) => {
        if (cloudSettings) {
          callback(cloudSettings, false);
        }
      }).catch(() => {});
    }

    return () => {
      settingsListeners.delete(callback);
    };
  },

  async getSettingsOnce(): Promise<AppSettings | null> {
    if (isCloudSyncActive) {
      const data = await firebaseFetch('settings');
      if (data && typeof data === 'object') {
        localCache.settings = data as AppSettings;
        return data as AppSettings;
      }
    }
    return localCache.settings;
  },
};
