import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Transaction, AppSettings, ExportTimeframe } from '../types';
import { filterTransactionsByTimeframe, formatCurrency, calculateBudgetSummary } from './calculations';

/**
 * Generates RFC 4180 compliant CSV string for transactions.
 */
export function generateCSV(
  transactions: Transaction[],
  settings: AppSettings,
  timeframe: ExportTimeframe,
  specificTransactionId?: string,
  referenceDate?: Date
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
  ];

  const escapeCSV = (field: any) => {
    if (field === undefined || field === null) return '""';
    const stringField = String(field).replace(/"/g, '""');
    return `"${stringField}"`;
  };

  const headerRow = headers.map(escapeCSV).join(',');

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
  ]);

  const csvContent = [headerRow, ...rows.map((row) => row.join(','))].join('\r\n');
  return csvContent;
}

/**
 * Generates an executive, print-ready HTML template for PDF invoices.
 */
export function generateInvoiceHTML(
  transactions: Transaction[],
  settings: AppSettings,
  timeframe: ExportTimeframe,
  specificTransactionId?: string,
  referenceDate?: Date
): string {
  const filtered = filterTransactionsByTimeframe(
    transactions,
    timeframe,
    specificTransactionId,
    referenceDate
  );
  const budget = calculateBudgetSummary(filtered, settings.thresholdAmount);
  const currency = settings.currencySymbol;

  const timeframeLabels: Record<ExportTimeframe, string> = {
    single: 'Single Transaction Receipt',
    last_week: 'Weekly Financial Statement (Last 7 Days)',
    last_month: 'Monthly Financial Statement (Last 30 Days)',
    all_time: 'Comprehensive All-Time Statement',
  };

  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
  const issueDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const rowsHtml = filtered
    .map(
      (tx, index) => `
      <tr style="background-color: ${index % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
        <td style="padding: 12px 14px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #1F2937;">${tx.date}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #E2E8F0; font-size: 13px;">
          <span style="display: inline-block; padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 11px; text-transform: uppercase; ${
            tx.type === 'contribution'
              ? 'background-color: #ECFDF5; color: #059669;'
              : 'background-color: #FEF2F2; color: #DC2626;'
          }">
            ${tx.type}
          </span>
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 500; color: #1F2937;">
          ${tx.notes || (tx.type === 'contribution' ? 'Pool Contribution' : 'Expense')}
          ${tx.receiptName ? `<br><small style="color: #64748B;">📎 ${tx.receiptName}</small>` : ''}
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #475569;">${tx.memberName}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #475569;">${tx.category || 'Contribution'}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #475569;">${tx.paymentMethod}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #E2E8F0; font-size: 14px; font-weight: 700; text-align: right; ${
          tx.type === 'contribution' ? 'color: #059669;' : 'color: #DC2626;'
        }">
          ${tx.type === 'contribution' ? '+' : '-'}${formatCurrency(tx.amount, currency)}
        </td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PocketPool Financial Statement</title>
  <style>
    @page { margin: 20mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1F2937;
      margin: 0;
      padding: 0;
      background-color: #FFFFFF;
      -webkit-print-color-adjust: exact;
    }
    .header-banner {
      background: linear-gradient(135deg, #7B66FF 0%, #5A48D6 100%);
      color: #FFFFFF;
      padding: 32px;
      border-radius: 16px;
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0 0 6px 0;
    }
    .brand-tagline {
      font-size: 13px;
      opacity: 0.9;
      margin: 0;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-number {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .invoice-date {
      font-size: 12px;
      opacity: 0.85;
      margin-top: 4px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }
    .summary-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 16px 20px;
    }
    .summary-label {
      font-size: 12px;
      color: #64748B;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .summary-value {
      font-size: 22px;
      font-weight: 800;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    th {
      background-color: #F1F5F9;
      color: #475569;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 14px;
      border-bottom: 2px solid #CBD5E1;
      text-align: left;
    }
    th.text-right { text-align: right; }
    .footer {
      border-top: 1px solid #E2E8F0;
      padding-top: 16px;
      font-size: 11px;
      color: #94A3B8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header-banner">
    <div>
      <h1 class="brand-title">PocketPool</h1>
      <p class="brand-tagline">Group: ${settings.groupName}</p>
      <p style="font-size: 13px; font-weight: 600; margin-top: 8px;">${timeframeLabels[timeframe]}</p>
    </div>
    <div class="invoice-meta">
      <div class="invoice-number">${invoiceNumber}</div>
      <div class="invoice-date">Generated: ${issueDate}</div>
      <div class="invoice-date">Currency: ${settings.currencyCode} (${settings.currencySymbol})</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-label">Total Contributions</div>
      <div class="summary-value" style="color: #059669;">+${formatCurrency(budget.totalBudget, currency)}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Total Expenses</div>
      <div class="summary-value" style="color: #DC2626;">-${formatCurrency(budget.totalExpenses, currency)}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Net Balance</div>
      <div class="summary-value" style="color: #4F46E5;">${formatCurrency(budget.remainingBudget, currency)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Type</th>
        <th>Description</th>
        <th>Member</th>
        <th>Category</th>
        <th>Payment</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="footer">
    PocketPool Local-First Financial Record &bull; 100% Confidential & Local &bull; Generated for ${settings.groupName}
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
  specificTransactionId?: string
): Promise<{ filePath: string; content: string }> {
  const content = generateCSV(transactions, settings, timeframe, specificTransactionId);
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
 * Exports data to PDF invoice and initiates system sharing / printing
 */
export async function exportToPDF(
  transactions: Transaction[],
  settings: AppSettings,
  timeframe: ExportTimeframe,
  specificTransactionId?: string
): Promise<{ uri: string; html: string }> {
  const html = generateInvoiceHTML(transactions, settings, timeframe, specificTransactionId);

  let uri = '';
  try {
    if (Print && Print.printToFileAsync) {
      const result = await Print.printToFileAsync({ html });
      uri = result.uri;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export PocketPool PDF Invoice',
          UTI: 'com.adobe.pdf',
        });
      }
    }
  } catch (err) {
    console.warn('Print service not available in this environment:', err);
  }

  return { uri, html };
}
