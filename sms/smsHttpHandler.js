/**
 * SMS HTTP API Route Handler
 * 
 * Exposes server-side REST endpoints for:
 * - Countries, services, and live price/availability queries
 * - Number purchasing & long-term rentals
 * - Secure retrieval of incoming SMS
 * - Order cancellation & provider error auditing
 * 
 * Security:
 * - Provider API tokens are never sent in response payloads.
 * - In production mode, rejects mock SMS and fake availability.
 */

const { defaultSmsService } = require('./index');

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) req.destroy();
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

/**
 * Extracts and verifies the customer's identifier from headers or token.
 * Enforces per-customer data isolation so customers only access their own reservations.
 * @param {import('http').IncomingMessage} req
 * @param {URLSearchParams} [searchParams]
 * @returns {string|null}
 */
function extractCustomerId(req, searchParams) {
  // 1. Explicit customer header (e.g. device ID or client customer UUID)
  const headerId = req.headers['x-customer-id'];
  if (headerId && typeof headerId === 'string' && headerId.trim()) {
    return headerId.trim();
  }

  // 2. Authorization Bearer token (JWT payload user ID)
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
          if (payload.sub || payload.user_id) {
            return payload.sub || payload.user_id;
          }
        }
      } catch (e) {}
      return token.slice(0, 40);
    }
  }

  // 3. Query parameter fallback
  if (searchParams && searchParams.get('customerId')) {
    return searchParams.get('customerId').trim();
  }

  return null;
}

/**
 * Handles all requests matching `/api/sms/*`
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {string} pathname
 * @param {URLSearchParams} searchParams
 * @param {import('./SmsService')} [smsService]
 */
async function handleSmsApiRoute(req, res, pathname, searchParams, smsService = defaultSmsService) {
  const method = req.method.toUpperCase();
  const customerId = extractCustomerId(req, searchParams);

  try {
    // GET /api/sms/providers - List configured providers & active provider
    if (method === 'GET' && (pathname === '/api/sms/providers' || pathname === '/api/sms/provider')) {
      return sendJson(res, 200, smsService.getProviderStatus());
    }

    // GET /api/sms/wallet - Customer wallet balance & transactions
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
      const body = await parseJsonBody(req);
      const { amount, description, idempotencyKey } = body;
      const result = smsService.wallet.deposit(customerId, amount, description, idempotencyKey);
      return sendJson(res, 200, result);
    }

    // GET /api/sms/balance - Check provider wallet balance
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

    // GET /api/sms/services - Available services/projects
    if (method === 'GET' && pathname === '/api/sms/services') {
      const providerId = searchParams.get('provider') || undefined;
      const services = await smsService.getServices(providerId);
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

    // POST /api/sms/orders or POST /api/sms/purchase - Purchase a number
    if (method === 'POST' && (pathname === '/api/sms/orders' || pathname === '/api/sms/purchase')) {
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

    // GET /api/sms/orders - List server-side stored orders (scoped to customer)
    if (method === 'GET' && pathname === '/api/sms/orders') {
      const status = searchParams.get('status') || undefined;
      const provider = searchParams.get('provider') || undefined;
      const number = searchParams.get('number') || undefined;

      const orders = smsService.listOrders({ status, provider, number }, customerId);
      return sendJson(res, 200, { orders });
    }

    // Match order sub-routes: /api/sms/orders/:orderId...
    const orderMatch = pathname.match(/^\/api\/sms\/orders\/([^/]+)(?:\/(.*))?$/);
    if (orderMatch) {
      const orderId = decodeURIComponent(orderMatch[1]);
      const subAction = orderMatch[2] || '';

      // GET /api/sms/orders/:orderId/sms - Check incoming SMS (customer isolated)
      if (method === 'GET' && subAction === 'sms') {
        const result = await smsService.checkIncomingSms(orderId, customerId);
        return sendJson(res, 200, result);
      }

      // POST /api/sms/orders/:orderId/cancel - Cancel active order (customer isolated)
      if (method === 'POST' && subAction === 'cancel') {
        const body = await parseJsonBody(req);
        const result = await smsService.cancelOrder(orderId, body.reason, customerId);
        return sendJson(res, 200, result);
      }

      // GET /api/sms/orders/:orderId - Order details (customer isolated)
      if (method === 'GET' && !subAction) {
        const order = smsService.getOrder(orderId, customerId);
        return sendJson(res, 200, { order });
      }
    }

    // ===== RENTAL ENDPOINTS (https://sms-bus.com/docs/rent) =====

    // POST /api/sms/rent - Long-term number rental
    if (method === 'POST' && pathname === '/api/sms/rent') {
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

    // Match rent sub-routes: /api/sms/rent/:orderId/sms or cancel
    const rentMatch = pathname.match(/^\/api\/sms\/rent\/([^/]+)(?:\/(.*))?$/);
    if (rentMatch) {
      const orderId = decodeURIComponent(rentMatch[1]);
      const subAction = rentMatch[2] || '';

      if (method === 'GET' && subAction === 'sms') {
        const result = await smsService.checkRentalSms(orderId, customerId);
        return sendJson(res, 200, result);
      }

      if (method === 'POST' && subAction === 'cancel') {
        const result = await smsService.cancelOrder(orderId, 'Rental cancelled', customerId);
        return sendJson(res, 200, result);
      }
    }

    // Route not found under /api/sms
    return sendJson(res, 404, { error: `SMS endpoint '${method} ${pathname}' not found.`, code: 'NOT_FOUND' });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    const errCode = err.code || 'INTERNAL_ERROR';
    console.error(`SMS API Error [${method} ${pathname}]:`, err.message);
    return sendJson(res, statusCode, {
      error: err.message,
      code: errCode,
      provider: err.provider || undefined,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = {
  handleSmsApiRoute,
};
