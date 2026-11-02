import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Member, AppSettings, ThresholdAlert, BudgetPool } from '../types';
import { SAMPLE_RECEIPT_IMAGE_URI } from './receiptSamples';

const STORAGE_KEYS = {
  TRANSACTIONS: '@pocketpool_transactions_v2',
  MEMBERS: '@pocketpool_members_v2',
  SETTINGS: '@pocketpool_settings_v2',
  ALERTS: '@pocketpool_alerts_v2',
  POOLS: '@pocketpool_pools_v2',
  ACTIVE_POOL: '@pocketpool_active_pool_v2',
  INITIALIZED: '@pocketpool_initialized_v2',
};

export const INITIAL_POOLS: BudgetPool[] = [
  {
    id: 'pool_summer_trip',
    name: 'Summer Trip',
    description: 'Annual summer vacation and villa getaway',
    createdAt: Date.now() - 30 * 86400000,
  },
  {
    id: 'pool_office_party',
    name: 'Office Party',
    description: 'Q4 Team celebration and dinner event',
    createdAt: Date.now() - 15 * 86400000,
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  currencySymbol: '$',
  currencyCode: 'USD',
  thresholdAmount: 300,
  thresholdType: 'amount',
  biometricEnabled: false,
  pinCode: '1234',
  groupName: 'Summer Trip Pool 2026',
  activePoolId: 'pool_summer_trip',
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
  // Contributions totaling $2,800 for Summer Trip
  {
    id: 'tx_c1',
    poolId: 'pool_summer_trip',
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
    poolId: 'pool_summer_trip',
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
    poolId: 'pool_summer_trip',
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
    poolId: 'pool_summer_trip',
    type: 'contribution',
    amount: 600,
    memberId: 'mem_4',
    memberName: 'Emma Watson',
    date: '2026-10-18',
    paymentMethod: 'Bank Transfer',
    notes: 'Group fund share',
    createdAt: Date.now() - 10 * 86400000,
  },

  // Expenses totaling $1,850 for Summer Trip (Balance: $950)
  {
    id: 'tx_e1',
    poolId: 'pool_summer_trip',
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
    poolId: 'pool_summer_trip',
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
    poolId: 'pool_summer_trip',
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
    poolId: 'pool_summer_trip',
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
    poolId: 'pool_summer_trip',
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
    poolId: 'pool_summer_trip',
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

  // Separate Distinct Pool: 'Office Party'
  {
    id: 'tx_op_c1',
    poolId: 'pool_office_party',
    type: 'contribution',
    amount: 600,
    memberId: 'mem_1',
    memberName: 'Alex Rivera',
    date: '2026-10-20',
    paymentMethod: 'Bank Transfer',
    notes: 'Office party initial contribution',
    createdAt: Date.now() - 8 * 86400000,
  },
  {
    id: 'tx_op_c2',
    poolId: 'pool_office_party',
    type: 'contribution',
    amount: 400,
    memberId: 'mem_2',
    memberName: 'Sarah Chen',
    date: '2026-10-21',
    paymentMethod: 'Digital Wallet',
    notes: 'Party snacks & drinks share',
    createdAt: Date.now() - 7 * 86400000,
  },
  {
    id: 'tx_op_e1',
    poolId: 'pool_office_party',
    type: 'expense',
    amount: 320,
    memberId: 'mem_1',
    memberName: 'Alex Rivera',
    category: 'Food',
    date: '2026-10-23',
    paymentMethod: 'Credit Card',
    notes: 'Catering platter & beverages',
    createdAt: Date.now() - 5 * 86400000,
  },
  {
    id: 'tx_op_e2',
    poolId: 'pool_office_party',
    type: 'expense',
    amount: 180,
    memberId: 'mem_2',
    memberName: 'Sarah Chen',
    category: 'Fun',
    date: '2026-10-24',
    paymentMethod: 'Credit Card',
    notes: 'Karaoke & arcade passes',
    createdAt: Date.now() - 4 * 86400000,
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
    pools: BudgetPool[];
    activePoolId: string;
  }> {
    const initialized = await getStorageItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
      await setStorageItem(STORAGE_KEYS.POOLS, JSON.stringify(INITIAL_POOLS));
      await setStorageItem(STORAGE_KEYS.ACTIVE_POOL, 'pool_summer_trip');
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
        pools: INITIAL_POOLS,
        activePoolId: 'pool_summer_trip',
      };
    }

    const [txs, mems, sets, alts, poolsData, activePoolData] = await Promise.all([
      this.loadTransactions(),
      this.loadMembers(),
      this.loadSettings(),
      this.loadAlerts(),
      this.loadPools(),
      this.loadActivePoolId(),
    ]);

    let pools = poolsData;
    if (!pools || pools.length === 0) {
      pools = INITIAL_POOLS;
      await this.savePools(pools);
    }

    let activePoolId = activePoolData;
    if (!activePoolId || !pools.some((p) => p.id === activePoolId)) {
      activePoolId = pools[0].id;
      await this.saveActivePoolId(activePoolId);
    }

    // Schema migration: ensure all transactions have a poolId
    let needsTxSave = false;
    const migratedTxs = txs.map((t) => {
      if (!t.poolId) {
        needsTxSave = true;
        return { ...t, poolId: 'pool_summer_trip' };
      }
      return t;
    });

    if (needsTxSave) {
      await this.saveTransactions(migratedTxs);
    }

    return {
      transactions: migratedTxs,
      members: mems,
      settings: sets,
      alerts: alts,
      pools,
      activePoolId,
    };
  },

  async loadPools(): Promise<BudgetPool[]> {
    try {
      const data = await getStorageItem(STORAGE_KEYS.POOLS);
      if (!data) return INITIAL_POOLS;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? (parsed as BudgetPool[]) : INITIAL_POOLS;
    } catch {
      return INITIAL_POOLS;
    }
  },

  async savePools(pools: BudgetPool[]): Promise<void> {
    await setStorageItem(STORAGE_KEYS.POOLS, JSON.stringify(pools));
  },

  async loadActivePoolId(): Promise<string> {
    try {
      const data = await getStorageItem(STORAGE_KEYS.ACTIVE_POOL);
      return data || 'pool_summer_trip';
    } catch {
      return 'pool_summer_trip';
    }
  },

  async saveActivePoolId(id: string): Promise<void> {
    await setStorageItem(STORAGE_KEYS.ACTIVE_POOL, id);
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
      if (data === null || data === undefined) {
        const initialized = await getStorageItem(STORAGE_KEYS.INITIALIZED);
        return initialized ? [] : INITIAL_MEMBERS;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? (parsed as Member[]) : [];
    } catch {
      return [];
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
    const [transactions, members, settings, alerts, pools, activePoolId] = await Promise.all([
      this.loadTransactions(),
      this.loadMembers(),
      this.loadSettings(),
      this.loadAlerts(),
      this.loadPools(),
      this.loadActivePoolId(),
    ]);

    const backup = {
      appName: 'PocketPool',
      version: '2.1.0',
      exportedAt: new Date().toISOString(),
      data: {
        settings,
        members,
        transactions,
        alerts,
        pools,
        activePoolId,
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

      if (Array.isArray(parsed.data.pools) && parsed.data.pools.length > 0) {
        await this.savePools(parsed.data.pools);
      } else {
        await this.savePools(INITIAL_POOLS);
      }

      if (parsed.data.activePoolId) {
        await this.saveActivePoolId(parsed.data.activePoolId);
      } else {
        await this.saveActivePoolId('pool_summer_trip');
      }

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
    await setStorageItem(STORAGE_KEYS.POOLS, JSON.stringify(INITIAL_POOLS));
    await setStorageItem(STORAGE_KEYS.ACTIVE_POOL, 'pool_summer_trip');
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
    const zeroPool: BudgetPool[] = [
      {
        id: 'pool_default',
        name: 'Main Budget',
        description: 'Primary pool',
        createdAt: Date.now(),
      },
    ];
    await setStorageItem(STORAGE_KEYS.POOLS, JSON.stringify(zeroPool));
    await setStorageItem(STORAGE_KEYS.ACTIVE_POOL, 'pool_default');
    await setStorageItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    await setStorageItem(STORAGE_KEYS.MEMBERS, JSON.stringify([]));
    await setStorageItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    await setStorageItem(STORAGE_KEYS.ALERTS, JSON.stringify([]));
    await setStorageItem(STORAGE_KEYS.INITIALIZED, 'true');
  },
};
