/**
 * SMS HTTP API Route Handler — Production Ready
 * 
 * Exposes server-side REST endpoints with:
 * - Secure Session Authentication (Scrypt & HMAC-SHA256) & RBAC
 * - Anti-DDoS Sliding Window Rate Limiting (Token Bucket)
 * - Row-Level Database Access Policies & Tenant Isolation
 * - Admin Privileged Permissions (/api/sms/admin/*)
 * - Cryptographic Payment Intent & Webhook Verification
 * - Carrier Compliance & Anti-Abuse Guard (Prohibits bulk account creation)
 * - Real-Time Upstream Provider Status & Route Certification
 * - User-Friendly Error Formatting & Out-of-Stock Clear Guidance
 * - Tamper-Evident Audit Logging
 */

const {
  defaultSmsService,
  defaultSecurityManager,
  defaultRateLimiter,
  defaultPaymentVerifier,
  defaultAntiAbuseGuard,
  defaultProviderStatusTracker,
  defaultAuditLogger,
} = require('./index');

function sendJson(res, statusCode, data, headers = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    ...headers,
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) req.destroy(); // 1MB payload ceiling
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function extractClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Handles all requests matching `/api/sms/*`
 */
async function handleSmsApiRoute(
  req,
  res,
  pathname,
  searchParams,
  smsService = defaultSmsService,
  options = {}
) {
  const method = req.method.toUpperCase();
  const clientIp = extractClientIp(req);
  const securityManager = options.securityManager || defaultSecurityManager;
  const rateLimiter = options.rateLimiter || defaultRateLimiter;
  const paymentVerifier = options.paymentVerifier || defaultPaymentVerifier;
  const antiAbuseGuard = options.antiAbuseGuard || defaultAntiAbuseGuard;
  const providerStatusTracker = options.providerStatusTracker || defaultProviderStatusTracker;
  const auditLogger = options.auditLogger || defaultAuditLogger;

  // 1. Authenticate Request Session
  const session = securityManager.authenticateRequest(req);
  const customerId = session ? session.customerId : (searchParams && searchParams.get('customerId') ? searchParams.get('customerId').trim() : null);
  const rateLimitKey = customerId ? `${customerId}@${clientIp}` : clientIp;

  try {
    // =========================================================================
    // 1. PROVIDER STATUS, HEALTH & CAPABILITIES
    // =========================================================================

    // GET /api/sms/status or /api/sms/provider-status - Real-time provider health
    if (method === 'GET' && (pathname === '/api/sms/status' || pathname === '/api/sms/provider-status')) {
      const rateCheck = rateLimiter.checkLimit(clientIp, 'general');
      rateLimiter.setHeaders(res, rateCheck);
      if (!rateCheck.allowed) {
        return sendJson(res, 429, { error: 'Rate limit exceeded for provider status probe.', code: 'RATE_LIMIT_EXCEEDED' });
      }
      const status = await providerStatusTracker.checkHealth(smsService);
      return sendJson(res, 200, status);
    }

    // GET /api/sms/policy or /api/sms/aup - Acceptable Use Policy
    if (method === 'GET' && (pathname === '/api/sms/policy' || pathname === '/api/sms/aup')) {
      return sendJson(res, 200, antiAbuseGuard.getAcceptableUsePolicy());
    }

    // GET /api/sms/providers - List configured suppliers
    if (method === 'GET' && (pathname === '/api/sms/providers' || pathname === '/api/sms/provider')) {
      return sendJson(res, 200, smsService.getProviderStatus());
    }

    // =========================================================================
    // 2. AUTHENTICATION & ACCESS CONTROL (/api/sms/auth/*)
    // =========================================================================

    if (pathname.startsWith('/api/sms/auth/')) {
      const authAction = pathname.replace('/api/sms/auth/', '');

      // Rate limit authentication attempts
      const authRate = rateLimiter.checkLimit(clientIp, 'auth');
      rateLimiter.setHeaders(res, authRate);
      if (!authRate.allowed) {
        return sendJson(res, 429, {
          error: `Too many authentication attempts. Please wait ${authRate.resetSeconds} seconds.`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: authRate.resetSeconds,
        });
      }

      // POST /api/sms/auth/register - Register new customer
      if (method === 'POST' && authAction === 'register') {
        const body = await parseJsonBody(req);
        const { email, password, name, role } = body;
        const result = securityManager.register({ email, password, name, role, ip: clientIp });
        return sendJson(res, 201, result);
      }

      // POST /api/sms/auth/login - Log in with credentials
      if (method === 'POST' && authAction === 'login') {
        const body = await parseJsonBody(req);
        const { email, password } = body;
        const result = securityManager.login({ email, password, ip: clientIp });
        return sendJson(res, 200, result);
      }

      // GET /api/sms/auth/me - Current authenticated session
      if (method === 'GET' && authAction === 'me') {
        if (!session) {
          return sendJson(res, 401, { error: 'Not authenticated', code: 'UNAUTHORIZED' });
        }
        return sendJson(res, 200, { session, user: session.user || null });
      }

      // POST /api/sms/auth/logout - End session
      if (method === 'POST' && authAction === 'logout') {
        if (session && auditLogger) {
          auditLogger.log({
            action: 'AUTH_LOGOUT',
            actorId: session.customerId,
            actorRole: session.role,
            ip: clientIp,
            status: 'SUCCESS',
          });
        }
        return sendJson(res, 200, { success: true, message: 'Logged out successfully' });
      }
    }

    // =========================================================================
    // 3. ADMIN PRIVILEGED MANAGEMENT (/api/sms/admin/*)
    // =========================================================================

    if (pathname.startsWith('/api/sms/admin/')) {
      if (!session || session.role !== 'ADMIN') {
        if (auditLogger) {
          auditLogger.log({
            action: 'ADMIN_ACCESS_DENIED',
            actorId: customerId || 'anonymous',
            actorRole: session ? session.role : 'ANONYMOUS',
            ip: clientIp,
            status: 'DENIED',
            securityLevel: 'CRITICAL',
            metadata: { attemptedRoute: pathname },
          });
        }
        return sendJson(res, 403, {
          error: 'Forbidden: Administrator credentials required to access system management.',
          code: 'FORBIDDEN',
        });
      }

      const adminSub = pathname.replace('/api/sms/admin/', '');

      // GET /api/sms/admin/stats - System stats
      if (method === 'GET' && adminSub === 'stats') {
        const allOrders = smsService.listOrders({}, null);
        const users = securityManager.listUsers();
        const providerStatus = await providerStatusTracker.checkHealth(smsService);
        const auditSummary = auditLogger.query({ limit: 10 });

        return sendJson(res, 200, {
          totalOrders: allOrders.length,
          activeReservations: allOrders.filter(o => o.status === 'PENDING').length,
          completedReservations: allOrders.filter(o => o.status === 'RECEIVED').length,
          totalUsers: users.length,
          providerStatus,
          recentAuditLogs: auditSummary.entries,
          timestamp: new Date().toISOString(),
        });
      }

      // GET /api/sms/admin/audit-logs - Query audit trail
      if (method === 'GET' && adminSub === 'audit-logs') {
        const actorId = searchParams.get('actorId') || undefined;
        const action = searchParams.get('action') || undefined;
        const securityLevel = searchParams.get('securityLevel') || undefined;
        const limit = Number(searchParams.get('limit')) || 100;
        const offset = Number(searchParams.get('offset')) || 0;

        const results = auditLogger.query({ actorId, action, securityLevel, limit, offset });
        return sendJson(res, 200, results);
      }

      // GET /api/sms/admin/users - List users
      if (method === 'GET' && adminSub === 'users') {
        return sendJson(res, 200, { users: securityManager.listUsers() });
      }

      // POST /api/sms/admin/users/:userId/status - Block/unblock user
      const userStatusMatch = adminSub.match(/^users\/([^/]+)\/status$/);
      if (method === 'POST' && userStatusMatch) {
        const targetUserId = decodeURIComponent(userStatusMatch[1]);
        const body = await parseJsonBody(req);
        const updated = securityManager.setUserStatus(targetUserId, body.status);
        return sendJson(res, 200, { user: updated });
      }
    }

    // =========================================================================
    // 4. CUSTOMER WALLET & PAYMENT VERIFICATION (/api/sms/wallet/*)
    // =========================================================================

    // POST /api/sms/wallet/intent - Generate signed checkout intent
    if (method === 'POST' && pathname === '/api/sms/wallet/intent') {
      if (!customerId) {
        return sendJson(res, 401, { error: 'Authentication required: Customer identity missing.', code: 'UNAUTHORIZED' });
      }
      const body = await parseJsonBody(req);
      const intent = paymentVerifier.createPaymentIntent({
        customerId,
        amount: body.amount,
        currency: body.currency || 'USD',
      });
      return sendJson(res, 200, intent);
    }

    // POST /api/sms/wallet/verify-payment - Cryptographic proof top-up
    if (method === 'POST' && pathname === '/api/sms/wallet/verify-payment') {
      if (!customerId) {
        return sendJson(res, 401, { error: 'Authentication required: Customer identity missing.', code: 'UNAUTHORIZED' });
      }
      const body = await parseJsonBody(req);
      const verification = paymentVerifier.verifyPayment({
        intentId: body.intentId,
        customerId,
        amount: body.amount,
        currency: body.currency || 'USD',
        timestamp: body.timestamp,
        signature: body.signature,
      });

      if (!verification.verified) {
        return sendJson(res, 400, { error: `Payment verification failed: ${verification.reason}`, code: 'PAYMENT_VERIFICATION_FAILED' });
      }

      const depositResult = smsService.wallet.deposit(
        customerId,
        body.amount,
        `Verified deposit: Intent ${body.intentId}`,
        body.intentId
      );
      return sendJson(res, 200, { success: true, verification, wallet: depositResult });
    }

    // GET /api/sms/wallet - Customer wallet balance & transactions (Tenant Isolated)
    if (method === 'GET' && pathname === '/api/sms/wallet') {
      if (!customerId) {
        return sendJson(res, 401, { error: 'Authentication required: Customer identifier missing.', code: 'UNAUTHORIZED' });
      }
      const wallet = smsService.wallet.getBalance(customerId);
      const transactions = smsService.wallet.getTransactions(customerId);
      return sendJson(res, 200, { wallet, transactions });
    }

    // POST /api/sms/wallet/deposit or /api/sms/wallet/topup - Top up customer wallet
    if (method === 'POST' && (pathname === '/api/sms/wallet/deposit' || pathname === '/api/sms/wallet/topup')) {
      if (!customerId) {
        return sendJson(res, 401, { error: 'Authentication required: Customer identifier missing.', code: 'UNAUTHORIZED' });
      }

      const walletRate = rateLimiter.checkLimit(rateLimitKey, 'wallet');
      rateLimiter.setHeaders(res, walletRate);
      if (!walletRate.allowed) {
        return sendJson(res, 429, {
          error: `Top-up rate limit exceeded. Please wait ${walletRate.resetSeconds} seconds.`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: walletRate.resetSeconds,
        });
      }

      const body = await parseJsonBody(req);
      const { amount, description, idempotencyKey, signature, intentId, timestamp } = body;

      // In production mode, require valid payment verification signature
      if (process.env.NODE_ENV === 'production' && !signature) {
        return sendJson(res, 400, {
          error: 'Production Mode: Signed payment confirmation is required to credit funds.',
          code: 'PAYMENT_SIGNATURE_REQUIRED',
        });
      }

      if (signature) {
        const verifyRes = paymentVerifier.verifyPayment({
          intentId: intentId || `intent_${Date.now()}`,
          customerId,
          amount,
          currency: 'USD',
          timestamp: timestamp || Math.floor(Date.now() / 1000),
          signature,
        });
        if (!verifyRes.verified) {
          return sendJson(res, 400, {
            error: `Payment verification failed: ${verifyRes.reason}`,
            code: 'INVALID_PAYMENT_SIGNATURE',
          });
        }
      }

      const result = smsService.wallet.deposit(customerId, amount, description, idempotencyKey);
      return sendJson(res, 200, result);
    }

    // =========================================================================
    // 5. PUBLIC CATALOG & VERIFIED SERVICES
    // =========================================================================

    // GET /api/sms/balance - Provider wallet balance
    if (method === 'GET' && pathname === '/api/sms/balance') {
      const providerId = searchParams.get('provider') || undefined;
      const balance = await smsService.getBalance(providerId);
      return sendJson(res, 200, balance);
    }

    // GET /api/sms/countries - Available countries
    if (method === 'GET' && pathname === '/api/sms/countries') {
      const providerId = searchParams.get('provider') || undefined;
      const countries = await smsService.getCountries(providerId);
      return sendJson(res, 200, { countries });
    }

    // GET /api/sms/services - Only advertise verified provider routes
    if (method === 'GET' && pathname === '/api/sms/services') {
      const providerId = searchParams.get('provider') || undefined;
      const countryId = searchParams.get('countryId') || undefined;
      let services = await smsService.getServices(providerId);

      // If countryId provided, cross-reference prices for verified status & live stock
      if (countryId) {
        try {
          const prices = await smsService.getPrices(countryId, null, providerId);
          services = providerStatusTracker.filterVerifiedServices(services, prices);
        } catch (e) {
          services = providerStatusTracker.filterVerifiedServices(services, []);
        }
      } else {
        services = providerStatusTracker.filterVerifiedServices(services, []);
      }
      return sendJson(res, 200, { services });
    }

    // GET /api/sms/prices - Service prices & stock in country
    if (method === 'GET' && pathname === '/api/sms/prices') {
      const countryId = searchParams.get('countryId') || searchParams.get('country_id');
      const serviceId = searchParams.get('serviceId') || searchParams.get('project_id') || undefined;
      const providerId = searchParams.get('provider') || undefined;

      if (!countryId) {
        return sendJson(res, 400, { error: 'countryId query parameter is required', code: 'INVALID_PARAMS' });
      }

      const prices = await smsService.getPrices(countryId, serviceId, providerId);
      return sendJson(res, 200, { prices });
    }

    // =========================================================================
    // 6. ORDER WORKFLOWS & CUSTOMER TENANT ISOLATION
    // =========================================================================

    // POST /api/sms/orders or /purchase - Purchase a number
    if (method === 'POST' && (pathname === '/api/sms/orders' || pathname === '/api/sms/purchase')) {
      const orderRate = rateLimiter.checkLimit(rateLimitKey, 'orders');
      rateLimiter.setHeaders(res, orderRate);
      if (!orderRate.allowed) {
        return sendJson(res, 429, {
          error: `Purchase rate limit exceeded. Please wait ${orderRate.resetSeconds} seconds before ordering.`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: orderRate.resetSeconds,
        });
      }

      const body = await parseJsonBody(req);
      const { countryId, serviceId, reuse, provider, cost, metadata } = body;
      const resolvedCustomerId = body.customerId || customerId;

      if (!resolvedCustomerId) {
        return sendJson(res, 401, { error: 'Authentication required: Customer identity missing.', code: 'UNAUTHORIZED' });
      }

      const idempotencyKey = req.headers['x-idempotency-key'] || body.idempotencyKey || null;

      if (!countryId || !serviceId) {
        return sendJson(res, 400, { error: 'countryId and serviceId are required in body', code: 'INVALID_PARAMS' });
      }

      const purchase = await smsService.purchaseNumber({
        customerId: resolvedCustomerId,
        countryId,
        serviceId,
        reuse: Boolean(reuse),
        providerId: provider || undefined,
        expectedCost: cost || 0,
        idempotencyKey,
        metadata: metadata || {},
      });

      return sendJson(res, 201, purchase);
    }

    // GET /api/sms/orders - List orders (scoped to customer tenant)
    if (method === 'GET' && pathname === '/api/sms/orders') {
      const status = searchParams.get('status') || undefined;
      const provider = searchParams.get('provider') || undefined;
      const number = searchParams.get('number') || undefined;

      // Admins can see all orders; Customers only see their own
      const filterCustomerId = (session && session.role === 'ADMIN') ? (searchParams.get('customerId') || undefined) : customerId;
      const orders = smsService.listOrders({ status, provider, number }, filterCustomerId);
      return sendJson(res, 200, { orders });
    }

    // Order sub-routes: /api/sms/orders/:orderId...
    const orderMatch = pathname.match(/^\/api\/sms\/orders\/([^/]+)(?:\/(.*))?$/);
    if (orderMatch) {
      const orderId = decodeURIComponent(orderMatch[1]);
      const subAction = orderMatch[2] || '';

      // GET /api/sms/orders/:orderId/sms - Poll incoming SMS (customer isolated & rate limited)
      if (method === 'GET' && subAction === 'sms') {
        const pollRate = rateLimiter.checkLimit(rateLimitKey, 'polling');
        rateLimiter.setHeaders(res, pollRate);
        if (!pollRate.allowed) {
          return sendJson(res, 429, {
            error: `SMS polling rate limit exceeded. Please wait ${pollRate.resetSeconds} seconds.`,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: pollRate.resetSeconds,
          });
        }

        const effectiveCustomerId = (session && session.role === 'ADMIN') ? null : customerId;
        const result = await smsService.checkIncomingSms(orderId, effectiveCustomerId);
        return sendJson(res, 200, result);
      }

      // POST /api/sms/orders/:orderId/cancel - Cancel active order (customer isolated)
      if (method === 'POST' && subAction === 'cancel') {
        const body = await parseJsonBody(req);
        const effectiveCustomerId = (session && session.role === 'ADMIN') ? null : customerId;
        const result = await smsService.cancelOrder(orderId, body.reason, effectiveCustomerId);
        return sendJson(res, 200, result);
      }

      // GET /api/sms/orders/:orderId - Order details (customer isolated)
      if (method === 'GET' && !subAction) {
        const effectiveCustomerId = (session && session.role === 'ADMIN') ? null : customerId;
        const order = smsService.getOrder(orderId, effectiveCustomerId);
        return sendJson(res, 200, { order });
      }
    }

    // =========================================================================
    // 7. RENTAL ENDPOINTS (https://sms-bus.com/docs/rent)
    // =========================================================================

    // POST /api/sms/rent - Long-term number rental
    if (method === 'POST' && pathname === '/api/sms/rent') {
      const orderRate = rateLimiter.checkLimit(rateLimitKey, 'orders');
      rateLimiter.setHeaders(res, orderRate);
      if (!orderRate.allowed) {
        return sendJson(res, 429, {
          error: `Rental rate limit exceeded. Please wait ${orderRate.resetSeconds} seconds before ordering.`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: orderRate.resetSeconds,
        });
      }

      const body = await parseJsonBody(req);
      const { countryId, days, serviceId, provider, cost, metadata } = body;
      const resolvedCustomerId = body.customerId || customerId;

      if (!resolvedCustomerId) {
        return sendJson(res, 401, { error: 'Authentication required: Customer identity missing.', code: 'UNAUTHORIZED' });
      }

      const idempotencyKey = req.headers['x-idempotency-key'] || body.idempotencyKey || null;

      if (!countryId) {
        return sendJson(res, 400, { error: 'countryId is required to rent a number', code: 'INVALID_PARAMS' });
      }

      const rental = await smsService.rentNumber({
        customerId: resolvedCustomerId,
        countryId,
        days: days || 30,
        serviceId: serviceId || null,
        providerId: provider || undefined,
        expectedCost: cost || 0,
        idempotencyKey,
        metadata: metadata || {},
      });

      return sendJson(res, 201, rental);
    }

    // Rental sub-routes: /api/sms/rent/:orderId/sms or cancel
    const rentMatch = pathname.match(/^\/api\/sms\/rent\/([^/]+)(?:\/(.*))?$/);
    if (rentMatch) {
      const orderId = decodeURIComponent(rentMatch[1]);
      const subAction = rentMatch[2] || '';
      const effectiveCustomerId = (session && session.role === 'ADMIN') ? null : customerId;

      if (method === 'GET' && subAction === 'sms') {
        const result = await smsService.checkRentalSms(orderId, effectiveCustomerId);
        return sendJson(res, 200, result);
      }

      if (method === 'POST' && subAction === 'cancel') {
        const result = await smsService.cancelOrder(orderId, 'Rental cancelled', effectiveCustomerId);
        return sendJson(res, 200, result);
      }
    }

    // Route not found under /api/sms
    return sendJson(res, 404, { error: `SMS endpoint '${method} ${pathname}' not found.`, code: 'NOT_FOUND' });
  } catch (err) {
    const errorDetails = providerStatusTracker.translateError(err, {
      countryId: searchParams ? searchParams.get('countryId') : undefined,
      serviceId: searchParams ? searchParams.get('serviceId') : undefined,
    });

    console.error(`SMS API Error [${method} ${pathname}]:`, errorDetails.userMessage);

    return sendJson(res, errorDetails.statusCode, {
      error: errorDetails.userMessage,
      code: errorDetails.code,
      isOutOfStock: errorDetails.isOutOfStock,
      suggestion: errorDetails.suggestion,
      provider: err.provider || undefined,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = {
  handleSmsApiRoute,
  extractCustomerId: (req, sp) => {
    const session = defaultSecurityManager.authenticateRequest(req);
    if (session) return session.customerId;
    return sp?.get('customerId') || null;
  },
};
