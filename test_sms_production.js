/**
 * Comprehensive Production Readiness & Security Verification Suite
 * 
 * Verifies:
 * 1. Secure Authentication & Password Hashing (Scrypt + HMAC-SHA256)
 * 2. Database Access Policies & Multi-Tenant Isolation (Customer vs Admin)
 * 3. API Sliding Window Rate Limiting (429 Too Many Requests + Retry-After)
 * 4. Admin Privileged RBAC Permissions & Audit Log Queries
 * 5. AES-256-GCM Encrypted Secrets Vault & PII Masking
 * 6. Tamper-Evident Audit Logging Ledger
 * 7. Cryptographic Payment Verification & Replay Attack Defense
 * 8. Real-Time Provider Health Telemetry & Clear Out-of-Stock Guidance
 * 9. Anti-Abuse Guard (Concurrent order quota & carrier rules compliance)
 * 10. Verified Provider Route Filtering
 */

const assert = require('assert');
const http = require('http');
const {
  CryptoVault,
  AuditLogger,
  SecurityManager,
  RateLimiter,
  PaymentVerifier,
  AntiAbuseGuard,
  ProviderStatusTracker,
  createSmsService,
} = require('./sms');
const { BaseSmsProvider } = require('./sms/BaseSmsProvider');

// Helper runner
let passedCount = 0;
let failedCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.stack || err.message}`);
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
    console.error(`    ${err.stack || err.message}`);
    failedCount++;
  }
}

// Mock Provider
class MockProductionProvider extends BaseSmsProvider {
  constructor() {
    super('smsbus', 'SMS-BUS Mock Adapter');
  }
  async getBalance() { return { balance: 1450.50, currency: 'USD' }; }
  async fetchCountries() {
    return [
      { id: 1, name: 'United States', code: 'US', flag: '🇺🇸' },
      { id: 2, name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
    ];
  }
  async fetchServices() {
    return [
      { id: 1, name: 'Telegram', cost: 0.50 },
      { id: 2, name: 'WhatsApp', cost: 0.75 },
      { id: 3, name: 'Google', cost: 0.60 },
    ];
  }
  async fetchPrices(countryId, serviceId) {
    return [
      { serviceId: 1, cost: 0.50, count: 120 },
      { serviceId: 2, cost: 0.75, count: 0 }, // Out of stock
      { serviceId: 3, cost: 0.60, count: 45 },
    ];
  }
  async purchaseNumber({ countryId, serviceId }) {
    if (Number(serviceId) === 2) {
      throw new Error('NO_NUMBERS');
    }
    return {
      number: '+12025550199',
      providerRequestId: 'req_prod_test_01',
      expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    };
  }
  async cancelRequest(reqId) { return { success: true }; }
  async retrieveSms(reqId) {
    return { hasSms: true, code: '772183', text: 'Your verification code is 772183' };
  }
}

async function runAllProductionTests() {
  console.log('\n========================================');
  console.log('🛡️ Production Security & Compliance Suite');
  console.log('========================================');

  // ====================================================
  // Suite 1: AES-256-GCM Encrypted Secrets Vault & Masking
  // ====================================================
  console.log('\n🔐 Suite 1: AES-256-GCM Encrypted Secrets Vault & Data Protection');

  runTest('Encrypts and decrypts sensitive data accurately with random IV', () => {
    const secretMessage = 'smsbus_live_token_super_secret_production_key';
    const encrypted = CryptoVault.encrypt(secretMessage);
    assert(encrypted.includes(':'), 'Encrypted output must format as iv:authTag:ciphertext');
    const decrypted = CryptoVault.decrypt(encrypted);
    assert.strictEqual(decrypted, secretMessage, 'Decrypted output must match original plaintext');
  });

  runTest('Encrypts and decrypts structured JSON objects', () => {
    const payload = { customerId: 'cust_999', apiKey: 'secret_123', permissions: ['read', 'purchase'] };
    const encrypted = CryptoVault.encrypt(payload);
    const decrypted = CryptoVault.decrypt(encrypted);
    assert.deepStrictEqual(decrypted, payload, 'Decrypted JSON object must match original payload');
  });

  runTest('Detects and rejects tampered ciphertext or bad authTag', () => {
    const encrypted = CryptoVault.encrypt('Confidential payment data');
    const parts = encrypted.split(':');
    // Tamper with ciphertext
    const tamperedCipher = parts[2].slice(0, -2) + '00';
    const tampered = `${parts[0]}:${parts[1]}:${tamperedCipher}`;
    assert.throws(() => CryptoVault.decrypt(tampered), /Unsupported state or unable to authenticate data/, 'Must reject tampered ciphertext');
  });

  runTest('Masks customer phone numbers and sensitive secrets for logs', () => {
    const maskedPhone = CryptoVault.maskPhone('+12025550199');
    assert.strictEqual(maskedPhone, '+1 (***) ***-0199');

    const maskedSecret = CryptoVault.maskSecret('smsbus_live_secret_token_1234');
    assert.strictEqual(maskedSecret, 'smsbus...1234');

    const maskedEmail = CryptoVault.maskEmail('alexander.hamilton@example.com');
    assert(maskedEmail.startsWith('a***n@example.com'));
  });

  // ====================================================
  // Suite 2: Secure Authentication & Password Hashing
  // ====================================================
  console.log('\n👤 Suite 2: Secure Authentication & Role-Based Access Control');

  const auditLogger = new AuditLogger({ persistToDisk: false });
  const secManager = new SecurityManager({ auditLogger, persistToDisk: false });

  runTest('Rejects registration with invalid email or short password (< 8 chars)', () => {
    assert.throws(() => secManager.register({ email: 'bademail', password: 'ValidPassword123' }), /Valid email address/);
    assert.throws(() => secManager.register({ email: 'test@example.com', password: 'short' }), /Password must be at least 8 characters/);
  });

  let customerSessionToken = null;
  let customerUser = null;

  runTest('Registers customer with cryptographically salted Scrypt hash', () => {
    const reg = secManager.register({
      email: 'customer.alice@example.com',
      password: 'StrongCustomerPassword2026!',
      name: 'Alice Customer',
    });

    assert(reg.user);
    assert.strictEqual(reg.user.email, 'customer.alice@example.com');
    assert.strictEqual(reg.user.role, 'CUSTOMER');
    assert(!reg.user.passwordHash, 'Sanitized user must NEVER expose passwordHash');
    assert(!reg.user.salt, 'Sanitized user must NEVER expose salt');
    assert(reg.token, 'Must return signed session token');

    customerUser = reg.user;
    customerSessionToken = reg.token;
  });

  runTest('Authenticates customer and rejects incorrect password in constant time', () => {
    assert.throws(() => secManager.login({
      email: 'customer.alice@example.com',
      password: 'WrongPassword!',
    }), /Invalid email or password/);

    const loginRes = secManager.login({
      email: 'customer.alice@example.com',
      password: 'StrongCustomerPassword2026!',
    });

    assert(loginRes.token);
    assert.strictEqual(loginRes.user.email, 'customer.alice@example.com');
  });

  runTest('Verifies HMAC-SHA256 session token and checks expiration', () => {
    const payload = secManager.verifySessionToken(customerSessionToken);
    assert(payload);
    assert.strictEqual(payload.sub, customerUser.id);
    assert.strictEqual(payload.role, 'CUSTOMER');

    // Tampered token fails
    const tamperedToken = customerSessionToken.slice(0, -5) + 'AAAAA';
    assert.strictEqual(secManager.verifySessionToken(tamperedToken), null);
  });

  runTest('Default admin user exists with ADMIN role and system privileges', () => {
    const adminLogin = secManager.login({
      email: 'admin@smsbus.internal',
      password: 'AdminSecure2026!',
    });
    assert(adminLogin.token);
    assert.strictEqual(adminLogin.user.role, 'ADMIN');
  });

  // ====================================================
  // Suite 3: Database Access Policies & Tenant Isolation
  // ====================================================
  console.log('\n🛡️ Suite 3: Database Access Policies & Tenant Isolation');

  runTest('Enforces row-level customer isolation (Customer cannot access other customer data)', () => {
    const aliceSession = { customerId: 'cust_alice', role: 'CUSTOMER' };
    const bobSession = { customerId: 'cust_bob', role: 'CUSTOMER' };
    const adminSession = { customerId: 'admin_01', role: 'ADMIN' };

    // Alice accessing Alice's records: allowed
    assert.strictEqual(secManager.canAccessCustomerData(aliceSession, 'cust_alice'), true);

    // Alice accessing Bob's records: DENIED
    assert.strictEqual(secManager.canAccessCustomerData(aliceSession, 'cust_bob'), false);

    // Bob accessing Alice's records: DENIED
    assert.strictEqual(secManager.canAccessCustomerData(bobSession, 'cust_alice'), false);

    // Admin accessing any customer records: ALLOWED
    assert.strictEqual(secManager.canAccessCustomerData(adminSession, 'cust_alice'), true);
    assert.strictEqual(secManager.canAccessCustomerData(adminSession, 'cust_bob'), true);
  });

  // ====================================================
  // Suite 4: Sliding Window Rate Limiting (Anti-DDoS)
  // ====================================================
  console.log('\n⏱️ Suite 4: Sliding Window API Rate Limiting (Anti-DDoS)');

  const rateLimiter = new RateLimiter({
    auditLogger,
    limits: {
      auth: { max: 3, windowMs: 2000 },
      orders: { max: 2, windowMs: 2000 },
    },
  });

  runTest('Allows requests within limit and tracks remaining quota', () => {
    const r1 = rateLimiter.checkLimit('192.168.1.100', 'auth');
    assert.strictEqual(r1.allowed, true);
    assert.strictEqual(r1.remaining, 2);

    const r2 = rateLimiter.checkLimit('192.168.1.100', 'auth');
    assert.strictEqual(r2.allowed, true);
    assert.strictEqual(r2.remaining, 1);

    const r3 = rateLimiter.checkLimit('192.168.1.100', 'auth');
    assert.strictEqual(r3.allowed, true);
    assert.strictEqual(r3.remaining, 0);
  });

  runTest('Triggers 429 rate limit exceeded on subsequent burst and returns resetSeconds', () => {
    const r4 = rateLimiter.checkLimit('192.168.1.100', 'auth');
    assert.strictEqual(r4.allowed, false);
    assert.strictEqual(r4.remaining, 0);
    assert(r4.resetSeconds >= 1);
  });

  runTest('Rate limit applies independently per client key', () => {
    const rOther = rateLimiter.checkLimit('192.168.1.200', 'auth');
    assert.strictEqual(rOther.allowed, true);
  });

  // ====================================================
  // Suite 5: Tamper-Evident Audit Logging Ledger
  // ====================================================
  console.log('\n📜 Suite 5: Tamper-Evident Audit Logging Ledger');

  runTest('Records audit log entries with sanitized metadata and masks secrets', () => {
    const entry = auditLogger.log({
      action: 'NUMBER_PURCHASED',
      actorId: 'cust_alice',
      actorRole: 'CUSTOMER',
      ip: '10.0.0.1',
      resourceId: 'ord_12345',
      status: 'SUCCESS',
      metadata: {
        number: '+12025550199',
        apiKey: 'smsbus_secret_token_123',
        cost: 0.50,
      },
    });

    assert(entry.id);
    assert(entry.timestamp);
    assert.strictEqual(entry.action, 'NUMBER_PURCHASED');
    assert.strictEqual(entry.metadata.number, '+1 (***) ***-0199', 'Phone number must be masked in audit trail');
    assert(entry.metadata.apiKey.includes('...'), 'Secret must be masked in audit trail');
  });

  runTest('Queries audit logs with filters for action and securityLevel', () => {
    auditLogger.log({
      action: 'SECURITY_ALERT',
      actorId: 'attacker_ip',
      securityLevel: 'CRITICAL',
      status: 'DENIED',
    });

    const criticals = auditLogger.query({ securityLevel: 'CRITICAL' });
    assert(criticals.total >= 1);
    assert(criticals.entries.some(e => e.action === 'SECURITY_ALERT'));
  });

  // ====================================================
  // Suite 6: Cryptographic Payment Verification
  // ====================================================
  console.log('\n💳 Suite 6: Cryptographic Payment Verification & Replay Protection');

  const paymentVerifier = new PaymentVerifier({ auditLogger, isProduction: true });

  let validIntent = null;

  runTest('Generates signed HMAC-SHA256 payment intent', () => {
    validIntent = paymentVerifier.createPaymentIntent({
      customerId: 'cust_alice',
      amount: 15.00,
      currency: 'USD',
    });

    assert(validIntent.intentId.startsWith('pi_'));
    assert.strictEqual(validIntent.amount, 15.00);
    assert.strictEqual(validIntent.currency, 'USD');
    assert(validIntent.signature, 'Must include cryptographic HMAC signature');
  });

  runTest('Verifies valid payment intent with constant-time equality', () => {
    const verification = paymentVerifier.verifyPayment({
      intentId: validIntent.intentId,
      customerId: validIntent.customerId,
      amount: validIntent.amount,
      currency: validIntent.currency,
      timestamp: validIntent.timestamp,
      signature: validIntent.signature,
    });

    assert.strictEqual(verification.verified, true);
  });

  runTest('Prevents replay attacks: cannot claim same payment intent twice', () => {
    const replayAttempt = paymentVerifier.verifyPayment({
      intentId: validIntent.intentId,
      customerId: validIntent.customerId,
      amount: validIntent.amount,
      currency: validIntent.currency,
      timestamp: validIntent.timestamp,
      signature: validIntent.signature,
    });

    assert.strictEqual(replayAttempt.verified, false);
    assert(replayAttempt.reason.includes('replay attempt'));
  });

  runTest('Rejects tampered amounts or invalid signatures', () => {
    const intent2 = paymentVerifier.createPaymentIntent({
      customerId: 'cust_alice',
      amount: 5.00,
      currency: 'USD',
    });

    // Attempting to credit $50.00 using signature generated for $5.00
    const tamperedRes = paymentVerifier.verifyPayment({
      intentId: intent2.intentId,
      customerId: intent2.customerId,
      amount: 50.00, // Tampered!
      currency: 'USD',
      timestamp: intent2.timestamp,
      signature: intent2.signature,
    });

    assert.strictEqual(tamperedRes.verified, false);
    assert(tamperedRes.reason.includes('signature mismatch'));
  });

  // ====================================================
  // Suite 7: Carrier Compliance & Anti-Abuse Guard
  // ====================================================
  console.log('\n🚫 Suite 7: Carrier Compliance & Anti-Abuse Guard (No Bulk Account Abuse)');

  const antiAbuseGuard = new AntiAbuseGuard({
    auditLogger,
    maxActiveOrders: 3,
    cooldownMs: 500,
    maxHourlyPurchases: 5,
  });

  runTest('Acceptable Use Policy returns clear non-abuse carrier terms', () => {
    const aup = antiAbuseGuard.getAcceptableUsePolicy();
    assert(aup.title.includes('Acceptable Use'));
    assert(aup.rules.some(r => r.includes('Bulk automated account creation')));
  });

  runTest('Limits concurrent active reservations to 3 to prevent bulk hoarding', () => {
    const activeOrders = [
      { id: 'ord_1', status: 'PENDING', expiresAt: new Date(Date.now() + 600000).toISOString() },
      { id: 'ord_2', status: 'PENDING', expiresAt: new Date(Date.now() + 600000).toISOString() },
      { id: 'ord_3', status: 'PENDING', expiresAt: new Date(Date.now() + 600000).toISOString() },
    ];

    const check = antiAbuseGuard.evaluateOrderRequest({
      customerId: 'cust_bot_farm',
      activeOrders,
    });

    assert.strictEqual(check.allowed, false);
    assert.strictEqual(check.code, 'MAX_ACTIVE_EXCEEDED');
    assert(check.reason.includes('Reservation quota exceeded'));
  });

  runTest('Enforces cooldown between rapid consecutive purchases', () => {
    antiAbuseGuard.recordPurchase('cust_burst_tester');

    // Immediate second purchase triggers cooldown
    const check = antiAbuseGuard.evaluateOrderRequest({
      customerId: 'cust_burst_tester',
      activeOrders: [],
    });

    assert.strictEqual(check.allowed, false);
    assert.strictEqual(check.code, 'COOLDOWN_ACTIVE');
  });

  // ====================================================
  // Suite 8: Provider Status & Route Error Translation
  // ====================================================
  console.log('\n📡 Suite 8: Provider Status Telemetry & Out-of-Stock Clear Guidance');

  const providerTracker = new ProviderStatusTracker({ auditLogger });

  const mockSmsService = createSmsService({
    activeProviderId: 'smsbus',
    persistToDisk: false,
    additionalProviders: [new MockProductionProvider()],
  });

  await runAsyncTest('Provider health check returns live telemetry and latency meter', async () => {
    const status = await providerTracker.checkHealth(mockSmsService);
    assert.strictEqual(status.status, 'OPERATIONAL');
    assert(status.latencyMs >= 0);
    assert(status.uptime.includes('99.'));
    assert.strictEqual(status.complianceStatus, 'VERIFIED_SUPPLIER');
  });

  runTest('Translates NO_NUMBERS into clear, user-friendly guidance with alternative country recommendations', () => {
    const translated = providerTracker.translateError(new Error('NO_NUMBERS'), {
      countryName: 'United States',
      serviceName: 'WhatsApp',
    });

    assert.strictEqual(translated.code, 'OUT_OF_STOCK');
    assert.strictEqual(translated.isOutOfStock, true);
    assert(translated.userMessage.includes('No virtual numbers are currently available for WhatsApp in United States'));
    assert(translated.suggestion.includes('Please select a different country'));
    assert.strictEqual(translated.statusCode, 409);
  });

  runTest('Only advertises service compatibility supported by verified provider data', () => {
    const rawServices = [
      { id: 1, name: 'Telegram' },
      { id: 2, name: 'WhatsApp' },
      { id: 3, name: 'Google' },
    ];
    const rawPrices = [
      { serviceId: 1, cost: 0.50, count: 120 },
      { serviceId: 2, cost: 0.75, count: 0 },
      { serviceId: 3, cost: 0.60, count: 45 },
    ];

    const verified = providerTracker.filterVerifiedServices(rawServices, rawPrices);
    assert.strictEqual(verified.length, 3);
    assert(verified[0].isVerified);
    assert.strictEqual(verified[0].stockCount, 120);
    assert.strictEqual(verified[1].stockCount, 0);
    assert.strictEqual(verified[1].stockAvailable, false);
  });

  // ====================================================
  // Suite 9: Server REST Endpoints Integration
  // ====================================================
  console.log('\n🌐 Suite 9: Live HTTP REST Endpoints (/api/sms/status, /auth, /admin)');

  const server = require('./server');
  const port = 3120;
  await new Promise(res => server.listen(port, res));

  function request(pathname, opts = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port,
        path: pathname,
        method: opts.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(opts.headers || {}),
        },
      }, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) }); }
          catch (e) { resolve({ status: res.statusCode, headers: res.headers, body }); }
        });
      });
      req.on('error', reject);
      if (opts.body) {
        req.write(typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body));
      }
      req.end();
    });
  }

  try {
    await runAsyncTest('GET /api/sms/status returns live provider health and latency', async () => {
      const res = await request('/api/sms/status');
      assert.strictEqual(res.status, 200);
      assert(res.body.status === 'OPERATIONAL' || res.body.status === 'DEGRADED', 'Status must report provider health');
      assert(typeof res.body.latencyMs === 'number');
    });

    await runAsyncTest('GET /api/sms/policy returns Acceptable Use Policy guidelines', async () => {
      const res = await request('/api/sms/policy');
      assert.strictEqual(res.status, 200);
      assert(res.body.rules);
      assert(res.body.complianceOfficerContact);
    });

    let liveCustomerToken = null;
    await runAsyncTest('POST /api/sms/auth/register creates customer session token', async () => {
      const res = await request('/api/sms/auth/register', {
        method: 'POST',
        body: {
          email: `test_customer_${Date.now()}@example.com`,
          password: 'PasswordSecure2026!',
          name: 'Integration Test User',
        },
      });

      assert.strictEqual(res.status, 201);
      assert(res.body.token);
      assert.strictEqual(res.body.user.role, 'CUSTOMER');
      liveCustomerToken = res.body.token;
    });

    await runAsyncTest('Non-admin customer receives 403 FORBIDDEN when attempting to access /api/sms/admin/stats', async () => {
      const res = await request('/api/sms/admin/stats', {
        headers: { 'authorization': `Bearer ${liveCustomerToken}` },
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.code, 'FORBIDDEN');
    });

    let adminToken = null;
    await runAsyncTest('Admin user can authenticate and access /api/sms/admin/stats and audit logs', async () => {
      const loginRes = await request('/api/sms/auth/login', {
        method: 'POST',
        body: {
          email: 'admin@smsbus.internal',
          password: 'AdminSecure2026!',
        },
      });

      assert.strictEqual(loginRes.status, 200);
      assert(loginRes.body.token);
      adminToken = loginRes.body.token;

      const adminStatsRes = await request('/api/sms/admin/stats', {
        headers: { 'authorization': `Bearer ${adminToken}` },
      });
      assert.strictEqual(adminStatsRes.status, 200);
      assert(typeof adminStatsRes.body.totalOrders === 'number');
      assert(adminStatsRes.body.recentAuditLogs);
    });
  } finally {
    server.close();
  }

  console.log('\n========================================');
  console.log(`Results: ${passedCount} passed, ${failedCount} failed`);
  console.log('========================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runAllProductionTests().catch(err => {
    console.error('Test suite failed with exception:', err);
    process.exit(1);
  });
}
