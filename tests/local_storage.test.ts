import { StorageService, DEFAULT_SETTINGS } from '../src/services/storage';
import { Transaction, Member, AppSettings } from '../src/types';

export async function runLocalStorageTests(): Promise<boolean> {
  console.log('🧪 Running Test Suite: Local JSON Storage Read/Write Operations...');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // Test 1: Storage initialization
  const initData = await StorageService.initialize();
  assert(Array.isArray(initData.transactions), 'Storage initializes transactions array in local JSON');
  assert(initData.transactions.length > 0, 'Seed demo transactions populated on initial launch');
  assert(Array.isArray(initData.members), 'Storage initializes members array in local JSON');
  assert(initData.settings.thresholdAmount === DEFAULT_SETTINGS.thresholdAmount, 'Default settings loaded with customizable threshold');

  // Test 2: Writing and Reading Transactions
  const newTx: Transaction = {
    id: 'tx_unit_test_999',
    type: 'contribution',
    amount: 1500,
    memberId: 'mem_test',
    memberName: 'Unit Test User',
    date: '2026-10-28',
    paymentMethod: 'Bank Transfer',
    notes: 'Unit test deposit verification',
    createdAt: Date.now(),
  };

  const updatedTxs = [newTx, ...initData.transactions];
  await StorageService.saveTransactions(updatedTxs);

  const reloadedTxs = await StorageService.loadTransactions();
  assert(reloadedTxs.length === updatedTxs.length, 'Loaded transactions match saved transaction count');
  assert(reloadedTxs[0].id === 'tx_unit_test_999', 'Latest transaction persists and retrieves correctly');
  assert(reloadedTxs[0].amount === 1500, 'Transaction amount persists accurately');

  // Test 3: Updating and Reading Settings
  const updatedSettings: AppSettings = {
    ...initData.settings,
    currencySymbol: '£',
    currencyCode: 'GBP',
    thresholdAmount: 450,
    groupName: 'Edinburgh Roadtrip Pool',
  };

  await StorageService.saveSettings(updatedSettings);
  const reloadedSettings = await StorageService.loadSettings();
  assert(reloadedSettings.currencySymbol === '£', 'Settings currency symbol saved and retrieved');
  assert(reloadedSettings.thresholdAmount === 450, 'Custom threshold amount (450) saved and retrieved');
  assert(reloadedSettings.groupName === 'Edinburgh Roadtrip Pool', 'Custom group name saved and retrieved');

  // Test 4: Export Full Database JSON
  const jsonExport = await StorageService.exportFullDatabaseJSON();
  assert(typeof jsonExport === 'string', 'exportFullDatabaseJSON returns stringified JSON');
  const parsedExport = JSON.parse(jsonExport);
  assert(parsedExport.appName === 'PocketPool', 'Exported JSON contains appName: PocketPool');
  assert(Array.isArray(parsedExport.data.transactions), 'Exported JSON contains transactions list');
  assert(parsedExport.data.settings.currencyCode === 'GBP', 'Exported JSON contains current user settings');

  // Test 5: Import and Restore Database JSON
  const mockRestoreJSON = JSON.stringify({
    appName: 'PocketPool',
    version: '2.0.0',
    data: {
      settings: {
        currencySymbol: '¥',
        currencyCode: 'JPY',
        thresholdAmount: 10000,
        biometricEnabled: false,
        pinCode: '9999',
        groupName: 'Tokyo Exploration',
      },
      members: [
        {
          id: 'mem_tokyo',
          name: 'Kenji Sato',
          avatarColor: '#10B981',
          totalContributed: 50000,
          joinedAt: '2026-10-01',
        },
      ],
      transactions: [
        {
          id: 'tx_tokyo_1',
          type: 'contribution',
          amount: 50000,
          memberId: 'mem_tokyo',
          memberName: 'Kenji Sato',
          date: '2026-10-01',
          paymentMethod: 'Cash',
          createdAt: 1000,
        },
      ],
      alerts: [],
    },
  });

  const importSuccess = await StorageService.importFullDatabaseJSON(mockRestoreJSON);
  assert(importSuccess === true, 'importFullDatabaseJSON successfully parses and imports valid backup');

  const restoredSettings = await StorageService.loadSettings();
  assert(restoredSettings.currencyCode === 'JPY', 'Restored settings match imported JSON (JPY)');
  assert(restoredSettings.thresholdAmount === 10000, 'Restored threshold matches imported JSON (10000)');

  const restoredTxs = await StorageService.loadTransactions();
  assert(restoredTxs.length === 1 && restoredTxs[0].id === 'tx_tokyo_1', 'Restored transactions match imported JSON');

  // Clean up: Reset back to demo defaults
  await StorageService.resetToDefaults();
  const resetTxs = await StorageService.loadTransactions();
  assert(resetTxs.length > 1, 'Storage successfully resets to demo state after tests');

  console.log(`✨ Local Storage Suite Passed: ${passed}/${total} assertions.\n`);
  return true;
}
