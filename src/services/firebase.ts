import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  memoryLocalCache,
  Firestore,
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  enableNetwork,
  disableNetwork,
  waitForPendingWrites,
  terminate,
  Unsubscribe,
  DocumentData,
  SnapshotMetadata,
} from 'firebase/firestore';
import { BudgetPool, Transaction, Member, AppSettings } from '../types';

/**
 * Standard Firebase Configuration Parameters extracted from google-services.json
 */
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyARNVG3qYy5EG6YkLcbRKeTJjCH7OZ3Khg',
  authDomain: 'pocket-pool-by-moid.firebaseapp.com',
  projectId: 'pocket-pool-by-moid',
  storageBucket: 'pocket-pool-by-moid.firebasestorage.app',
  messagingSenderId: '190036364480',
  appId: '1:190036364480:android:3a17cec463bc1b6b8e3125',
};

// Singleton App Instance
export const firebaseApp: FirebaseApp = !getApps().length
  ? initializeApp(FIREBASE_CONFIG)
  : getApp();

/**
 * Initialize Cloud Firestore with explicit Offline Persistence Layer enabled.
 * If indexedDB is unavailable (e.g. Node test environment), gracefully falls back to memory cache.
 */
function createFirestoreInstance(): Firestore {
  try {
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({}),
    });
  } catch {
    try {
      return initializeFirestore(firebaseApp, {
        localCache: memoryLocalCache(),
      });
    } catch {
      return getFirestore(firebaseApp);
    }
  }
}

export const db: Firestore = createFirestoreInstance();

// Track network / cloud sync state
let isCloudSyncActive = true;

/**
 * Firebase Cloud Firestore Service
 * Provides offline-first caching, real-time listeners, and cloud synchronization
 * for multiple budgets, sub-collection transactions, members, and settings.
 */
export const FirebaseService = {
  db,
  app: firebaseApp,

  /**
   * Check if cloud network sync is currently active
   */
  isSyncEnabled(): boolean {
    return isCloudSyncActive;
  },

  /**
   * Explicitly enable cloud network synchronization.
   * Flushes offline queued writes to Firebase Cloud and syncs remote changes.
   */
  async enableCloudSync(): Promise<void> {
    try {
      await enableNetwork(db);
      isCloudSyncActive = true;
    } catch (err) {
      console.warn('Failed to enable Firestore network:', err);
    }
  },

  /**
   * Explicitly disable cloud network synchronization.
   * Forces Firestore to operate purely in local cache offline mode.
   */
  async disableCloudSync(): Promise<void> {
    try {
      await disableNetwork(db);
      isCloudSyncActive = false;
    } catch (err) {
      console.warn('Failed to disable Firestore network:', err);
    }
  },

  /**
   * Waits until all locally queued writes have been synchronized to the cloud,
   * or until timeout occurs (safeguarding against network outages or unprovisioned cloud APIs).
   */
  async waitForSync(timeoutMs: number = 3000): Promise<boolean> {
    try {
      const waitPromise = waitForPendingWrites(db).then(() => true);
      const timeoutPromise = new Promise<boolean>((resolve) =>
        setTimeout(() => resolve(false), timeoutMs)
      );
      return await Promise.race([waitPromise, timeoutPromise]);
    } catch (err) {
      console.warn('waitForPendingWrites warning:', err);
      return false;
    }
  },

  /**
   * Terminate the Firestore database client and stop all network streams and workers.
   */
  async terminate(): Promise<void> {
    try {
      await terminate(db);
    } catch (err) {
      console.warn('Failed to terminate firestore instance:', err);
    }
  },

  // ==========================================
  // BUDGET POOLS (Collection: 'budgets')
  // ==========================================

  /**
   * Saves a budget pool document to the 'budgets' collection.
   * Queued instantly in offline cache and synced to cloud upon reconnection.
   */
  async saveBudget(budget: BudgetPool): Promise<void> {
    const budgetRef = doc(db, 'budgets', budget.id);
    await setDoc(budgetRef, {
      id: budget.id,
      name: budget.name,
      description: budget.description || '',
      createdAt: budget.createdAt || Date.now(),
      thresholdAmount: budget.thresholdAmount || 200,
      updatedAt: Date.now(),
    });
  },

  /**
   * Deletes a budget pool and its transactions sub-collection.
   */
  async deleteBudget(budgetId: string): Promise<void> {
    const txCol = collection(db, 'budgets', budgetId, 'transactions');
    try {
      const snap = await getDocs(txCol);
      for (const txDoc of snap.docs) {
        await deleteDoc(doc(db, 'budgets', budgetId, 'transactions', txDoc.id));
      }
    } catch {
      // Offline fallback
    }
    const budgetRef = doc(db, 'budgets', budgetId);
    await deleteDoc(budgetRef);
  },

  /**
   * Real-time listener for the 'budgets' collection.
   * Delivers instantaneous offline cached data, then updates in real-time from cloud.
   */
  subscribeToBudgets(
    callback: (budgets: BudgetPool[], isFromCache: boolean) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const budgetsQuery = query(collection(db, 'budgets'), orderBy('createdAt', 'asc'));
    return onSnapshot(
      budgetsQuery,
      (snapshot) => {
        const budgets: BudgetPool[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          budgets.push({
            id: docSnap.id,
            name: data.name,
            description: data.description,
            createdAt: data.createdAt,
            thresholdAmount: data.thresholdAmount,
          });
        });
        callback(budgets, snapshot.metadata.fromCache);
      },
      (error) => {
        if (onError) onError(error);
        else console.warn('Budgets onSnapshot listener error:', error);
      }
    );
  },

  async getBudgetsOnce(): Promise<BudgetPool[]> {
    const snap = await getDocs(query(collection(db, 'budgets'), orderBy('createdAt', 'asc')));
    const budgets: BudgetPool[] = [];
    snap.forEach((d) => {
      const data = d.data();
      budgets.push({
        id: d.id,
        name: data.name,
        description: data.description,
        createdAt: data.createdAt,
        thresholdAmount: data.thresholdAmount,
      });
    });
    return budgets;
  },

  // ==========================================
  // TRANSACTIONS (Sub-collection: 'budgets/{budgetId}/transactions')
  // ==========================================

  /**
   * Saves a transaction into the budget's 'transactions' sub-collection.
   * Maps cleanly to budgets/{budgetId}/transactions/{transactionId}
   */
  async saveTransaction(budgetId: string, transaction: Transaction): Promise<void> {
    const txRef = doc(db, 'budgets', budgetId, 'transactions', transaction.id);
    const payload: Record<string, any> = {
      id: transaction.id,
      poolId: budgetId,
      type: transaction.type,
      amount: Number(transaction.amount) || 0,
      memberId: transaction.memberId || '',
      memberName: transaction.memberName || '',
      date: transaction.date,
      paymentMethod: transaction.paymentMethod,
      notes: transaction.notes || '',
      createdAt: transaction.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    if (transaction.category) {
      payload.category = transaction.category;
    }
    if (transaction.receiptName) {
      payload.receiptName = transaction.receiptName;
    }
    if (transaction.receiptUri) {
      payload.receiptUri = transaction.receiptUri;
    }

    await setDoc(txRef, payload);
  },

  /**
   * Deletes a transaction document from the sub-collection.
   */
  async deleteTransaction(budgetId: string, transactionId: string): Promise<void> {
    const txRef = doc(db, 'budgets', budgetId, 'transactions', transactionId);
    await deleteDoc(txRef);
  },

  /**
   * Real-time listener for transactions of a specific budget pool.
   * Subscribes to budgets/{budgetId}/transactions in real-time.
   */
  subscribeToTransactions(
    budgetId: string,
    callback: (transactions: Transaction[], isFromCache: boolean) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const txQuery = query(
      collection(db, 'budgets', budgetId, 'transactions'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(
      txQuery,
      (snapshot) => {
        const txs: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          txs.push({
            id: docSnap.id,
            poolId: budgetId,
            type: data.type,
            amount: Number(data.amount) || 0,
            memberId: data.memberId,
            memberName: data.memberName,
            category: data.category,
            date: data.date,
            paymentMethod: data.paymentMethod,
            notes: data.notes,
            receiptName: data.receiptName,
            receiptUri: data.receiptUri,
            createdAt: data.createdAt,
          });
        });
        callback(txs, snapshot.metadata.fromCache);
      },
      (error) => {
        if (onError) onError(error);
        else console.warn(`Transactions onSnapshot error for budget ${budgetId}:`, error);
      }
    );
  },

  async getTransactionsOnce(budgetId: string): Promise<Transaction[]> {
    const snap = await getDocs(
      query(collection(db, 'budgets', budgetId, 'transactions'), orderBy('createdAt', 'desc'))
    );
    const txs: Transaction[] = [];
    snap.forEach((d) => {
      const data = d.data();
      txs.push({
        id: d.id,
        poolId: budgetId,
        type: data.type,
        amount: Number(data.amount) || 0,
        memberId: data.memberId,
        memberName: data.memberName,
        category: data.category,
        date: data.date,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        receiptName: data.receiptName,
        receiptUri: data.receiptUri,
        createdAt: data.createdAt,
      });
    });
    return txs;
  },

  // ==========================================
  // MEMBERS (Collection: 'members')
  // ==========================================

  async saveMember(member: Member): Promise<void> {
    const memberRef = doc(db, 'members', member.id);
    await setDoc(memberRef, {
      ...member,
      updatedAt: Date.now(),
    });
  },

  async deleteMember(memberId: string): Promise<void> {
    const memberRef = doc(db, 'members', memberId);
    await deleteDoc(memberRef);
  },

  subscribeToMembers(
    callback: (members: Member[], isFromCache: boolean) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const membersQuery = query(collection(db, 'members'), orderBy('joinedAt', 'asc'));
    return onSnapshot(
      membersQuery,
      (snapshot) => {
        const members: Member[] = [];
        snapshot.forEach((docSnap) => {
          members.push(docSnap.data() as Member);
        });
        callback(members, snapshot.metadata.fromCache);
      },
      (error) => {
        if (onError) onError(error);
        else console.warn('Members onSnapshot error:', error);
      }
    );
  },

  async getMembersOnce(): Promise<Member[]> {
    const snap = await getDocs(query(collection(db, 'members'), orderBy('joinedAt', 'asc')));
    const members: Member[] = [];
    snap.forEach((d) => members.push(d.data() as Member));
    return members;
  },

  // ==========================================
  // SETTINGS (Collection: 'settings/app_settings')
  // ==========================================

  async saveSettings(settings: AppSettings): Promise<void> {
    const settingsRef = doc(db, 'settings', 'app_settings');
    await setDoc(settingsRef, {
      ...settings,
      updatedAt: Date.now(),
    });
  },

  subscribeToSettings(
    callback: (settings: AppSettings, isFromCache: boolean) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const settingsRef = doc(db, 'settings', 'app_settings');
    return onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as AppSettings, snapshot.metadata.fromCache);
        }
      },
      (error) => {
        if (onError) onError(error);
        else console.warn('Settings onSnapshot error:', error);
      }
    );
  },

  async getSettingsOnce(): Promise<AppSettings | null> {
    const snapshot = await getDoc(doc(db, 'settings', 'app_settings'));
    if (snapshot.exists()) {
      return snapshot.data() as AppSettings;
    }
    return null;
  },
};
