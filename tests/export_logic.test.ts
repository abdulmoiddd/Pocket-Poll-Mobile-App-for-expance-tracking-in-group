import {
  generateCSV,
  generateInvoiceHTML,
} from '../src/services/export';
import { filterTransactionsByTimeframe } from '../src/services/calculations';
import { Transaction, AppSettings } from '../src/types';

export function runExportLogicTests(): boolean {
  console.log('🧪 Running Test Suite: PDF & CSV Export Logic...');
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

  const mockSettings: AppSettings = {
    currencySymbol: '€',
    currencyCode: 'EUR',
    thresholdAmount: 250,
    thresholdType: 'amount',
    biometricEnabled: true,
    pinCode: '4321',
    groupName: 'Alpine Ski Trip 2026',
    isFirstLaunch: false,
  };

  const refDate = new Date('2026-10-28T12:00:00Z');

  const testTransactions: Transaction[] = [
    {
      id: 'tx_1',
      type: 'contribution',
      amount: 1000,
      memberId: 'mem_1',
      memberName: 'Marco Rossi',
      date: '2026-10-26', // 2 days ago (last week)
      paymentMethod: 'Bank Transfer',
      notes: 'Initial ski pool contribution',
      createdAt: refDate.getTime() - 2 * 86400000,
    },
    {
      id: 'tx_2',
      type: 'expense',
      amount: 320,
      memberId: 'mem_1',
      memberName: 'Marco Rossi',
      category: 'Food',
      date: '2026-10-24', // 4 days ago (last week)
      paymentMethod: 'Credit Card',
      notes: 'Mountain hut dinner, "special wine"',
      receiptName: 'dinner_receipt.pdf',
      createdAt: refDate.getTime() - 4 * 86400000,
    },
    {
      id: 'tx_3',
      type: 'expense',
      amount: 450,
      memberId: 'mem_2',
      memberName: 'Sophie Dubois',
      category: 'Bills',
      date: '2026-10-10', // 18 days ago (last month, but NOT last week)
      paymentMethod: 'Credit Card',
      notes: 'Chalet deposit',
      createdAt: refDate.getTime() - 18 * 86400000,
    },
    {
      id: 'tx_4',
      type: 'contribution',
      amount: 800,
      memberId: 'mem_2',
      memberName: 'Sophie Dubois',
      date: '2026-08-15', // 74 days ago (all time, NOT last month)
      paymentMethod: 'Digital Wallet',
      notes: 'Early bird deposit',
      createdAt: refDate.getTime() - 74 * 86400000,
    },
  ];

  // Test 1: Timeframe Filtering
  const singleFilter = filterTransactionsByTimeframe(testTransactions, 'single', 'tx_2', refDate);
  assert(singleFilter.length === 1 && singleFilter[0].id === 'tx_2', 'Timeframe filter "single" returns exactly the specified transaction');

  const weekFilter = filterTransactionsByTimeframe(testTransactions, 'last_week', undefined, refDate);
  assert(weekFilter.length === 2, 'Timeframe filter "last_week" returns 2 transactions within 7 days');

  const monthFilter = filterTransactionsByTimeframe(testTransactions, 'last_month', undefined, refDate);
  assert(monthFilter.length === 3, 'Timeframe filter "last_month" returns 3 transactions within 30 days');

  const allFilter = filterTransactionsByTimeframe(testTransactions, 'all_time', undefined, refDate);
  assert(allFilter.length === 4, 'Timeframe filter "all_time" returns all 4 historical transactions');

  // Test 2: CSV Formatting Logic
  const csvWeek = generateCSV(testTransactions, mockSettings, 'last_week', undefined, refDate);
  assert(csvWeek.startsWith('"Transaction ID","Date","Type"'), 'CSV export starts with valid column headers');
  assert(csvWeek.includes('"Marco Rossi"'), 'CSV includes member names');
  assert(csvWeek.includes('"EUR"'), 'CSV includes configured currency code');
  assert(csvWeek.includes('dinner_receipt.pdf'), 'CSV preserves receipt attachments');
  assert(csvWeek.includes('""special wine""'), 'CSV correctly escapes quotes in notes per RFC 4180');

  // Test 3: PDF Invoice HTML Template Generation
  const pdfHTML = generateInvoiceHTML(testTransactions, mockSettings, 'all_time', undefined, refDate);
  assert(pdfHTML.includes('PocketPool'), 'PDF Invoice HTML includes PocketPool branding');
  assert(pdfHTML.includes('Alpine Ski Trip 2026'), 'PDF Invoice HTML includes custom group name');
  assert(pdfHTML.includes('INV-'), 'PDF Invoice HTML generates invoice number');
  assert(pdfHTML.includes('Total Contributions'), 'PDF Invoice HTML includes Total Contributions card');
  assert(pdfHTML.includes('Total Expenses'), 'PDF Invoice HTML includes Total Expenses card');
  assert(pdfHTML.includes('Net Balance'), 'PDF Invoice HTML includes Net Balance calculation');
  assert(pdfHTML.includes('€'), 'PDF Invoice HTML applies user-selected currency symbol (€)');

  // Test 4: Single Transaction Receipt Invoice HTML
  const singlePdfHTML = generateInvoiceHTML(testTransactions, mockSettings, 'single', 'tx_2');
  assert(singlePdfHTML.includes('Single Transaction Receipt'), 'Single receipt includes Single Transaction Receipt title');
  assert(singlePdfHTML.includes('320.00'), 'Single receipt includes exact transaction amount');

  console.log(`✨ Export Logic Suite Passed: ${passed}/${total} assertions.\n`);
  return true;
}
