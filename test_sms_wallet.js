/**
 * Customer Wallet & Transactional Billing Test Suite
 * 
 * Verifies all wallet, billing, and transactional requirements:
 * 1. Verify user authentication before purchasing.
 * 2. Check wallet balance and reject insufficient funds (402).
 * 3. Check current provider price dynamically from provider.
 * 4. Reserve required funds before provider call (2-phase commit).
 * 5. Process purchase server-side.
 * 6. Record provider request ID securely.
 * 7. Deduct the correct amount exactly once on success.
 * 8. If provider purchase fails, release reserved funds immediately (zero charge).
 * 9. Idempotency: Duplicate requests with same key do not double-charge or double-purchase.
 * 10. Concurrency & Transaction Locking: Simultaneous requests cannot race or overdraw wallet.
 * 11. REST API endpoints (/api/sms/wallet, /api/sms/wallet/topup).
 */

const assert = require('assert');
const http = require('http');
const {
  BaseSmsProvider,
  SmsProviderRegistry,
  SmsOrderStore,
  SmsService,
  CustomerWallet,
  SmsBusAdapter,
  SmsProviderError,
  createSmsService,
} = require('./sms');

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

class MockSmsAdapter extends BaseSmsProvider {
  constructor(overrides = {}) {
    super('smsbus', 'SMS-BUS Mock Adapter');
    this.overrides = overrides;
    this.purchaseCount = 0;
  }
  async getBalance() {
    return { balance: 100.00 };
  }
  async fetchPrices(cId, sId) {
    if (this.overrides.prices) return this.overrides.prices;
    return [{ serviceId: Number(sId || 1), cost: 0.50, count: 100 }];
  }
  async purchaseNumber(params) {
    this.purchaseCount++;
    if (this.overrides.shouldFailPurchase) {
      throw new SmsProviderError('Upstream carrier timeout', 'PROVIDER_ERROR', 504);
    }
    return {
      providerRequestId: 'req_' + this.purchaseCount,
      number: '+17548003799',
      expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    };
  }
  getPurchaseCount() {
    return this.purchaseCount;
  }
}

function createMockAdapter(overrides = {}) {
  return new MockSmsAdapter(overrides);
}

async function main() {
  console.log('\n========================================');
  console.log('💳 Customer Wallet & Transactional Billing Suite');
  console.log('========================================');

  // Suite 1: Authentication Verification
  console.log('\n🔒 Suite 1: User Authentication Verification');

  await runAsyncTest('Rejects unauthenticated purchase attempt with 401 UNAUTHORIZED', async () => {
    const registry = new SmsProviderRegistry('smsbus');
    registry.register(createMockAdapter(), true);
    const orderStore = new SmsOrderStore({ persistToDisk: false });
    const wallet = new CustomerWallet({ persistToDisk: false });
    const service = new SmsService({ registry, orderStore, wallet });

    let threw = false;
    try {
      await service.purchaseNumber({
        customerId: 'unauthenticated',
        countryId: 1,
        serviceId: 1,
      });
    } catch (err) {
      threw = true;
      assert.strictEqual(err.statusCode, 401);
      assert.strictEqual(err.code, 'UNAUTHORIZED');
    }
    assert(threw, 'Must throw 401 UNAUTHORIZED');
  });

  // Suite 2: Balance Check & Insufficient Funds
  console.log('\n💰 Suite 2: Wallet Balance Check & Insufficient Funds (402)');

  await runAsyncTest('Rejects purchase when wallet balance is lower than provider price (402)', async () => {
    const registry = new SmsProviderRegistry('smsbus');
    registry.register(createMockAdapter(), true);
    const orderStore = new SmsOrderStore({ persistToDisk: false });
    // Customer with 0 initial credit
    const wallet = new CustomerWallet({ persistToDisk: false, initialCredit: 0.00 });
    const service = new SmsService({ registry, orderStore, wallet });

    // Deposit only $0.20 when number costs $0.50
    wallet.deposit('cust_broke', 0.20, 'Small deposit');
    const balanceBefore = wallet.getBalance('cust_broke');
    assert.strictEqual(balanceBefore.available, 0.20);

    let threw = false;
    try {
      await service.purchaseNumber({
        customerId: 'cust_broke',
        countryId: 1,
        serviceId: 1,
      });
    } catch (err) {
      threw = true;
      assert.strictEqual(err.statusCode, 402);
      assert.strictEqual(err.code, 'INSUFFICIENT_FUNDS');
      assert(err.message.includes('Insufficient wallet balance'));
    }
    assert(threw, 'Must throw 402 INSUFFICIENT_FUNDS');

    // Balance must be completely untouched
    const balanceAfter = wallet.getBalance('cust_broke');
    assert.strictEqual(balanceAfter.available, 0.20);
    assert.strictEqual(balanceAfter.reserved, 0.00);
  });

  // Suite 3: Price Verification, Reservation & Exact Deductions
  console.log('\n🛒 Suite 3: Dynamic Price Check, Fund Reservation & Deduct Exactly Once');

  await runAsyncTest('Verifies price, reserves funds, purchases number, and deducts amount exactly once', async () => {
    const registry = new SmsProviderRegistry('smsbus');
    const mockAdapter = createMockAdapter();
    registry.register(mockAdapter, true);
    const orderStore = new SmsOrderStore({ persistToDisk: false });
    const wallet = new CustomerWallet({ persistToDisk: false, initialCredit: 0.00 });
    const service = new SmsService({ registry, orderStore, wallet });

    // Customer deposits $5.00
    wallet.deposit('cust_buyer', 5.00, 'Initial deposit');
    assert.strictEqual(wallet.getBalance('cust_buyer').available, 5.00);

    // Purchase number (provider price: $0.50)
    const result = await service.purchaseNumber({
      customerId: 'cust_buyer',
      countryId: 1,
      serviceId: 1,
    });

    assert(result.order);
    assert.strictEqual(result.order.customerId, 'cust_buyer');
    assert.strictEqual(result.providerRequestId, 'req_1');
    assert.strictEqual(result.cost, 0.50);

    // Balance must be exactly $4.50 (5.00 - 0.50)
    const finalBalance = wallet.getBalance('cust_buyer');
    assert.strictEqual(finalBalance.balance, 4.50);
    assert.strictEqual(finalBalance.available, 4.50);
    assert.strictEqual(finalBalance.reserved, 0.00);

    // Verify ledger transactions
    const txs = wallet.getTransactions('cust_buyer');
    const debitTx = txs.find(t => t.type === 'PURCHASE_DEBIT');
    assert(debitTx, 'Must record PURCHASE_DEBIT transaction');
    assert.strictEqual(debitTx.amount, 0.50);
    assert.strictEqual(debitTx.balanceAfter, 4.50);
  });

  // Suite 4: Provider Failure & Funds Release Rollback
  console.log('\n↩️ Suite 4: Provider Purchase Failure & Reserved Funds Release Rollback');

  await runAsyncTest('Releases reserved funds immediately if provider purchase fails (zero charge)', async () => {
    const registry = new SmsProviderRegistry('smsbus');
    // Mock provider that fails on purchase
    const failingAdapter = createMockAdapter({ shouldFailPurchase: true });
    registry.register(failingAdapter, true);
    const orderStore = new SmsOrderStore({ persistToDisk: false });
    const wallet = new CustomerWallet({ persistToDisk: false, initialCredit: 0.00 });
    const service = new SmsService({ registry, orderStore, wallet });

    wallet.deposit('cust_rollback', 2.00, 'Deposit');
    assert.strictEqual(wallet.getBalance('cust_rollback').available, 2.00);

    let threw = false;
    try {
      await service.purchaseNumber({
        customerId: 'cust_rollback',
        countryId: 1,
        serviceId: 1,
      });
    } catch (err) {
      threw = true;
      assert.strictEqual(err.code, 'PROVIDER_ERROR');
    }
    assert(threw, 'Must bubble provider error');

    // Crucial check: Reserved funds must be released, balance remains full $2.00!
    const balanceAfterFail = wallet.getBalance('cust_rollback');
    assert.strictEqual(balanceAfterFail.balance, 2.00);
    assert.strictEqual(balanceAfterFail.reserved, 0.00);
    assert.strictEqual(balanceAfterFail.available, 2.00);

    // Ledger must show HOLD_RELEASED
    const txs = wallet.getTransactions('cust_rollback');
    const releaseTx = txs.find(t => t.type === 'HOLD_RELEASED');
    assert(releaseTx, 'Must record HOLD_RELEASED audit entry');
    assert.strictEqual(releaseTx.amount, 0.50);
  });

  // Suite 5: Idempotency Protection
  console.log('\n🔁 Suite 5: Idempotency Protection & Duplicate Charge Prevention');

  await runAsyncTest('Replaying same request with idempotencyKey returns existing order without re-charging', async () => {
    const registry = new SmsProviderRegistry('smsbus');
    const mockAdapter = createMockAdapter();
    registry.register(mockAdapter, true);
    const orderStore = new SmsOrderStore({ persistToDisk: false });
    const wallet = new CustomerWallet({ persistToDisk: false, initialCredit: 0.00 });
    const service = new SmsService({ registry, orderStore, wallet });

    wallet.deposit('cust_idemp', 3.00, 'Deposit');

    const key = 'idemp_key_unique_12345';

    // First request
    const firstRes = await service.purchaseNumber({
      customerId: 'cust_idemp',
      countryId: 1,
      serviceId: 1,
      idempotencyKey: key,
    });
    assert.strictEqual(firstRes.providerRequestId, 'req_1');
    assert.strictEqual(mockAdapter.getPurchaseCount(), 1);
    assert.strictEqual(wallet.getBalance('cust_idemp').available, 2.50);

    // Second request with SAME idempotencyKey
    const secondRes = await service.purchaseNumber({
      customerId: 'cust_idemp',
      countryId: 1,
      serviceId: 1,
      idempotencyKey: key,
    });

    // Must return the identical order
    assert.strictEqual(secondRes.order.id, firstRes.order.id);
    assert.strictEqual(secondRes.providerRequestId, 'req_1');
    assert.strictEqual(secondRes.idempotentReplay, true);

    // Must NOT have called provider a second time
    assert.strictEqual(mockAdapter.getPurchaseCount(), 1);

    // Balance must NOT have been deducted twice (still 2.50, not 2.00)
    assert.strictEqual(wallet.getBalance('cust_idemp').available, 2.50);
  });

  // Suite 6: Concurrency & Transaction Locking
  console.log('\n⚡ Suite 6: Atomic Concurrency & Transaction Locking');

  await runAsyncTest('Concurrent requests cannot double-spend or overdraw wallet', async () => {
    const registry = new SmsProviderRegistry('smsbus');
    const mockAdapter = createMockAdapter();
    registry.register(mockAdapter, true);
    const orderStore = new SmsOrderStore({ persistToDisk: false });
    const wallet = new CustomerWallet({ persistToDisk: false, initialCredit: 0.00 });
    const service = new SmsService({ registry, orderStore, wallet });

    // Customer has only $0.50 (enough for exactly ONE purchase)
    wallet.deposit('cust_race', 0.50, 'Single purchase deposit');

    // Fire 5 simultaneous purchases concurrently
    const promises = Array.from({ length: 5 }).map((_, i) =>
      service.purchaseNumber({
        customerId: 'cust_race',
        countryId: 1,
        serviceId: 1,
        idempotencyKey: `race_${i}`,
      }).then(r => ({ success: true, res: r }))
        .catch(err => ({ success: false, code: err.code }))
    );

    const results = await Promise.all(promises);

    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);

    // Exactly 1 must succeed, 4 must fail with INSUFFICIENT_FUNDS
    assert.strictEqual(successes.length, 1, 'Only 1 purchase may succeed');
    assert.strictEqual(failures.length, 4, '4 purchases must fail');
    assert(failures.every(f => f.code === 'INSUFFICIENT_FUNDS'), 'All failures must be INSUFFICIENT_FUNDS');

    // Balance must be exactly $0.00, NEVER negative
    const finalBalance = wallet.getBalance('cust_race');
    assert.strictEqual(finalBalance.balance, 0.00);
    assert.strictEqual(finalBalance.available, 0.00);
    assert.strictEqual(finalBalance.reserved, 0.00);
  });

  // Suite 7: REST API Integration
  console.log('\n🌐 Suite 7: REST API Endpoints (/api/sms/wallet)');

  const server = require('./server');
  const serverPort = 3120;
  await new Promise(resolve => server.listen(serverPort, resolve));

  async function apiCall(pathname, options = {}) {
    return new Promise((resolve, reject) => {
      const opt = {
        hostname: 'localhost',
        port: serverPort,
        path: pathname,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      };

      const req = http.request(opt, res => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          let parsed;
          try { parsed = JSON.parse(body); } catch (e) { parsed = body; }
          resolve({ status: res.statusCode, body: parsed });
        });
      });
      req.on('error', reject);
      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    });
  }

  try {
    await runAsyncTest('GET /api/sms/wallet requires customer authentication (401)', async () => {
      const res = await apiCall('/api/sms/wallet');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.code, 'UNAUTHORIZED');
    });

    await runAsyncTest('GET /api/sms/wallet returns customer balance and ledger with header', async () => {
      const res = await apiCall('/api/sms/wallet', {
        headers: { 'x-customer-id': 'cust_api_test' },
      });
      assert.strictEqual(res.status, 200);
      assert(res.body.wallet);
      assert.strictEqual(res.body.wallet.customerId, 'cust_api_test');
      assert(Array.isArray(res.body.transactions));
    });

    await runAsyncTest('POST /api/sms/wallet/topup credits customer balance', async () => {
      const topupCustId = 'cust_topup_' + Date.now();
      const res = await apiCall('/api/sms/wallet/topup', {
        method: 'POST',
        headers: { 'x-customer-id': topupCustId },
        body: { amount: 15.00, description: 'Test top-up' },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.balance, 20.00); // 5 welcome + 15 deposit
      assert.strictEqual(res.body.available, 20.00);
    });

    await runAsyncTest('POST /api/sms/orders fails with 401 when customer identity is missing', async () => {
      const res = await apiCall('/api/sms/orders', {
        method: 'POST',
        body: { countryId: 1, serviceId: 1 },
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.code, 'UNAUTHORIZED');
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
  console.error('Fatal wallet test error:', err);
  process.exit(1);
});
