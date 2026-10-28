export type TransactionType = 'expense' | 'contribution';

export type ExpenseCategory =
  | 'Food'
  | 'Transport'
  | 'Shopping'
  | 'Fun'
  | 'Bills'
  | 'Other';

export type PaymentMethod =
  | 'Cash'
  | 'Credit Card'
  | 'Debit Card'
  | 'Bank Transfer'
  | 'Digital Wallet';

export interface Member {
  id: string;
  name: string;
  avatarColor: string;
  avatarText?: string;
  email?: string;
  phone?: string;
  totalContributed: number;
  totalExpensesPaid?: number;
  joinedAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  memberId: string;
  memberName: string;
  category?: ExpenseCategory;
  date: string; // ISO format YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes?: string;
  receiptUri?: string;
  receiptName?: string;
  createdAt: number;
}

export interface BudgetSummary {
  totalBudget: number;         // Total accumulated contributions
  totalExpenses: number;       // Total deducted expenses
  remainingBudget: number;     // totalBudget - totalExpenses
  percentageSpent: number;     // (totalExpenses / totalBudget) * 100
  isBelowThreshold: boolean;   // remainingBudget <= thresholdAmount
  thresholdAmount: number;     // Threshold configured by user
  activeMembersCount: number;  // Count of active contributors
}

export type ExportTimeframe = 'single' | 'last_week' | 'last_month' | 'all_time';
export type ExportFormat = 'pdf' | 'csv';

export interface AppSettings {
  currencySymbol: string;      // e.g. '$', '€', '£', '¥'
  currencyCode: string;        // 'USD', 'EUR', 'GBP', etc.
  thresholdAmount: number;     // customizable threshold, default 200
  thresholdType: 'amount' | 'percentage';
  biometricEnabled: boolean;   // Biometric auth on app launch
  pinCode: string;             // 4-digit PIN fallback
  groupName: string;           // e.g., 'PocketPool Family & Friends'
  isFirstLaunch: boolean;
}

export interface ThresholdAlert {
  id: string;
  timestamp: number;
  remainingBudget: number;
  threshold: number;
  read: boolean;
  message: string;
}

export interface CategorySummary {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  transactionCount: number;
  color: string;
  lightColor: string;
}

export interface MemberContributionSummary {
  memberId: string;
  memberName: string;
  avatarColor: string;
  totalContributed: number;
  percentageOfPool: number;
  contributionCount: number;
}

export interface SpendingTrendPoint {
  label: string;
  amount: number;
  date: string;
}
