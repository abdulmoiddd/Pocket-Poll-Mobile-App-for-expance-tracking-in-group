import {
  Transaction,
  BudgetSummary,
  CategorySummary,
  ExpenseCategory,
  MemberContributionSummary,
  SpendingTrendPoint,
  ExportTimeframe,
  Member,
} from '../types';
import { theme } from '../theme';

/**
 * Calculates budget summary strictly based on:
 * Member Contributions accumulate into Total Budget.
 * Expenses are deducted from Total Budget.
 * remainingBudget = totalContributions - totalExpenses.
 */
export function calculateBudgetSummary(
  transactions: Transaction[],
  thresholdAmount: number,
  members: Member[] = []
): BudgetSummary {
  let totalContributions = 0;
  let totalExpenses = 0;
  const contributingMemberIds = new Set<string>();

  for (const tx of transactions) {
    const amount = Number(tx.amount) || 0;
    if (tx.type === 'contribution') {
      totalContributions += amount;
      if (tx.memberId) {
        contributingMemberIds.add(tx.memberId);
      }
    } else if (tx.type === 'expense') {
      totalExpenses += amount;
    }
  }

  const remainingBudget = totalContributions - totalExpenses;
  const percentageSpent =
    totalContributions > 0
      ? Math.min(100, Math.max(0, (totalExpenses / totalContributions) * 100))
      : totalExpenses > 0
      ? 100
      : 0;

  const isBelowThreshold = remainingBudget <= thresholdAmount;

  return {
    totalBudget: Math.round(totalContributions * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    remainingBudget: Math.round(remainingBudget * 100) / 100,
    percentageSpent: Math.round(percentageSpent * 10) / 10,
    isBelowThreshold,
    thresholdAmount,
    activeMembersCount: Math.max(contributingMemberIds.size, members.length),
  };
}

/**
 * Checks whether an alert should be triggered based on remaining budget and threshold.
 */
export function checkThresholdAlert(
  previousRemainingBudget: number,
  currentRemainingBudget: number,
  thresholdAmount: number,
  currencySymbol: string = '$'
): { shouldTrigger: boolean; message: string; alertType: 'warning' | 'danger' | 'none' } {
  // Trigger alert if it just crossed below the threshold, or if budget is negative
  if (currentRemainingBudget <= 0) {
    return {
      shouldTrigger: true,
      message: `Critical: Pool budget has been completely exhausted (${currencySymbol}${currentRemainingBudget.toFixed(2)} remaining)!`,
      alertType: 'danger',
    };
  }

  if (currentRemainingBudget <= thresholdAmount) {
    const isNewCross = previousRemainingBudget > thresholdAmount;
    return {
      shouldTrigger: isNewCross || currentRemainingBudget < previousRemainingBudget,
      message: `Warning: Pool budget is below your threshold of ${currencySymbol}${thresholdAmount.toFixed(2)} (${currencySymbol}${currentRemainingBudget.toFixed(2)} left).`,
      alertType: 'warning',
    };
  }

  return {
    shouldTrigger: false,
    message: '',
    alertType: 'none',
  };
}

/**
 * Maps category to theme accent colors
 */
export function getCategoryTheme(category: ExpenseCategory): {
  color: string;
  lightColor: string;
} {
  switch (category) {
    case 'Food':
      return { color: theme.colors.food, lightColor: theme.colors.foodLight };
    case 'Transport':
      return { color: theme.colors.transport, lightColor: theme.colors.transportLight };
    case 'Shopping':
      return { color: theme.colors.shopping, lightColor: theme.colors.shoppingLight };
    case 'Fun':
      return { color: theme.colors.fun, lightColor: theme.colors.funLight };
    case 'Bills':
      return { color: theme.colors.bills, lightColor: theme.colors.billsLight };
    case 'Other':
    default:
      return { color: theme.colors.other, lightColor: theme.colors.otherLight };
  }
}

/**
 * Aggregates expenses by category with percentages and progress values.
 */
export function getCategorySummaries(transactions: Transaction[]): CategorySummary[] {
  const categories: ExpenseCategory[] = ['Food', 'Transport', 'Shopping', 'Fun', 'Bills', 'Other'];
  const expenseTransactions = transactions.filter((tx) => tx.type === 'expense');
  const totalExpenseSum = expenseTransactions.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);

  return categories
    .map((category) => {
      const catTransactions = expenseTransactions.filter((tx) => tx.category === category);
      const amount = catTransactions.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);
      const percentage = totalExpenseSum > 0 ? (amount / totalExpenseSum) * 100 : 0;
      const themeColors = getCategoryTheme(category);

      return {
        category,
        amount: Math.round(amount * 100) / 100,
        percentage: Math.round(percentage * 10) / 10,
        transactionCount: catTransactions.length,
        color: themeColors.color,
        lightColor: themeColors.lightColor,
      };
    })
    .filter((cat) => cat.amount > 0 || cat.transactionCount > 0)
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Aggregates contributions by member.
 */
export function getMemberContributionSummaries(
  transactions: Transaction[],
  members: Member[]
): MemberContributionSummary[] {
  const contributionTransactions = transactions.filter((tx) => tx.type === 'contribution');
  const totalContributions = contributionTransactions.reduce(
    (acc, tx) => acc + (Number(tx.amount) || 0),
    0
  );

  const memberMap = new Map<string, { total: number; count: number; name: string; color: string }>();

  // Initialize with known members
  for (const m of members) {
    memberMap.set(m.id, {
      total: 0,
      count: 0,
      name: m.name,
      color: m.avatarColor,
    });
  }

  // Accumulate contributions
  for (const tx of contributionTransactions) {
    const current = memberMap.get(tx.memberId) || {
      total: 0,
      count: 0,
      name: tx.memberName || 'Member',
      color: theme.colors.primary,
    };
    current.total += Number(tx.amount) || 0;
    current.count += 1;
    memberMap.set(tx.memberId, current);
  }

  const summaries: MemberContributionSummary[] = [];
  memberMap.forEach((val, id) => {
    const percentage = totalContributions > 0 ? (val.total / totalContributions) * 100 : 0;
    summaries.push({
      memberId: id,
      memberName: val.name,
      avatarColor: val.color,
      totalContributed: Math.round(val.total * 100) / 100,
      percentageOfPool: Math.round(percentage * 10) / 10,
      contributionCount: val.count,
    });
  });

  return summaries.sort((a, b) => b.totalContributed - a.totalContributed);
}

/**
 * Filters transactions by timeframes:
 * - single: specific transaction
 * - last_week: last 7 days
 * - last_month: last 30 days
 * - all_time: all transactions
 */
export function filterTransactionsByTimeframe(
  transactions: Transaction[],
  timeframe: ExportTimeframe,
  specificTransactionId?: string,
  referenceDate: Date = new Date()
): Transaction[] {
  if (timeframe === 'single') {
    if (!specificTransactionId) return transactions.slice(0, 1);
    const found = transactions.find((t) => t.id === specificTransactionId);
    return found ? [found] : transactions.slice(0, 1);
  }

  if (timeframe === 'all_time') {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  const refTime = referenceDate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const daysLimit = timeframe === 'last_week' ? 7 : 30;
  const cutoffTime = refTime - daysLimit * dayMs;

  return transactions
    .filter((tx) => {
      const txTime = new Date(tx.date).getTime();
      return txTime >= cutoffTime && txTime <= refTime;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Computes spending points over the last N days for the trend chart.
 */
export function getSpendingTrend(
  transactions: Transaction[],
  days: number = 7,
  referenceDate: Date = new Date()
): SpendingTrendPoint[] {
  const points: SpendingTrendPoint[] = [];
  const expenseTxs = transactions.filter((tx) => tx.type === 'expense');

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

    const dayExpenseSum = expenseTxs
      .filter((tx) => tx.date === dateStr)
      .reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);

    points.push({
      label: dayLabel,
      amount: Math.round(dayExpenseSum * 100) / 100,
      date: dateStr,
    });
  }

  return points;
}

/**
 * Formats a number to currency with symbol
 */
export function formatCurrency(amount: number, symbol: string = '$'): string {
  const isNegative = amount < 0;
  const absolute = Math.abs(amount);
  const formatted = absolute.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}
