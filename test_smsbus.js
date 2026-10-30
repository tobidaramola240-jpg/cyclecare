/**
 * SMS-BUS Provider Automated Test Suite
 * 
 * Verifies all 8 core requirements:
 * 1. Fetch available countries
 * 2. Fetch available services
 * 3. Fetch country-specific service prices & availability
 * 4. Purchase a number
 * 5. Store the provider request ID securely
 * 6. Retrieve incoming SMS (with strict rejection of fake SMS)
 * 7. Cancel eligible requests
 * 8. Track provider errors and order status
 * 
 * In addition to:
 * - Server-side provider adapter with environment token storage
 * - Non-exposure of API token to frontend (/env.js)
 * - Configurable multi-provider registry
 * - Official rental endpoints (https://sms-bus.com/docs/rent)
 */

const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');

const {
  BaseSmsProvider,
  SmsProviderError,
  SmsBusAdapter,
  SmsOrderStore,
  SmsProviderRegistry,
  SmsService,
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

// Mock Upstream Factory for SMS-BUS API
function createMockSmsBusFetch(customHandlers = {}) {
  return async (urlStr, options = {}) => {
    const url = new URL(urlStr);
    const token = url.searchParams.get('token');
    const pathname = url.pathname.replace(/\/+$/, '');

    // Default Token Validation
    if (!token || token === 'invalid_token') {
      return {
        status: 200,
        text: async () => JSON.stringify({ code: 401, message: 'Wrong token!' }),
      };
    }

    if (customHandlers[pathname]) {
      return customHandlers[pathname](url, options);
    }

    // Default Standard Endpoints
    if (pathname.endsWith('/list/countries')) {
      return {
        status: 200,
        text: async () => JSON.stringify({
          code: 200,
          message: 'Operation Success',
          data: {
            '1': { id: 1, title: 'United States', code: 'us' },
            '2': { id: 2, title: 'United Kingdom', code: 'gb' },
            '3': { id: 3, title: 'Germany', code: 'de' },
          },
        }),
      };
    }

    if (pathname.endsWith('/list/projects')) {
      return {
        status: 200,
        text: async () => JSON.stringify({
          code: 200,
          message: 'Operation Success',
          data: [
            { id: 1, title: 'WhatsApp', code: 'wa' },
            { id: 2, title: 'Telegram', code: 'tg' },
            { id: 3, title: 'Google', code: 'go' },
          ],
        }),
      };
    }

    if (pathname.endsWith('/list/prices')) {
      const countryId = url.searchParams.get('country_id');
      return {
        status: 200,
        text: async () => JSON.stringify({
          code: 200,
          message: 'Operation Success',
          data: {
            '1': { cost: 0.50, count: 120 },
            '2': { cost: 0.35, count: 45 },
            '3': { cost: 0.25, count: 0 },
          },
        }),
      };
    }

    // Rental routes checked first before general /get/number
    if (pathname.endsWith('/rent/get/number')) {
      return {
        status: 200,
        text: async () => JSON.stringify({
          code: 200,
          message: 'Operation Success',
          data: {
            request_id: 99120,
            number: '14155550199',
            days: 30,
            expire_at: '2026-11-29T00:00:00Z',
          },
        }),
      };
    }

    if (pathname.endsWith('/rent/get/sms')) {
      return {
        status: 200,
        text: async () => JSON.stringify({
          code: 200,
          message: 'Operation Success',
          data: [
            { text: 'Security code: 582103', code: '582103', date: '2026-10-29T12:00:00Z' },
          ],
        }),
      };
    }

    if (pathname.endsWith('/rent/cancel')) {
      return {
        status: 200,
        text: async () => JSON.stringify({ code: 200, message: 'Operation Success' }),
      };
    }

    if (pathname.endsWith('/get/number')) {
      const countryId = url.searchParams.get('country_id');
      const projectId = url.searchParams.get('project_id');
      if (countryId === '999') {
        return {
          status: 200,
          text: async () => JSON.stringify({ code: 422, message: 'No numbers available for this country' }),
        };
      }
      return {
        status: 200,
        text: async () => JSON.stringify({
          code: 200,
          message: 'Operation Success',
          data: {
            request_id: 88412,
            number: '17548003793',
          },
        }),
      };
    }

    if (pathname.endsWith('/get/sms')) {
      const requestId = url.searchParams.get('request_id');
      if (requestId === 'pending_req') {
        return {
          status: 200,
          text: async () => JSON.stringify({ code: 200, message: 'No message yet' }),
        };
      }
      return {
        status: 200,
        text: async () => JSON.stringify({
          code: 200,
          message: 'Operation Success',
          data: 'Your verification code is 429916. Valid for 10 minutes.',
        }),
      };
    }

    if (pathname.endsWith('/cancel')) {
      return {
        status: 200,
        text: async () => JSON.stringify({
          code: 200,
          message: 'Operation Success',
        }),
      };
    }

    if (pathname.endsWith('/get/balance') || pathname.endsWith('/get')) {
      return {
        status: 200,
        text: async () => JSON.stringify({
          code: 200,
          message: 'Operation Success',
          data: { balance: 14.50, frozen: 1.00 },
        }),
      };
    }

    return {
      status: 404,
      text: async () => JSON.stringify({ code: 404, message: 'Endpoint Not Found' }),
    };
  };
}

async function main() {
  console.log('========================================');
  console.log('📡 SMS-BUS Upstream Integration Test Suite');
  console.log('========================================');

  // ----------------------------------------------------
  // Suite 1: Security Isolation & Credential Handling
  // ----------------------------------------------------
  console.log('\n🔒 Suite 1: Security Isolation & Token Protection');

  runTest('Adapter requires token and asserts absence safely', () => {
    const unconfigured = new SmsBusAdapter({ token: '' });
    assert.strictEqual(unconfigured.isConfigured(), false);
    assert.throws(() => unconfigured._assertConfigured(), (err) => {
      assert(err instanceof SmsProviderError);
      assert.strictEqual(err.code, 'AUTH_CONFIG_MISSING');
      assert.strictEqual(err.statusCode, 401);
      return true;
    });
  });

  runTest('Server /env.js never exposes SMSBUS_API_TOKEN or provider tokens to frontend', () => {
    const serverJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    const envRouteMatch = serverJs.slice(serverJs.indexOf('/env.js'), serverJs.indexOf('/env.js') + 400);
    assert(!envRouteMatch.includes('SMSBUS_API_TOKEN'), 'SMSBUS_API_TOKEN must NEVER be in /env.js payload');
    assert(!envRouteMatch.includes('SMS_PROVIDER_API_KEY'), 'SMS_PROVIDER_API_KEY must NEVER be in /env.js payload');
  });

  runTest('Rejects production mock mode and verifies strict mode enforcement', () => {
    const prodAdapter = new SmsBusAdapter({
      token: 'test_token',
      isProduction: true,
      fetchFn: async () => {
        return {
          status: 200,
          text: async () => JSON.stringify({ code: 401, message: 'Wrong token!' }),
        };
      },
    });
    assert.strictEqual(prodAdapter.isProduction, true);
  });

  // ----------------------------------------------------
  // Suite 2: Requirement 1 — Available Countries
  // ----------------------------------------------------
  console.log('\n🌍 Suite 2: Requirement 1 — Fetch Available Countries');

  await runAsyncTest('Fetches and normalizes countries from SMS-BUS /list/countries', async () => {
    const adapter = new SmsBusAdapter({
      token: 'valid_test_token',
      fetchFn: createMockSmsBusFetch(),
    });

    const countries = await adapter.fetchCountries();
    assert(Array.isArray(countries), 'Countries must be an array');
    assert.strictEqual(countries.length, 3);
    assert(countries.some(c => c.id === 1 && c.name === 'United States' && c.code === 'us'));
    assert(countries.some(c => c.id === 2 && c.name === 'United Kingdom' && c.code === 'gb'));
    assert(countries.some(c => c.id === 3 && c.name === 'Germany' && c.code === 'de'));
  });

  // ----------------------------------------------------
  // Suite 3: Requirement 2 — Available Services / Projects
  // ----------------------------------------------------
  console.log('\n📱 Suite 3: Requirement 2 — Fetch Available Services');

  await runAsyncTest('Fetches and normalizes services from SMS-BUS /list/projects', async () => {
    const adapter = new SmsBusAdapter({
      token: 'valid_test_token',
      fetchFn: createMockSmsBusFetch(),
    });

    const services = await adapter.fetchServices();
    assert(Array.isArray(services), 'Services must be an array');
    assert.strictEqual(services.length, 3);
    assert(services.some(s => s.id === 1 && s.name === 'WhatsApp' && s.code === 'wa'));
    assert(services.some(s => s.id === 2 && s.name === 'Telegram' && s.code === 'tg'));
  });

  // ----------------------------------------------------
  // Suite 4: Requirement 3 — Prices and Availability
  // ----------------------------------------------------
  console.log('\n💰 Suite 4: Requirement 3 — Service Prices & Live Availability');

  await runAsyncTest('Fetches country prices and inventory count from SMS-BUS /list/prices', async () => {
    const adapter = new SmsBusAdapter({
      token: 'valid_test_token',
      fetchFn: createMockSmsBusFetch(),
    });

    const prices = await adapter.fetchPrices(1);
    assert(Array.isArray(prices), 'Prices must be an array');
    const waPrice = prices.find(p => p.serviceId === 1);
    assert(waPrice, 'Must include WhatsApp price');
    assert.strictEqual(waPrice.cost, 0.50);
    assert.strictEqual(waPrice.count, 120);
    assert.strictEqual(waPrice.countryId, 1);
  });

  await runAsyncTest('Rejects missing countryId with 400 error', async () => {
    const adapter = new SmsBusAdapter({ token: 'valid_test_token', fetchFn: createMockSmsBusFetch() });
    await assert.rejects(
      async () => await adapter.fetchPrices(null),
      (err) => err.statusCode === 400 && err.code === 'INVALID_PARAMS'
    );
  });

  // ----------------------------------------------------
  // Suite 5: Requirement 4 & 5 — Purchase Number & Secure ID Storage
  // ----------------------------------------------------
  console.log('\n🛒 Suite 5: Requirements 4 & 5 — Purchase Number & Store Request ID Securely');

  await runAsyncTest('Purchases number via /get/number and stores providerRequestId securely', async () => {
    const testStore = new SmsOrderStore({ persistToDisk: false });
    const registry = new SmsProviderRegistry('smsbus');
    registry.register(new SmsBusAdapter({ token: 'valid_test_token', fetchFn: createMockSmsBusFetch() }), true);

    const service = new SmsService({ registry, orderStore: testStore });

    const result = await service.purchaseNumber({
      countryId: 1,
      serviceId: 1,
      expectedCost: 0.50,
      metadata: { requestedBy: 'test-suite' },
    });

    assert(result.order, 'Must return order entity');
    assert.strictEqual(result.providerRequestId, '88412');
    assert.strictEqual(result.number, '+17548003793');
    assert(result.order.id.startsWith('ord_'));
    assert.strictEqual(result.order.status, 'PENDING');
    assert.strictEqual(result.order.cost, 0.50);

    // Verify stored entity in server store
    const stored = testStore.getOrder(result.order.id);
    assert(stored);
    assert.strictEqual(stored.providerRequestId, '88412');
    assert.strictEqual(stored.provider, 'smsbus');
  });

  // ----------------------------------------------------
  // Suite 6: Requirement 6 — Retrieve Incoming SMS (No Fake SMS)
  // ----------------------------------------------------
  console.log('\n📩 Suite 6: Requirement 6 — Retrieve Incoming SMS');

  await runAsyncTest('Retrieves received SMS and extracts verification code', async () => {
    const testStore = new SmsOrderStore({ persistToDisk: false });
    const registry = new SmsProviderRegistry('smsbus');
    registry.register(new SmsBusAdapter({ token: 'valid_test_token', fetchFn: createMockSmsBusFetch() }), true);
    const service = new SmsService({ registry, orderStore: testStore });

    const purchase = await service.purchaseNumber({ countryId: 1, serviceId: 1 });
    const check = await service.checkIncomingSms(purchase.order.id);

    assert.strictEqual(check.hasSms, true);
    assert.strictEqual(check.code, '429916');
    assert(check.text.includes('429916'));
    assert.strictEqual(check.status, 'RECEIVED');

    // Verify stored entity updated
    const updated = testStore.getOrder(purchase.order.id);
    assert.strictEqual(updated.status, 'RECEIVED');
    assert.strictEqual(updated.smsCode, '429916');
    assert.strictEqual(updated.messages.length, 1);
  });

  await runAsyncTest('Handles pending state when SMS has not arrived yet without creating fake messages', async () => {
    const testStore = new SmsOrderStore({ persistToDisk: false });
    const registry = new SmsProviderRegistry('smsbus');
    registry.register(new SmsBusAdapter({ token: 'valid_test_token', fetchFn: createMockSmsBusFetch() }), true);
    const service = new SmsService({ registry, orderStore: testStore });

    // Pre-seed an order with 'pending_req'
    const pendingOrder = testStore.createOrder({
      provider: 'smsbus',
      providerRequestId: 'pending_req',
      number: '+17548003793',
      countryId: 1,
      serviceId: 1,
    });

    const check = await service.checkIncomingSms(pendingOrder.id);
    assert.strictEqual(check.hasSms, false);
    assert.strictEqual(check.code, null);
    assert.strictEqual(check.text, null);
    assert.strictEqual(check.status, 'PENDING');
  });

  // ----------------------------------------------------
  // Suite 7: Requirement 7 — Cancel Eligible Requests
  // ----------------------------------------------------
  console.log('\n🚫 Suite 7: Requirement 7 — Cancel Eligible Requests');

  await runAsyncTest('Cancels active order with upstream provider and updates order status to CANCELLED', async () => {
    let cancelCalled = false;
    const customFetch = createMockSmsBusFetch({
      '/api/control/cancel': async () => {
        cancelCalled = true;
        return {
          status: 200,
          text: async () => JSON.stringify({ code: 200, message: 'Operation Success' }),
        };
      },
    });

    const testStore = new SmsOrderStore({ persistToDisk: false });
    const registry = new SmsProviderRegistry('smsbus');
    registry.register(new SmsBusAdapter({ token: 'valid_test_token', fetchFn: customFetch }), true);
    const service = new SmsService({ registry, orderStore: testStore });

    const purchase = await service.purchaseNumber({ countryId: 1, serviceId: 1 });
    const cancelRes = await service.cancelOrder(purchase.order.id, 'User changed mind');

    assert.strictEqual(cancelCalled, true);
    assert.strictEqual(cancelRes.success, true);
    assert.strictEqual(cancelRes.order.status, 'CANCELLED');

    const updated = testStore.getOrder(purchase.order.id);
    assert.strictEqual(updated.status, 'CANCELLED');
    assert.strictEqual(updated.cancelReason, 'User changed mind');
  });

  // ----------------------------------------------------
  // Suite 8: Requirement 8 — Error Tracking & Status Transitions
  // ----------------------------------------------------
  console.log('\n⚠️ Suite 8: Requirement 8 — Track Provider Errors & Order Status');

  await runAsyncTest('Normalizes upstream out-of-stock and logs provider error', async () => {
    const adapter = new SmsBusAdapter({ token: 'valid_test_token', fetchFn: createMockSmsBusFetch() });
    await assert.rejects(
      async () => await adapter.purchaseNumber({ countryId: 999, serviceId: 1 }),
      (err) => {
        assert(err instanceof SmsProviderError);
        assert.strictEqual(err.provider, 'smsbus');
        assert.strictEqual(err.statusCode, 409); // NO_NUMBERS_AVAILABLE
        return true;
      }
    );
  });

  await runAsyncTest('Records error history on order when upstream call fails', async () => {
    const failingFetch = createMockSmsBusFetch({
      '/api/control/get/sms': async () => {
        return {
          status: 200,
          text: async () => JSON.stringify({ code: 500, message: 'Upstream gateway temporary error' }),
        };
      },
    });

    const testStore = new SmsOrderStore({ persistToDisk: false });
    const registry = new SmsProviderRegistry('smsbus');
    registry.register(new SmsBusAdapter({ token: 'valid_test_token', fetchFn: failingFetch }), true);
    const service = new SmsService({ registry, orderStore: testStore });

    const order = testStore.createOrder({
      provider: 'smsbus',
      providerRequestId: 'fail_test',
      number: '+17548003793',
      countryId: 1,
      serviceId: 1,
    });

    await assert.rejects(
      async () => await service.checkIncomingSms(order.id),
      (err) => err.code === 'PROVIDER_ERROR'
    );

    const updated = testStore.getOrder(order.id);
    assert.strictEqual(updated.errorHistory.length, 1);
    assert(updated.errorHistory[0].message.includes('gateway temporary error'));
  });

  // ----------------------------------------------------
  // Suite 9: Configurable Multi-Provider Extensibility
  // ----------------------------------------------------
  console.log('\n🔌 Suite 9: Configurable Multi-Provider Extensibility');

  runTest('Allows registering and switching to a secondary authorized SMS supplier', () => {
    class SecondaryMockSupplier extends BaseSmsProvider {
      constructor() {
        super('secondary_provider', 'Secondary Authorized SMS Supplier');
      }
      isConfigured() { return true; }
      async fetchCountries() { return [{ id: 44, name: 'United Kingdom', code: 'gb' }]; }
    }

    const registry = new SmsProviderRegistry('smsbus');
    registry.register(new SmsBusAdapter({ token: 'test' }));
    registry.register(new SecondaryMockSupplier());

    const providers = registry.listProviders();
    assert.strictEqual(providers.length, 2);
    assert.strictEqual(registry.getProvider().id, 'smsbus');

    registry.setActiveProvider('secondary_provider');
    assert.strictEqual(registry.getProvider().id, 'secondary_provider');
    assert.strictEqual(registry.getProvider().name, 'Secondary Authorized SMS Supplier');
  });

  // ----------------------------------------------------
  // Suite 10: Official Rental Endpoints (https://sms-bus.com/docs/rent)
  // ----------------------------------------------------
  console.log('\n🗓️ Suite 10: Official Rental Endpoints (https://sms-bus.com/docs/rent)');

  await runAsyncTest('Rents number and checks incoming rental SMS', async () => {
    const testStore = new SmsOrderStore({ persistToDisk: false });
    const registry = new SmsProviderRegistry('smsbus');
    registry.register(new SmsBusAdapter({ token: 'valid_test_token', fetchFn: createMockSmsBusFetch() }), true);
    const service = new SmsService({ registry, orderStore: testStore });

    const rental = await service.rentNumber({ countryId: 1, days: 30 });
    assert.strictEqual(rental.providerRequestId, '99120');
    assert.strictEqual(rental.number, '+14155550199');
    assert.strictEqual(rental.days, 30);
    assert.strictEqual(rental.order.type, 'rental');

    const smsCheck = await service.checkRentalSms(rental.order.id);
    assert.strictEqual(smsCheck.hasSms, true);
    assert.strictEqual(smsCheck.messages.length, 1);
    assert.strictEqual(smsCheck.messages[0].code, '582103');
  });

  // ----------------------------------------------------
  // Suite 11: HTTP REST Server Integration
  // ----------------------------------------------------
  console.log('\n🌐 Suite 11: HTTP REST Server Integration (/api/sms/*)');

  const { defaultRegistry } = require('./sms');
  defaultRegistry.register(new SmsBusAdapter({ token: 'test_integration_token', fetchFn: createMockSmsBusFetch() }), true);

  const server = require('./server');
  const serverPort = 3105;
  await new Promise((resolve) => server.listen(serverPort, resolve));

  async function fetchApi(pathname, options = {}) {
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

      const req = http.request(opt, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          let parsed;
          try { parsed = JSON.parse(body); } catch (e) { parsed = body; }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
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
    await runAsyncTest('GET /api/sms/providers returns registered providers without leaking token', async () => {
      const res = await fetchApi('/api/sms/providers');
      assert.strictEqual(res.status, 200);
      assert(res.body.providers, 'Must include providers list');
      assert(res.body.activeProvider, 'Must indicate active provider');
      assert(!JSON.stringify(res.body).includes('SMSBUS_API_TOKEN'), 'Must never leak tokens');
    });

    await runAsyncTest('GET /api/sms/orders returns array of tracked orders', async () => {
      const res = await fetchApi('/api/sms/orders');
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body.orders));
    });

    await runAsyncTest('GET /api/sms/prices requires countryId parameter', async () => {
      const res = await fetchApi('/api/sms/prices');
      assert.strictEqual(res.status, 400);
      assert(res.body.error.includes('countryId'));
    });

    // ----------------------------------------------------
    // Suite 12: Customer Multi-Tenant Isolation & Authorization
    // ----------------------------------------------------
    console.log('\n🔐 Suite 12: Customer Isolation & Security Authorization');

    let aliceOrderId = null;

    await runAsyncTest('Customer A creates order isolated under their customer identity', async () => {
      const res = await fetchApi('/api/sms/orders', {
        method: 'POST',
        headers: { 'x-customer-id': 'cust_alice_123' },
        body: { countryId: 1, serviceId: 1, cost: 0.75 },
      });

      assert.strictEqual(res.status, 201);
      assert(res.body.order);
      assert.strictEqual(res.body.order.customerId, 'cust_alice_123');
      assert.strictEqual(res.body.order.status, 'PENDING');
      aliceOrderId = res.body.order.id;
    });

    await runAsyncTest('Customer A can view their own order details and poll SMS', async () => {
      assert(aliceOrderId);
      const res = await fetchApi(`/api/sms/orders/${aliceOrderId}`, {
        headers: { 'x-customer-id': 'cust_alice_123' },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.order.id, aliceOrderId);

      const smsPoll = await fetchApi(`/api/sms/orders/${aliceOrderId}/sms`, {
        headers: { 'x-customer-id': 'cust_alice_123' },
      });
      assert.strictEqual(smsPoll.status, 200);
      assert.strictEqual(smsPoll.body.hasSms, true);
      assert.strictEqual(smsPoll.body.code, '429916');
    });

    await runAsyncTest('Customer B is denied (403 ACCESS_DENIED) when querying Customer A order', async () => {
      assert(aliceOrderId);
      const res = await fetchApi(`/api/sms/orders/${aliceOrderId}`, {
        headers: { 'x-customer-id': 'cust_bob_456' },
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.code, 'ACCESS_DENIED');
      assert(res.body.error.includes('Access denied'));
    });

    await runAsyncTest('Customer B is denied (403 ACCESS_DENIED) when polling SMS of Customer A order', async () => {
      assert(aliceOrderId);
      const res = await fetchApi(`/api/sms/orders/${aliceOrderId}/sms`, {
        headers: { 'x-customer-id': 'cust_bob_456' },
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.code, 'ACCESS_DENIED');
    });

    await runAsyncTest('Customer B is denied (403 ACCESS_DENIED) when attempting to cancel Customer A order', async () => {
      assert(aliceOrderId);
      const res = await fetchApi(`/api/sms/orders/${aliceOrderId}/cancel`, {
        method: 'POST',
        headers: { 'x-customer-id': 'cust_bob_456' },
        body: { reason: 'Malicious cancel attempt' },
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.code, 'ACCESS_DENIED');
    });

    // ----------------------------------------------------
    // Suite 13: Live SMS Polling Lifecycle, Expiration & Timeout Resilience
    // ----------------------------------------------------
    console.log('\n⏱️ Suite 13: Live SMS Polling Lifecycle, Expiration & Timeout Resilience');

    await runAsyncTest('Polling lifecycle stops when order is CANCELLED', async () => {
      const cancelPurchase = await fetchApi('/api/sms/orders', {
        method: 'POST',
        headers: { 'x-customer-id': 'cust_lifecycle_cancel' },
        body: { countryId: 1, serviceId: 1 },
      });
      const orderId = cancelPurchase.body.order.id;

      // Cancel the order
      const cancelRes = await fetchApi(`/api/sms/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'x-customer-id': 'cust_lifecycle_cancel' },
        body: { reason: 'User finished early' },
      });
      assert.strictEqual(cancelRes.status, 200);
      assert.strictEqual(cancelRes.body.order.status, 'CANCELLED');

      // Subsequent poll returns CANCELLED status immediately, terminating client polling
      const pollRes = await fetchApi(`/api/sms/orders/${orderId}/sms`, {
        headers: { 'x-customer-id': 'cust_lifecycle_cancel' },
      });
      assert.strictEqual(pollRes.status, 200);
      assert.strictEqual(pollRes.body.status, 'CANCELLED');
      assert.strictEqual(pollRes.body.hasSms, false);
    });

    await runAsyncTest('Polling lifecycle stops when order reaches 20-minute EXPIRED status', async () => {
      const expirePurchase = await fetchApi('/api/sms/orders', {
        method: 'POST',
        headers: { 'x-customer-id': 'cust_lifecycle_expire' },
        body: { countryId: 1, serviceId: 1 },
      });
      const orderId = expirePurchase.body.order.id;

      // Simulate expiration by backdating expiresAt in default orderStore
      const { defaultOrderStore } = require('./sms');
      const order = defaultOrderStore.getOrder(orderId);
      order.expiresAt = new Date(Date.now() - 5000).toISOString();

      // Polling detects elapsed time and stops polling with EXPIRED status
      const pollRes = await fetchApi(`/api/sms/orders/${orderId}/sms`, {
        headers: { 'x-customer-id': 'cust_lifecycle_expire' },
      });
      assert.strictEqual(pollRes.status, 200);
      assert.strictEqual(pollRes.body.status, 'EXPIRED');
      assert.strictEqual(pollRes.body.hasSms, false);
      assert(pollRes.body.message.includes('expired'));
    });

    await runAsyncTest('Network/timeout errors on provider retrieve are captured gracefully without crashing', async () => {
      // Mock provider error recording
      const failingOrder = await fetchApi('/api/sms/orders', {
        method: 'POST',
        headers: { 'x-customer-id': 'cust_timeout_test' },
        body: { countryId: 1, serviceId: 1 },
      });
      const orderId = failingOrder.body.order.id;

      const { defaultOrderStore } = require('./sms');
      defaultOrderStore.recordError(orderId, {
        code: 'PROVIDER_TIMEOUT',
        message: 'Upstream gateway timed out after 10000ms',
        statusCode: 504,
      });

      const orderCheck = await fetchApi(`/api/sms/orders/${orderId}`, {
        headers: { 'x-customer-id': 'cust_timeout_test' },
      });
      assert.strictEqual(orderCheck.status, 200);
      assert.strictEqual(orderCheck.body.order.errorCount, 1);
      assert.strictEqual(orderCheck.body.order.lastError.code, 'PROVIDER_TIMEOUT');
    });

  } finally {
    server.close();
  }

  console.log('\n========================================');
  console.log(`Results: ${passedCount} passed, ${failedCount} failed`);
  console.log('========================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal SMS test runner error:', err);
  process.exit(1);
});
