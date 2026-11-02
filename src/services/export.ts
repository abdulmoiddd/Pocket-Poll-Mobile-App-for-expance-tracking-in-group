import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Transaction, AppSettings, ExportTimeframe } from '../types';
import {
  filterTransactionsByTimeframe,
  formatCurrency,
  calculateBudgetSummary,
  getCategorySummaries,
} from './calculations';
import { LOGO_COPY_01_SVG } from './logoAsset';

function escapeHTML(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates RFC 4180 compliant CSV string for transactions.
 */
export function generateCSV(
  transactions: Transaction[],
  settings: AppSettings,
  timeframe: ExportTimeframe,
  specificTransactionId?: string,
  referenceDate?: Date,
  poolName?: string
): string {
  const filtered = filterTransactionsByTimeframe(
    transactions,
    timeframe,
    specificTransactionId,
    referenceDate
  );

  const headers = [
    'Transaction ID',
    'Date',
    'Type',
    'Member Name',
    'Category',
    'Amount',
    'Currency',
    'Payment Method',
    'Notes',
    'Receipt Attached',
    'Budget Pool',
  ];

  const escapeCSV = (field: any) => {
    if (field === undefined || field === null) return '""';
    const stringField = String(field).replace(/"/g, '""');
    return `"${stringField}"`;
  };

  const headerRow = headers.map(escapeCSV).join(',');
  const resolvedPoolName = poolName || settings.groupName || 'Main Pool';

  const rows = filtered.map((tx) => [
    escapeCSV(tx.id),
    escapeCSV(tx.date),
    escapeCSV(tx.type.toUpperCase()),
    escapeCSV(tx.memberName || 'N/A'),
    escapeCSV(tx.category || (tx.type === 'contribution' ? 'Contribution' : 'General')),
    escapeCSV(tx.amount.toFixed(2)),
    escapeCSV(settings.currencyCode || 'USD'),
    escapeCSV(tx.paymentMethod),
    escapeCSV(tx.notes || ''),
    escapeCSV(tx.receiptName || (tx.receiptUri ? 'Yes' : 'No')),
    escapeCSV(resolvedPoolName),
  ]);

  const csvContent = [headerRow, ...rows.map((row) => row.join(','))].join('\r\n');
  return csvContent;
}

/**
 * Generates an executive, print-ready HTML template for PDF expense reports.
 * Explicitly includes:
 * 1. Isolated transparent 'logo copy-01' vector at the top header
 * 2. Clear document title dynamically reflecting the pool ('PocketPool Expense Report - [Budget Name]')
 * 3. Top summary section displaying Total Budget, Total Spent, and Remaining Balance
 * 4. Breakdown of spending by category with visual progress bars and statistics
 * 5. Structured data table of individual transactions featuring Date, Member, Category, Note, and Amount
 */
export function generateInvoiceHTML(
  transactions: Transaction[],
  settings: AppSettings,
  timeframe: ExportTimeframe,
  specificTransactionId?: string,
  referenceDate?: Date,
  poolName?: string
): string {
  const filtered = filterTransactionsByTimeframe(
    transactions,
    timeframe,
    specificTransactionId,
    referenceDate
  );
  const budget = calculateBudgetSummary(filtered, settings.thresholdAmount);
  const categorySummaries = getCategorySummaries(filtered);
  const currency = settings.currencySymbol;
  const resolvedPoolName = poolName || settings.groupName || 'Summer Trip';

  const timeframeLabels: Record<ExportTimeframe, string> = {
    single: 'Single Transaction Receipt',
    last_week: 'Weekly Financial Statement (Last 7 Days)',
    last_month: 'Monthly Financial Statement (Last 30 Days)',
    all_time: 'Comprehensive All-Time Statement',
  };

  const reportId = `INV-${Date.now().toString().slice(-6)}`;
  const issueDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Table rows with explicit columns: Date, Member, Category, Note, Amount
  const rowsHtml =
    filtered.length > 0
      ? filtered
          .map(
            (tx, index) => `
        <tr style="background-color: ${index % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
          <td class="col-date">${escapeHTML(tx.date)}</td>
          <td class="col-member">
            <div class="member-container">
              <span class="member-badge">${escapeHTML(
                (tx.memberName || 'PP').slice(0, 2).toUpperCase()
              )}</span>
              <span class="member-name">${escapeHTML(tx.memberName || 'N/A')}</span>
            </div>
          </td>
          <td class="col-category">
            <span class="category-chip ${tx.type === 'contribution' ? 'chip-contribution' : 'chip-expense'}">
              ${escapeHTML(tx.category || (tx.type === 'contribution' ? 'Contribution' : 'Other'))}
            </span>
          </td>
          <td class="col-note">
            <div class="note-main">${escapeHTML(
              tx.notes || (tx.type === 'contribution' ? 'Pool Contribution' : 'Expense')
            )}</div>
            ${
              tx.receiptName
                ? `<div class="receipt-pill">📎 ${escapeHTML(tx.receiptName)}</div>`
                : ''
            }
          </td>
          <td class="col-amount text-right ${
            tx.type === 'contribution' ? 'amount-positive' : 'amount-negative'
          }">
            ${tx.type === 'contribution' ? '+' : '-'}${formatCurrency(tx.amount, currency)}
          </td>
        </tr>
      `
          )
          .join('')
      : `
        <tr>
          <td colspan="5" class="empty-table-cell">No transactions found for this reporting timeframe.</td>
        </tr>
      `;

  // Category breakdown section HTML
  const categoryBreakdownHtml =
    categorySummaries.length > 0
      ? `
    <div class="category-grid">
      ${categorySummaries
        .map(
          (cat) => `
        <div class="category-card">
          <div class="cat-header">
            <div class="cat-title-group">
              <span class="cat-color-dot" style="background-color: ${cat.color};"></span>
              <span class="cat-name">${escapeHTML(cat.category)}</span>
            </div>
            <span class="cat-pct">${cat.percentage.toFixed(1)}%</span>
          </div>
          <div class="cat-amount" style="color: ${cat.color};">
            ${formatCurrency(cat.amount, currency)}
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${Math.min(
              100,
              Math.max(4, cat.percentage)
            )}%; background-color: ${cat.color};"></div>
          </div>
          <div class="cat-meta">${cat.transactionCount} ${
            cat.transactionCount === 1 ? 'expense' : 'expenses'
          }</div>
        </div>
      `
        )
        .join('')}
    </div>
  `
      : `
    <div class="empty-category-note">
      No categorized expenses recorded in this reporting period.
    </div>
  `;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>PocketPool Expense Report - ${escapeHTML(resolvedPoolName)}</title>
  <style>
    @page {
      margin: 14mm 16mm;
      size: A4 portrait;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1F2937;
      margin: 0;
      padding: 0;
      background-color: #FFFFFF;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Executive Top Purple Gradient Banner */
    .header-banner {
      background: linear-gradient(135deg, #7B66FF 0%, #5A48D6 100%);
      color: #FFFFFF;
      padding: 24px 28px;
      border-radius: 18px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 14px rgba(90, 72, 214, 0.2);
    }
    .brand-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo-container {
      width: 58px;
      height: 58px;
      background: rgba(255, 255, 255, 0.16);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
      flex-shrink: 0;
    }
    .logo-container svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0 0 2px 0;
      color: #FFFFFF;
    }
    .report-title {
      font-size: 18px;
      font-weight: 700;
      margin: 2px 0 4px 0;
      color: #FFFFFF;
      letter-spacing: -0.2px;
    }
    .brand-tagline {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
      font-weight: 500;
    }
    .report-meta {
      text-align: right;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 10px 14px;
      border-radius: 12px;
    }
    .report-id {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #FFFFFF;
    }
    .report-date {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.85);
      margin-top: 3px;
    }
    .report-pool-tag {
      display: inline-block;
      margin-top: 6px;
      background: #FFFFFF;
      color: #5A48D6;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 20px;
    }

    /* Top Summary Section: Total Budget, Total Spent, Remaining Balance */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 24px;
    }
    .summary-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 14px 18px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
    }
    .summary-label-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 2px;
    }
    .summary-label {
      font-size: 12px;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .summary-sublabel {
      font-size: 10px;
      color: #94A3B8;
      font-weight: 600;
    }
    .summary-value {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.3px;
      margin-top: 2px;
    }
    .summary-value.budget-green { color: #059669; }
    .summary-value.budget-red { color: #DC2626; }
    .summary-value.budget-indigo { color: #4F46E5; }
    .summary-footnote {
      font-size: 10px;
      color: #64748B;
      margin-top: 4px;
      font-weight: 500;
    }

    /* Section Headings */
    .section-title {
      font-size: 14px;
      font-weight: 800;
      color: #1E293B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 12px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Breakdown of Spending by Category */
    .category-section {
      margin-bottom: 24px;
    }
    .category-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .category-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 12px 14px;
    }
    .cat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .cat-title-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .cat-color-dot {
      width: 10px;
      height: 10px;
      border-radius: 5px;
      display: inline-block;
    }
    .cat-name {
      font-size: 12px;
      font-weight: 700;
      color: #1F2937;
    }
    .cat-pct {
      font-size: 11px;
      font-weight: 700;
      color: #64748B;
    }
    .cat-amount {
      font-size: 16px;
      font-weight: 800;
      margin-bottom: 6px;
    }
    .progress-track {
      width: 100%;
      height: 6px;
      background: #E2E8F0;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 4px;
    }
    .progress-fill {
      height: 100%;
      border-radius: 3px;
    }
    .cat-meta {
      font-size: 10px;
      color: #94A3B8;
      font-weight: 500;
    }
    .empty-category-note {
      background: #F8FAFC;
      border: 1px dashed #CBD5E1;
      border-radius: 10px;
      padding: 14px;
      text-align: center;
      font-size: 12px;
      color: #64748B;
    }

    /* Structured Data Table: Date, Member, Category, Note, Amount */
    .table-container {
      margin-bottom: 24px;
    }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      overflow: hidden;
    }
    th {
      background-color: #F1F5F9;
      color: #475569;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 14px;
      border-bottom: 2px solid #CBD5E1;
      text-align: left;
    }
    th.text-right { text-align: right; }
    td {
      padding: 10px 14px;
      border-bottom: 1px solid #E2E8F0;
      font-size: 12px;
      vertical-align: middle;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .col-date {
      color: #475569;
      font-weight: 600;
      white-space: nowrap;
      width: 100px;
    }
    .col-member {
      width: 140px;
    }
    .member-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .member-badge {
      width: 24px;
      height: 24px;
      border-radius: 12px;
      background: #6366F1;
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .member-name {
      font-weight: 600;
      color: #1F2937;
    }
    .col-category {
      width: 110px;
    }
    .category-chip {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .chip-contribution {
      background-color: #ECFDF5;
      color: #059669;
      border: 1px solid #A7F3D0;
    }
    .chip-expense {
      background-color: #F1F5F9;
      color: #334155;
      border: 1px solid #E2E8F0;
    }
    .col-note {
      color: #1F2937;
    }
    .note-main {
      font-weight: 500;
    }
    .receipt-pill {
      font-size: 10px;
      color: #64748B;
      margin-top: 2px;
    }
    .col-amount {
      font-size: 13px;
      font-weight: 800;
      white-space: nowrap;
      width: 110px;
    }
    .amount-positive { color: #059669; }
    .amount-negative { color: #DC2626; }
    .empty-table-cell {
      text-align: center;
      color: #94A3B8;
      padding: 24px;
      font-style: italic;
    }

    /* Footer */
    .report-footer {
      border-top: 1px solid #E2E8F0;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #94A3B8;
    }
  </style>
</head>
<body>

  <!-- Top Header Banner with Isolated Transparent Logo copy-01 -->
  <div class="header-banner">
    <div class="brand-left">
      <div class="logo-container" id="logo-copy-01-container" data-asset="logo copy-01">
        ${LOGO_COPY_01_SVG}
      </div>
      <div>
        <h1 class="brand-title">PocketPool</h1>
        <h2 class="report-title">PocketPool Expense Report - ${escapeHTML(resolvedPoolName)}</h2>
        <p class="brand-tagline">
          ${timeframeLabels[timeframe]} &bull; Group: ${escapeHTML(settings.groupName)}
        </p>
      </div>
    </div>
    <div class="report-meta">
      <div class="report-id">${reportId}</div>
      <div class="report-date">${issueDate}</div>
      <div class="report-pool-tag">${escapeHTML(resolvedPoolName)}</div>
    </div>
  </div>

  <!-- Top Summary Section: Total Budget, Total Spent, Remaining Balance -->
  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-label-row">
        <span class="summary-label">Total Budget</span>
        <span class="summary-sublabel">Total Contributions</span>
      </div>
      <div class="summary-value budget-green">+${formatCurrency(budget.totalBudget, currency)}</div>
      <div class="summary-footnote">${filtered.filter((t) => t.type === 'contribution').length} contributions</div>
    </div>
    <div class="summary-card">
      <div class="summary-label-row">
        <span class="summary-label">Total Spent</span>
        <span class="summary-sublabel">Total Expenses</span>
      </div>
      <div class="summary-value budget-red">-${formatCurrency(budget.totalExpenses, currency)}</div>
      <div class="summary-footnote">${filtered.filter((t) => t.type === 'expense').length} recorded expenses</div>
    </div>
    <div class="summary-card">
      <div class="summary-label-row">
        <span class="summary-label">Remaining Balance</span>
        <span class="summary-sublabel">Net Balance</span>
      </div>
      <div class="summary-value ${budget.remainingBudget < 0 ? 'budget-red' : 'budget-indigo'}">
        ${formatCurrency(budget.remainingBudget, currency)}
      </div>
      <div class="summary-footnote">${budget.percentageSpent}% budget utilized</div>
    </div>
  </div>

  <!-- Breakdown of Spending by Category -->
  <div class="category-section">
    <h3 class="section-title">Breakdown of Spending by Category</h3>
    ${categoryBreakdownHtml}
  </div>

  <!-- Clean Structured Data Table: Date, Member, Category, Note, Amount -->
  <div class="table-container">
    <h3 class="section-title">Individual Transaction Records</h3>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Member</th>
          <th>Category</th>
          <th>Note</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>

  <!-- Confidentiality & Local-First Footer -->
  <div class="report-footer">
    <span>PocketPool Local-First Financial Record &bull; Generated for ${escapeHTML(resolvedPoolName)}</span>
    <span>100% Confidential & Local &bull; Currency: ${escapeHTML(settings.currencyCode)} (${escapeHTML(
      currency
    )})</span>
  </div>

</body>
</html>
`;
}

/**
 * Exports data to CSV file and initiates system sharing dialog
 */
export async function exportToCSV(
  transactions: Transaction[],
  settings: AppSettings,
  timeframe: ExportTimeframe,
  specificTransactionId?: string,
  poolName?: string
): Promise<{ filePath: string; content: string }> {
  const content = generateCSV(
    transactions,
    settings,
    timeframe,
    specificTransactionId,
    undefined,
    poolName
  );
  const filename = `PocketPool_${timeframe}_${Date.now()}.csv`;
  const filePath = `${(FileSystem as any).documentDirectory || ''}${filename}`;

  try {
    if (FileSystem && FileSystem.writeAsStringAsync) {
      await FileSystem.writeAsStringAsync(filePath, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Export PocketPool CSV Report',
          UTI: 'public.comma-separated-values-text',
        });
      }
    }
  } catch (err) {
    console.warn('File system sharing not available in this environment:', err);
  }

  return { filePath, content };
}

/**
 * Exports data to PDF report and initiates system sharing / printing
 */
export async function exportToPDF(
  transactions: Transaction[],
  settings: AppSettings,
  timeframe: ExportTimeframe,
  specificTransactionId?: string,
  poolName?: string
): Promise<{ uri: string; html: string }> {
  const html = generateInvoiceHTML(
    transactions,
    settings,
    timeframe,
    specificTransactionId,
    undefined,
    poolName
  );

  let uri = '';
  try {
    if (Print && Print.printToFileAsync) {
      const result = await Print.printToFileAsync({ html });
      uri = result.uri;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export PocketPool PDF Report',
          UTI: 'com.adobe.pdf',
        });
      }
    }
  } catch (err) {
    console.warn('Print service not available in this environment:', err);
  }

  return { uri, html };
}
