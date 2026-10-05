// test-engine.js
// Automated verification for TrustLens Rule-based Analysis Engine
// Tests cases defined in SRS Section 10.2

const { analyzeInput } = require('./engine');

const runTests = () => {
  console.log('====================================================');
  console.log('🧪 TrustLens Rule Engine Automated Verification');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  const assertTest = (name, condition, details) => {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Details:`, details);
    }
  };

  // TC-01: Reward claim + shortener + Aadhaar request
  const tc1 = analyzeInput("Congratulations! You have won ₹25,000. Claim now: bit.ly/xyz. Enter your Aadhaar and PAN.");
  assertTest(
    'TC-01: Reward + Shortener + Aadhaar triggers High Risk',
    tc1.riskLevel === 'High' && tc1.findings.some(f => f.ruleId === 'R-RWD') && tc1.findings.some(f => f.ruleId === 'R-SHT'),
    tc1
  );

  // TC-02: Request for OTP only (Critical Data Override)
  const tc2 = analyzeInput("Please share the OTP you just received to proceed.");
  assertTest(
    'TC-02: Request for OTP triggers High Risk via Critical Override',
    tc2.riskLevel === 'High' && tc2.dataRequests.some(d => d.type === 'OTP' && d.sensitivity === 'Critical'),
    tc2
  );

  // TC-03: Neutral greeting message
  const tc3 = analyzeInput("Good morning! Hope you are having a wonderful weekend with family.");
  assertTest(
    'TC-03: Neutral text produces Low Risk (score = 0)',
    tc3.riskLevel === 'Low' && tc3.score === 0 && tc3.findingsCount === 0,
    tc3
  );

  // TC-04: Bank impersonation + urgency
  const tc4 = analyzeInput("SBI Alert: Your account will be blocked within 24 hours. Urgent action required.");
  assertTest(
    'TC-04: Bank Impersonation + Urgency detected',
    tc4.findings.some(f => f.ruleId === 'R-IMP') && tc4.findings.some(f => f.ruleId === 'R-URG'),
    tc4
  );

  // TC-05: Telugu scam message
  const tc5 = analyzeInput("అభినందనలు! మీరు ₹50,000 లాటరీ గెలుచుకున్నారు. వెంటనే క్లెయిమ్ చేయండి.");
  assertTest(
    'TC-05: Telugu message detected (Reward + Urgency)',
    tc5.findings.some(f => f.ruleId === 'R-RWD') && tc5.findings.some(f => f.ruleId === 'R-URG'),
    tc5
  );

  // TC-06: Hindi scam message
  const tc6 = analyzeInput("बधाई! आपने ₹25,000 का कैशबैक जीता है। तुरंत क्लेम करें।");
  assertTest(
    'TC-06: Hindi message detected (Reward + Urgency)',
    tc6.findings.some(f => f.ruleId === 'R-RWD') && tc6.findings.some(f => f.ruleId === 'R-URG'),
    tc6
  );

  console.log('\n----------------------------------------------------');
  console.log(`Results: ${passed}/${total} tests passed successfully.`);
  console.log('====================================================\n');
};

runTests();
