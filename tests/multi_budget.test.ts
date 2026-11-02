import {
  calculateBudgetSummary,
  getCategorySummaries,
  getSpendingTrend,
} from '../src/services/calculations';
import { Transaction, Member, BudgetPool } from '../src/types';

export function runMultiBudgetTests(): boolean {
  console.log('🧪 Running Test Suite: Multiple Budget Pools & Zero Data Bleed Isolation...');
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

  const dummyMembers: Member[] = [
    {
      id: 'm1',
      name: 'Alice',
      avatarColor: '#6366F1',
      totalContributed: 1500,
      joinedAt: '2026-01-01',
    },
    {
      id: 'm2',
      name: 'Bob',
      avatarColor: '#EC4899',
      totalContributed: 1200,
      joinedAt: '2026-01-01',
    },
  ];

  const poolSummer: BudgetPool = {
    id: 'pool_summer_trip',
    name: 'Summer Trip',
    createdAt: 1000,
    thresholdAmount: 200,
  };

  const poolOffice: BudgetPool = {
    id: 'pool_office_party',
    name: 'Office Party',
    createdAt: 2000,
    thresholdAmount: 150,
  };

  const allTransactions: Transaction[] = [
    // Summer Trip: $1,200 contributions, $700 expenses -> Balance: $500
    {
      id: 'tx_s_c1',
      poolId: 'pool_summer_trip',
      type: 'contribution',
      amount: 800,
      memberId: 'm1',
      memberName: 'Alice',
      date: '2026-10-01',
      paymentMethod: 'Bank Transfer',
      createdAt: 1000,
    },
    {
      id: 'tx_s_c2',
      poolId: 'pool_summer_trip',
      type: 'contribution',
      amount: 400,
      memberId: 'm2',
      memberName: 'Bob',
      date: '2026-10-02',
      paymentMethod: 'Digital Wallet',
      createdAt: 2000,
    },
    {
      id: 'tx_s_e1',
      poolId: 'pool_summer_trip',
      type: 'expense',
      amount: 450,
      memberId: 'm1',
      memberName: 'Alice',
      category: 'Bills',
      date: '2026-10-05',
      paymentMethod: 'Credit Card',
      createdAt: 3000,
    },
    {
      id: 'tx_s_e2',
      poolId: 'pool_summer_trip',
      type: 'expense',
      amount: 250,
      memberId: 'm2',
      memberName: 'Bob',
      category: 'Food',
      date: '2026-10-06',
      paymentMethod: 'Cash',
      createdAt: 4000,
    },

    // Office Party: $800 contributions, $350 expenses -> Balance: $450
    {
      id: 'tx_o_c1',
      poolId: 'pool_office_party',
      type: 'contribution',
      amount: 500,
      memberId: 'm1',
      memberName: 'Alice',
      date: '2026-10-10',
      paymentMethod: 'Bank Transfer',
      createdAt: 5000,
    },
    {
      id: 'tx_o_c2',
      poolId: 'pool_office_party',
      type: 'contribution',
      amount: 300,
      memberId: 'm2',
      memberName: 'Bob',
      date: '2026-10-11',
      paymentMethod: 'Digital Wallet',
      createdAt: 6000,
    },
    {
      id: 'tx_o_e1',
      poolId: 'pool_office_party',
      type: 'expense',
      amount: 200,
      memberId: 'm1',
      memberName: 'Alice',
      category: 'Food',
      date: '2026-10-12',
      paymentMethod: 'Credit Card',
      createdAt: 7000,
    },
    {
      id: 'tx_o_e2',
      poolId: 'pool_office_party',
      type: 'expense',
      amount: 150,
      memberId: 'm2',
      memberName: 'Bob',
      category: 'Fun',
      date: '2026-10-13',
      paymentMethod: 'Digital Wallet',
      createdAt: 8000,
    },
  ];

  // Test 1: Strict Pool Isolation Filtering
  const summerTxs = allTransactions.filter((tx) => tx.poolId === 'pool_summer_trip');
  const officeTxs = allTransactions.filter((tx) => tx.poolId === 'pool_office_party');

  assert(summerTxs.length === 4, 'Summer Trip transactions filter returns exactly 4 items');
  assert(officeTxs.length === 4, 'Office Party transactions filter returns exactly 4 items');
  assert(
    summerTxs.every((tx) => tx.poolId === 'pool_summer_trip'),
    'Zero data bleed: All Summer Trip items have poolId "pool_summer_trip"'
  );
  assert(
    officeTxs.every((tx) => tx.poolId === 'pool_office_party'),
    'Zero data bleed: All Office Party items have poolId "pool_office_party"'
  );

  // Test 2: Independent Budget Math Calculations
  const summerBudget = calculateBudgetSummary(summerTxs, poolSummer.thresholdAmount!, dummyMembers);
  assert(
    summerBudget.totalBudget === 1200,
    'Summer Trip Total Budget equals 800 + 400 = 1200'
  );
  assert(
    summerBudget.totalExpenses === 700,
    'Summer Trip Total Expenses equals 450 + 250 = 700'
  );
  assert(
    summerBudget.remainingBudget === 500,
    'Summer Trip Remaining Budget is 1200 - 700 = 500'
  );
  assert(!summerBudget.isBelowThreshold, 'Summer Trip is not below threshold 200 (balance is 500)');

  const officeBudget = calculateBudgetSummary(officeTxs, poolOffice.thresholdAmount!, dummyMembers);
  assert(
    officeBudget.totalBudget === 800,
    'Office Party Total Budget equals 500 + 300 = 800'
  );
  assert(
    officeBudget.totalExpenses === 350,
    'Office Party Total Expenses equals 200 + 150 = 350'
  );
  assert(
    officeBudget.remainingBudget === 450,
    'Office Party Remaining Budget is 800 - 350 = 450'
  );
  assert(!officeBudget.isBelowThreshold, 'Office Party is not below threshold 150 (balance is 450)');

  // Test 3: Independent Category Breakdown Isolation
  const summerCategories = getCategorySummaries(summerTxs);
  const officeCategories = getCategorySummaries(officeTxs);

  const summerBills = summerCategories.find((c) => c.category === 'Bills');
  const officeBills = officeCategories.find((c) => c.category === 'Bills');
  assert(summerBills?.amount === 450, 'Summer Trip Bills category sum is $450');
  assert(officeBills === undefined, 'Office Party has no Bills expenses (isolated from Summer Trip)');

  const officeFun = officeCategories.find((c) => c.category === 'Fun');
  const summerFun = summerCategories.find((c) => c.category === 'Fun');
  assert(officeFun?.amount === 150, 'Office Party Fun category sum is $150');
  assert(summerFun === undefined, 'Summer Trip has no Fun expenses (isolated from Office Party)');

  // Test 4: Dynamic Creation of a Brand New Pool with 0 Transactions
  const newPool: BudgetPool = {
    id: 'pool_new_trip',
    name: 'Roadtrip 2027',
    createdAt: Date.now(),
  };

  const newPoolTxs = allTransactions.filter((tx) => tx.poolId === newPool.id);
  assert(newPoolTxs.length === 0, 'New budget pool starts with 0 transactions');

  const newPoolBudget = calculateBudgetSummary(newPoolTxs, 200, dummyMembers);
  assert(newPoolBudget.totalBudget === 0, 'New budget pool Total Budget starts at $0');
  assert(newPoolBudget.totalExpenses === 0, 'New budget pool Total Expenses starts at $0');
  assert(newPoolBudget.remainingBudget === 0, 'New budget pool Remaining Balance starts at $0');
  assert(newPoolBudget.percentageSpent === 0, 'New budget pool percentage spent starts at 0%');

  const newPoolCategories = getCategorySummaries(newPoolTxs);
  assert(newPoolCategories.length === 0, 'New budget pool category summaries array is empty');

  // Test 5: Adding Transaction to New Pool Without Polluting Other Pools
  const addedTx: Transaction = {
    id: 'tx_new_e1',
    poolId: newPool.id,
    type: 'expense',
    amount: 120,
    memberId: 'm1',
    memberName: 'Alice',
    category: 'Food',
    date: '2026-10-28',
    paymentMethod: 'Credit Card',
    createdAt: Date.now(),
  };

  const updatedAll = [...allTransactions, addedTx];
  const postAddSummer = updatedAll.filter((tx) => tx.poolId === 'pool_summer_trip');
  const postAddOffice = updatedAll.filter((tx) => tx.poolId === 'pool_office_party');
  const postAddNew = updatedAll.filter((tx) => tx.poolId === newPool.id);

  assert(postAddSummer.length === 4, 'Summer Trip transaction count unaffected after adding to new pool');
  assert(postAddOffice.length === 4, 'Office Party transaction count unaffected after adding to new pool');
  assert(postAddNew.length === 1, 'New pool contains exactly the newly added transaction');

  const updatedSummerBudget = calculateBudgetSummary(postAddSummer, 200, dummyMembers);
  assert(
    updatedSummerBudget.remainingBudget === 500,
    'Summer Trip remaining balance ($500) completely unchanged after new pool transaction'
  );

  console.log(`✨ Multi-Budget Pools Suite Passed: ${passed}/${total} assertions.\n`);
  return true;
}
