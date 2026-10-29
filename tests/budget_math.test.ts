import { calculateBudgetSummary } from '../src/services/calculations';
import { Transaction, Member } from '../src/types';

export function runBudgetMathTests(): boolean {
  console.log('🧪 Running Test Suite: Budget Math Calculations...');
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
      totalContributed: 500,
      joinedAt: '2026-01-01',
    },
    {
      id: 'm2',
      name: 'Bob',
      avatarColor: '#EC4899',
      totalContributed: 500,
      joinedAt: '2026-01-01',
    },
  ];

  // Test 1: Accumulating Member Contributions
  const contributions: Transaction[] = [
    {
      id: 'tx_c1',
      type: 'contribution',
      amount: 500,
      memberId: 'm1',
      memberName: 'Alice',
      date: '2026-10-01',
      paymentMethod: 'Bank Transfer',
      createdAt: 1000,
    },
    {
      id: 'tx_c2',
      type: 'contribution',
      amount: 750,
      memberId: 'm2',
      memberName: 'Bob',
      date: '2026-10-02',
      paymentMethod: 'Digital Wallet',
      createdAt: 2000,
    },
  ];

  const summary1 = calculateBudgetSummary(contributions, 200, dummyMembers);
  assert(summary1.totalBudget === 1250, 'Member contributions accumulate correctly into Total Budget (500 + 750 = 1250)');
  assert(summary1.totalExpenses === 0, 'Expenses are 0 when only contributions exist');
  assert(summary1.remainingBudget === 1250, 'Remaining budget equals Total Budget when no expenses exist');
  assert(summary1.percentageSpent === 0, 'Percentage spent is 0%');

  // Test 2: Deducting Expenses from Budget
  const withExpenses: Transaction[] = [
    ...contributions,
    {
      id: 'tx_e1',
      type: 'expense',
      amount: 300,
      memberId: 'm1',
      memberName: 'Alice',
      category: 'Food',
      date: '2026-10-05',
      paymentMethod: 'Credit Card',
      createdAt: 3000,
    },
    {
      id: 'tx_e2',
      type: 'expense',
      amount: 450,
      memberId: 'm2',
      memberName: 'Bob',
      category: 'Transport',
      date: '2026-10-06',
      paymentMethod: 'Cash',
      createdAt: 4000,
    },
  ];

  const summary2 = calculateBudgetSummary(withExpenses, 200, dummyMembers);
  assert(summary2.totalBudget === 1250, 'Total Budget remains 1250 after expenses');
  assert(summary2.totalExpenses === 750, 'Total Expenses equals 300 + 450 = 750');
  assert(summary2.remainingBudget === 500, 'Remaining budget is correctly deducted: 1250 - 750 = 500');
  assert(summary2.percentageSpent === 60, 'Percentage spent is correctly calculated: (750 / 1250) * 100 = 60%');
  assert(!summary2.isBelowThreshold, 'isBelowThreshold is false when remaining 500 is > threshold 200');

  // Test 3: Budget Deficit / Negative Remaining Budget
  const deficitTxs: Transaction[] = [
    {
      id: 'c1',
      type: 'contribution',
      amount: 200,
      memberId: 'm1',
      memberName: 'Alice',
      date: '2026-10-01',
      paymentMethod: 'Cash',
      createdAt: 1000,
    },
    {
      id: 'e1',
      type: 'expense',
      amount: 350,
      memberId: 'm1',
      memberName: 'Alice',
      category: 'Bills',
      date: '2026-10-02',
      paymentMethod: 'Credit Card',
      createdAt: 2000,
    },
  ];

  const summary3 = calculateBudgetSummary(deficitTxs, 100, dummyMembers);
  assert(summary3.remainingBudget === -150, 'Remaining budget correctly handles deficit: 200 - 350 = -150');
  assert(summary3.isBelowThreshold === true, 'Budget deficit correctly flags isBelowThreshold as true');
  assert(summary3.percentageSpent === 100, 'Percentage spent caps at 100% during deficit');

  // Test 4: Member Deletion and Active Member Count
  assert(summary1.activeMembersCount === 2, 'Initial active members count reflects 2 members');
  const singleMember = [dummyMembers[0]];
  const summarySingle = calculateBudgetSummary(contributions, 200, singleMember);
  assert(summarySingle.activeMembersCount === 1, 'activeMembersCount correctly reflects member deletion (2 -> 1)');
  const summaryZero = calculateBudgetSummary(contributions, 200, []);
  assert(summaryZero.activeMembersCount === 0, 'activeMembersCount is 0 when all members are removed');

  console.log(`✨ Budget Math Suite Passed: ${passed}/${total} assertions.\n`);
  return true;
}
