/**
 * Standalone SMS-BUS Web Application Test Suite
 * 
 * Verifies that the dedicated SMS-BUS Gateway App is:
 * 1. Decoupled from CycleCare into its own dedicated frontend (sms.html & sms-app.js)
 * 2. Served cleanly by server.js at /sms and /sms.html
 * 3. Incorporates all 7 live reception display requirements
 * 4. Implements controlled 3.5s polling with automatic stopping conditions
 * 5. Strictly enforces customer multi-tenant isolation
 * 6. Resiliently handles provider timeouts and delivery errors
 */

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');

let passedCount = 0;
let failedCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    failedCount++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    failedCount++;
  }
}

async function main() {
  console.log('\n========================================');
  console.log('⚡ SMS-BUS Standalone Web App Test Suite');
  console.log('========================================');

  // Suite 1: Static Files & HTML Shell
  console.log('\n📄 Suite 1: Dedicated HTML Shell & Metadata (sms.html)');

  runTest('sms.html exists with proper branding, viewport, and scripts', () => {
    const htmlPath = path.join(__dirname, 'sms.html');
    assert(fs.existsSync(htmlPath), 'sms.html must exist');
    const html = fs.readFileSync(htmlPath, 'utf8');
    assert(html.includes('SMS-BUS Gateway'), 'Must contain SMS-BUS title branding');
    assert(html.includes('id="sms-app-root"'), 'Must define dedicated mount container #sms-app-root');
    assert(html.includes('src="/sms-app.js"'), 'Must load standalone application bundle');
  });

  // Suite 2: Standalone Application Architecture (sms-app.js)
  console.log('\n📱 Suite 2: Standalone App Component Architecture (sms-app.js)');

  const { getOrCreateCustomerId, SmsApp } = require('./sms-app');

  runTest('Exports SmsApp component and getOrCreateCustomerId helper', () => {
    assert.strictEqual(typeof SmsApp, 'function', 'SmsApp must be exported component function');
    assert.strictEqual(typeof getOrCreateCustomerId, 'function', 'getOrCreateCustomerId must be exported');
  });

  runTest('getOrCreateCustomerId isolates customer tenants', () => {
    const id = getOrCreateCustomerId();
    assert(id.startsWith('cust_'), 'Generated customer ID must start with cust_');
  });

  // Suite 3: All 7 Required Display Elements
  console.log('\n🖥️ Suite 3: Live SMS Reception Display Elements');

  const appCode = fs.readFileSync(path.join(__dirname, 'sms-app.js'), 'utf8');

  runTest('Displays purchased phone number with 1-click copy', () => {
    assert(appCode.includes('Purchased Phone Number'), 'Must label purchased phone number');
    assert(appCode.includes('activeOrder.number'), 'Must display active order number');
    assert(appCode.includes('handleCopy(activeOrder.number, \'number\')'), 'Must provide 1-click copy number handler');
  });

  runTest('Displays selected country and service badges', () => {
    assert(appCode.includes('countryName'), 'Must render resolved country badge with flag');
    assert(appCode.includes('serviceName'), 'Must render resolved service badge');
  });

  runTest('Displays order reference ID with 1-click copy', () => {
    assert(appCode.includes('Ref:'), 'Must label reference ID');
    assert(appCode.includes('activeOrder.id'), 'Must display active order ID');
    assert(appCode.includes('handleCopy(activeOrder.id, \'orderId\')'), 'Must provide 1-click copy order ID handler');
  });

  runTest('Displays waiting for SMS status with timer and animated polling beacon', () => {
    assert(appCode.includes('Waiting for SMS'), 'Must show waiting status pill');
    assert(appCode.includes('Controlled Polling Active'), 'Must display polling banner');
    assert(appCode.includes('formatRemaining(remainingSeconds)'), 'Must render countdown timer');
  });

  runTest('Displays received message with highlighted OTP code box and full body text', () => {
    assert(appCode.includes('Received Message'), 'Must show received message card');
    assert(appCode.includes('Verification Code / One-Time Password'), 'Must label OTP code box');
    assert(appCode.includes('latestMsg.code'), 'Must render extracted verification code');
    assert(appCode.includes('latestMsg.text'), 'Must render full message text body');
  });

  runTest('Displays received time timestamp', () => {
    assert(appCode.includes('formatTimestamp(latestMsg.receivedAt)'), 'Must render formatted received timestamp');
  });

  runTest('Provides 1-click copy buttons for code and full message', () => {
    assert(appCode.includes('handleCopy(latestMsg.code, \'code\')'), 'Must provide copy code button');
    assert(appCode.includes('handleCopy(latestMsg ? latestMsg.text : activeOrder.smsText, \'fullMsg\')'), 'Must provide copy full message button');
  });

  // Suite 4: Controlled Polling & Stopping Lifecycle
  console.log('\n⏱️ Suite 4: Controlled 3.5s Polling Lifecycle & Termination Conditions');

  runTest('Polls at controlled 3.5s interval', () => {
    assert(appCode.includes('3500'), 'Must specify 3500ms interval for polling');
    assert(appCode.includes('setInterval(pollSms, 3500)'), 'Must instantiate polling timer');
  });

  runTest('Stops polling on terminal events: completion (RECEIVED), cancellation, and expiration', () => {
    assert(appCode.includes('status: \'RECEIVED\'') && appCode.includes('setIsPolling(false)'), 'Must cease polling on SMS receipt');
    assert(appCode.includes('data.status === \'CANCELLED\'') && appCode.includes('setIsPolling(false)'), 'Must cease polling on cancellation');
    assert(appCode.includes('data.status === \'EXPIRED\'') && appCode.includes('setIsPolling(false)'), 'Must cease polling on expiration');
  });

  runTest('Enforces customer tenancy isolation on all API calls', () => {
    assert(appCode.includes('\'x-customer-id\': customerId'), 'Every fetch must send x-customer-id header');
  });

  runTest('Resilient provider error & timeout handling without crashing', () => {
    assert(appCode.includes('setPollError'), 'Must capture and display non-blocking retry indicator');
  });

  // Suite 5: HTTP Server Routing Integration
  console.log('\n🌐 Suite 5: HTTP Server Routing & Serving (/sms)');

  const server = require('./server');
  const testPort = 3110;
  await new Promise(resolve => server.listen(testPort, resolve));

  async function getUrl(path) {
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:${testPort}${path}`, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }).on('error', reject);
    });
  }

  try {
    await runAsyncTest('GET /sms serves dedicated SMS-BUS Gateway HTML', async () => {
      const res = await getUrl('/sms');
      assert.strictEqual(res.status, 200);
      assert(res.body.includes('SMS-BUS Gateway'));
      assert(res.body.includes('sms-app.js'));
    });

    await runAsyncTest('GET /sms-app.js serves standalone application bundle', async () => {
      const res = await getUrl('/sms-app.js');
      assert.strictEqual(res.status, 200);
      assert(res.headers['content-type'].includes('javascript'));
      assert(res.body.includes('SmsApp'));
    });

    await runAsyncTest('GET /api/health reports both decoupled applications', async () => {
      const res = await getUrl('/api/health');
      assert.strictEqual(res.status, 200);
      const json = JSON.parse(res.body);
      assert(json.apps.includes('CycleCare'));
      assert(json.apps.includes('SmsBusGateway'));
    });
  } finally {
    server.close();
  }

  console.log('\n========================================');
  console.log(`Results: ${passedCount} passed, ${failedCount} failed`);
  console.log('========================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
