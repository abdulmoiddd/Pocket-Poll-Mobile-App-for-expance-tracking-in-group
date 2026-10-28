import { checkThresholdAlert } from '../src/services/calculations';

export function runThresholdAlertTests(): boolean {
  console.log('🧪 Running Test Suite: Threshold Alert Triggers...');
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

  const threshold = 300;
  const currency = '$';

  // Test 1: No alert when balance is above threshold
  const check1 = checkThresholdAlert(600, 450, threshold, currency);
  assert(check1.shouldTrigger === false, 'No alert triggered when budget drops from $600 to $450 (both above $300)');
  assert(check1.alertType === 'none', 'Alert type is "none"');

  // Test 2: Alert triggered when balance drops below threshold
  const check2 = checkThresholdAlert(350, 250, threshold, currency);
  assert(check2.shouldTrigger === true, 'Alert triggers when remaining budget drops across threshold ($350 -> $250)');
  assert(check2.alertType === 'warning', 'Alert type is "warning"');
  assert(check2.message.includes('$300.00'), 'Alert message specifies custom threshold amount');
  assert(check2.message.includes('$250.00'), 'Alert message specifies remaining balance');

  // Test 3: Alert triggered again if budget drops further while below threshold
  const check3 = checkThresholdAlert(250, 150, threshold, currency);
  assert(check3.shouldTrigger === true, 'Alert triggers if budget drops further while already below threshold ($250 -> $150)');

  // Test 4: Critical alert when budget reaches 0 or deficit
  const check4 = checkThresholdAlert(100, -20, threshold, currency);
  assert(check4.shouldTrigger === true, 'Critical alert triggers when budget reaches deficit');
  assert(check4.alertType === 'danger', 'Alert type is "danger" for deficit');
  assert(check4.message.includes('exhausted'), 'Alert message warns of exhausted budget');

  // Test 5: No alert if balance recovers above threshold (e.g. member deposits more money)
  const check5 = checkThresholdAlert(150, 800, threshold, currency);
  assert(check5.shouldTrigger === false, 'No alert triggered when deposit brings balance above threshold ($150 -> $800)');

  console.log(`✨ Threshold Alert Suite Passed: ${passed}/${total} assertions.\n`);
  return true;
}
