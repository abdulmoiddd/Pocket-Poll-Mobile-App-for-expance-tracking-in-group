import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Member, AppSettings, ThresholdAlert } from '../types';
import { SAMPLE_RECEIPT_IMAGE_URI } from './receiptSamples';

const STORAGE_KEYS = {
  TRANSACTIONS: '@pocketpool_transactions_v2',
  MEMBERS: '@pocketpool_members_v2',
  SETTINGS: '@pocketpool_settings_v2',
  ALERTS: '@pocketpool_alerts_v2',
  INITIALIZED: '@pocketpool_initialized_v2',
};

export const DEFAULT_SETTINGS: AppSettings = {
  currencySymbol: '$',
  currencyCode: 'USD',
  thresholdAmount: 300,
  thresholdType: 'amount',
  biometricEnabled: false,
  pinCode: '1234',
  groupName: 'Summer Trip Pool 2026',
  isFirstLaunch: true,
};

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem_1',
    name: 'Alex Rivera',
    avatarColor: '#6366F1',
    avatarText: 'AR',
    email: 'alex@pocketpool.app',
    totalContributed: 800,
    joinedAt: '2026-10-01',
  },
  {
    id: 'mem_2',
    name: 'Sarah Chen',
    avatarColor: '#EC4899',
    avatarText: 'SC',
    email: 'sarah@pocketpool.app',
    totalContributed: 750,
    joinedAt: '2026-10-01',
  },
  {
    id: 'mem_3',
    name: 'David Miller',
    avatarColor: '#10B981',
    avatarText: 'DM',
    email: 'david@pocketpool.app',
    totalContributed: 650,
    joinedAt: '2026-10-02',
  },
  {
    id: 'mem_4',
    name: 'Emma Watson',
    avatarColor: '#F59E0B',
    avatarText: 'EW',
    email: 'emma@pocketpool.app',
    totalContributed: 600,
    joinedAt: '2026-10-03',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Contributions totaling $2,800
  {
    id: 'tx_c1',
    type: 'contribution',
    amount: 800,
    memberId: 'mem_1',
    memberName: 'Alex Rivera',
    date: '2026-10-15',
    paymentMethod: 'Bank Transfer',
    notes: 'Initial trip pool contribution',
    createdAt: Date.now() - 13 * 86400000,
  },
  {
    id: 'tx_c2',
    type: 'contribution',
    amount: 750,
    memberId: 'mem_2',
    memberName: 'Sarah Chen',
    date: '2026-10-16',
    paymentMethod: 'Digital Wallet',
    notes: 'Pool contribution via Apple Pay',
    createdAt: Date.now() - 12 * 86400000,
  },
  {
    id: 'tx_c3',
    type: 'contribution',
    amount: 650,
    memberId: 'mem_3',
    memberName: 'David Miller',
    date: '2026-10-17',
    paymentMethod: 'Credit Card',
    notes: 'Cabin deposit contribution',
    createdAt: Date.now() - 11 * 86400000,
  },
  {
    id: 'tx_c4',
    type: 'contribution',
    amount: 600,
    memberId: 'mem_4',
    memberName: 'Emma Watson',
    date: '2026-10-18',
    paymentMethod: 'Bank Transfer',
    notes: 'Group fund share',
    createdAt: Date.now() - 10 * 86400000,
  },

  // Expenses totaling $1,850 (Balance: $950)
  {
    id: 'tx_e1',
    type: 'expense',
    amount: 620,
    memberId: 'mem_1',
    memberName: 'Alex Rivera',
    category: 'Bills',
    date: '2026-10-20',
    paymentMethod: 'Credit Card',
    notes: 'Villa accommodation deposit',
    receiptName: 'villa_reservation.pdf',
    createdAt: Date.now() - 8 * 86400000,
  },
  {
    id: 'tx_e2',
    type: 'expense',
    amount: 340,
    memberId: 'mem_2',
    memberName: 'Sarah Chen',
    category: 'Food',
    date: '2026-10-22',
    paymentMethod: 'Debit Card',
    notes: 'Group gourmet dinner & wine',
    receiptName: 'seaside_bistro_receipt.png',
    receiptUri: SAMPLE_RECEIPT_IMAGE_URI,
    createdAt: Date.now() - 6 * 86400000,
  },
  {
    id: 'tx_e3',
    type: 'expense',
    amount: 280,
    memberId: 'mem_3',
    memberName: 'David Miller',
    category: 'Transport',
    date: '2026-10-24',
    paymentMethod: 'Credit Card',
    notes: 'Rental minivan & gas fill-up',
    createdAt: Date.now() - 4 * 86400000,
  },
  {
    id: 'tx_e4',
    type: 'expense',
    amount: 190,
    memberId: 'mem_4',
    memberName: 'Emma Watson',
    category: 'Shopping',
    date: '2026-10-25',
    paymentMethod: 'Credit Card',
    notes: 'Hiking gear & groceries for trip',
    createdAt: Date.now() - 3 * 86400000,
  },
  {
    id: 'tx_e5',
    type: 'expense',
    amount: 220,
    memberId: 'mem_1',
    memberName: 'Alex Rivera',
    category: 'Fun',
    date: '2026-10-26',
    paymentMethod: 'Digital Wallet',
    notes: 'National Park kayaking & tour passes',
    createdAt: Date.now() - 2 * 86400000,
  },
  {
    id: 'tx_e6',
    type: 'expense',
    amount: 200,
    memberId: 'mem_2',
    memberName: 'Sarah Chen',
    category: 'Food',
    date: '2026-10-27',
    paymentMethod: 'Cash',
    notes: 'Seafood lunch by the harbor',
    createdAt: Date.now() - 1 * 86400000,
  },
];

/**
 * In-memory fallback if AsyncStorage is unavailable (e.g., standard Node unit test environment)
 */
class MemoryStorage {
  private data = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.data.get(key) ?? null;
  }
  async setItem(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }
  async removeItem(key: string): Promise<void> {
    this.data.delete(key);
  }
  async clear(): Promise<void> {
    this.data.clear();
  }
}

const memoryStore = new MemoryStorage();

async function getStorageItem(key: string): Promise<string | null> {
  try {
    if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
      return await AsyncStorage.getItem(key);
    }
  } catch {
    // Fall back to memoryStore
  }
  return memoryStore.getItem(key);
}

async function setStorageItem(key: string, value: string): Promise<void> {
  try {
    if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
      await AsyncStorage.setItem(key, value);
      return;
    }
  } catch {
    // Fall back to memoryStore
  }
  await memoryStore.setItem(key, value);
}

export const StorageService = {
  /**
   * Initializes storage with default seed data on first run
   */
  async initialize(): Promise<{
    transactions: Transaction[];
    members: Member[];
    settings: AppSettings;
    alerts: ThresholdAlert[];
  }> {
    const initialized = await getStorageItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
      await setStorageItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      await setStorageItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
      await setStorageItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      await setStorageItem(STORAGE_KEYS.ALERTS, JSON.stringify([]));
      await setStorageItem(STORAGE_KEYS.INITIALIZED, 'true');

      return {
        transactions: INITIAL_TRANSACTIONS,
        members: INITIAL_MEMBERS,
        settings: DEFAULT_SETTINGS,
        alerts: [],
      };
    }

    const [txs, mems, sets, alts] = await Promise.all([
      this.loadTransactions(),
      this.loadMembers(),
      this.loadSettings(),
      this.loadAlerts(),
    ]);

    return {
      transactions: txs,
      members: mems,
      settings: sets,
      alerts: alts,
    };
  },

  async loadTransactions(): Promise<Transaction[]> {
    try {
      const data = await getStorageItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) return INITIAL_TRANSACTIONS;
      return JSON.parse(data) as Transaction[];
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  },

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    await setStorageItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  async loadMembers(): Promise<Member[]> {
    try {
      const data = await getStorageItem(STORAGE_KEYS.MEMBERS);
      if (!data) return INITIAL_MEMBERS;
      return JSON.parse(data) as Member[];
    } catch {
      return INITIAL_MEMBERS;
    }
  },

  async saveMembers(members: Member[]): Promise<void> {
    await setStorageItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  },

  async loadSettings(): Promise<AppSettings> {
    try {
      const data = await getStorageItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    await setStorageItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  async loadAlerts(): Promise<ThresholdAlert[]> {
    try {
      const data = await getStorageItem(STORAGE_KEYS.ALERTS);
      if (!data) return [];
      return JSON.parse(data) as ThresholdAlert[];
    } catch {
      return [];
    }
  },

  async saveAlerts(alerts: ThresholdAlert[]): Promise<void> {
    await setStorageItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
  },

  /**
   * Export all data in clean JSON format
   */
  async exportFullDatabaseJSON(): Promise<string> {
    const [transactions, members, settings, alerts] = await Promise.all([
      this.loadTransactions(),
      this.loadMembers(),
      this.loadSettings(),
      this.loadAlerts(),
    ]);

    const backup = {
      appName: 'PocketPool',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        settings,
        members,
        transactions,
        alerts,
      },
    };

    return JSON.stringify(backup, null, 2);
  },

  /**
   * Import data from JSON string
   */
  async importFullDatabaseJSON(jsonStr: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.data) return false;

      if (Array.isArray(parsed.data.transactions)) {
        await this.saveTransactions(parsed.data.transactions);
      }
      if (Array.isArray(parsed.data.members)) {
        await this.saveMembers(parsed.data.members);
      }
      if (parsed.data.settings) {
        await this.saveSettings(parsed.data.settings);
      }
      if (Array.isArray(parsed.data.alerts)) {
        await this.saveAlerts(parsed.data.alerts);
      }
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Reset data back to default demo state (restores 4 sample members & transactions)
   */
  async resetToDefaults(): Promise<void> {
    await setStorageItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
    await setStorageItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
    await setStorageItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    await setStorageItem(STORAGE_KEYS.ALERTS, JSON.stringify([]));
    await setStorageItem(STORAGE_KEYS.INITIALIZED, 'true');
  },

  /**
   * Reset data to completely empty default state (0 members, 0 transactions, 0 entries)
   */
  async resetToZero(): Promise<void> {
    await setStorageItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    await setStorageItem(STORAGE_KEYS.MEMBERS, JSON.stringify([]));
    await setStorageItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    await setStorageItem(STORAGE_KEYS.ALERTS, JSON.stringify([]));
    await setStorageItem(STORAGE_KEYS.INITIALIZED, 'true');
  },
};
