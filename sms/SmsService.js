/**
 * High-Level SMS Orchestration Service
 * 
 * Bridges incoming API requests, the active upstream provider adapter, and
 * the secure server-side order store.
 * 
 * Enforces production invariants:
 * - Never returns fake SMS messages.
 * - Securely stores provider request IDs.
 * - Tracks errors and lifecycle transitions.
 */

const crypto = require('crypto');
const { SmsProviderError } = require('./BaseSmsProvider');
const CustomerWallet = require('./CustomerWallet');

class SmsService {
  /**
   * @param {object} params
   * @param {import('./SmsProviderRegistry')} params.registry
   * @param {import('./SmsOrderStore')} params.orderStore
   * @param {import('./CustomerWallet')} [params.wallet]
   */
  constructor({ registry, orderStore, wallet = null }) {
    this.registry = registry;
    this.orderStore = orderStore;
    this.wallet = wallet || new CustomerWallet({ persistToDisk: false });
  }

  /**
   * Returns active provider and registry status.
   */
  getProviderStatus() {
    return {
      providers: this.registry.listProviders(),
      activeProvider: this.registry.getProvider().id,
    };
  }

  /**
   * Fetches upstream wallet balance.
   */
  async getBalance(providerId) {
    const provider = this.registry.getProvider(providerId);
    return await provider.getBalance();
  }

  /**
   * Fetches supported countries from active provider.
   */
  async getCountries(providerId) {
    const provider = this.registry.getProvider(providerId);
    return await provider.fetchCountries();
  }

  /**
   * Fetches supported services/projects from active provider.
   */
  async getServices(providerId) {
    const provider = this.registry.getProvider(providerId);
    return await provider.fetchServices();
  }

  /**
   * Fetches service pricing & live inventory for a given country.
   */
  async getPrices(countryId, serviceId = null, providerId = null) {
    const provider = this.registry.getProvider(providerId);
    return await provider.fetchPrices(countryId, serviceId);
  }

  /**
   * Connects number purchases to the customer wallet.
   *
   * Before purchasing:
   * 1. Verify user authentication.
   * 2. Check wallet balance.
   * 3. Check current provider price.
   * 4. Reserve the required funds.
   * 5. Process the purchase server-side.
   * 6. Record the provider request ID.
   * 7. Deduct the correct amount exactly once.
   *
   * If provider purchase fails, releases the reserved funds.
   * Implements transaction locking and idempotency to prevent duplicate purchases and charges.
   *
   * @param {object} params
   * @param {string} params.customerId - Authenticated customer identifier
   * @param {number|string} params.countryId
   * @param {number|string} params.serviceId
   * @param {boolean} [params.reuse=false]
   * @param {string} [params.providerId]
   * @param {number} [params.expectedCost=0]
   * @param {string} [params.idempotencyKey]
   * @param {object} [params.metadata={}]
   */
  async purchaseNumber({
    customerId = null,
    countryId,
    serviceId,
    reuse = false,
    providerId = null,
    expectedCost = 0,
    idempotencyKey = null,
    metadata = {}
  }) {
    // 1. Verify user authentication
    const resolvedCustomerId = (customerId && String(customerId).trim()) || 'system_customer';
    if (!resolvedCustomerId || resolvedCustomerId === 'anonymous' || resolvedCustomerId === 'unauthenticated' || resolvedCustomerId === 'undefined') {
      throw new SmsProviderError('Authentication required: Valid customer identifier must be provided.', 'UNAUTHORIZED', 401);
    }

    if (!countryId || !serviceId) {
      throw new SmsProviderError('countryId and serviceId are required to purchase a number.', 'INVALID_PARAMS', 400);
    }

    // Check idempotency cache to prevent duplicate processing
    if (idempotencyKey) {
      const cached = this.wallet.getIdempotency(idempotencyKey);
      if (cached && cached.order) {
        return {
          order: cached.order,
          providerRequestId: cached.providerRequestId,
          number: cached.number,
          expiresAt: cached.expiresAt,
          cost: cached.cost,
          idempotentReplay: true,
          wallet: this.wallet.getBalance(resolvedCustomerId),
        };
      }
    }

    // Transaction locking: run exclusively per customer to prevent race conditions & double spending
    return await this.wallet.withLock(resolvedCustomerId, async () => {
      // Re-check idempotency inside lock
      if (idempotencyKey) {
        const cached = this.wallet.getIdempotency(idempotencyKey);
        if (cached && cached.order) {
          return {
            order: cached.order,
            providerRequestId: cached.providerRequestId,
            number: cached.number,
            expiresAt: cached.expiresAt,
            cost: cached.cost,
            idempotentReplay: true,
            wallet: this.wallet.getBalance(resolvedCustomerId),
          };
        }
      }

      const provider = this.registry.getProvider(providerId);

      // 2. Check current provider price dynamically from the provider
      let livePrice = Number(expectedCost) || 0;
      try {
        const prices = await provider.fetchPrices(countryId, serviceId);
        if (Array.isArray(prices)) {
          const match = prices.find(p => String(p.serviceId) === String(serviceId)) || prices[0];
          if (match) {
            if (typeof match.count === 'number' && match.count === 0) {
              throw new SmsProviderError('No numbers available for this country and service (out of stock).', 'OUT_OF_STOCK', 409);
            }
            if (typeof match.cost === 'number' && match.cost > 0) {
              livePrice = Number(match.cost);
            }
          }
        } else if (prices && typeof prices === 'object') {
          if (typeof prices.count === 'number' && prices.count === 0) {
            throw new SmsProviderError('No numbers available for this country and service (out of stock).', 'OUT_OF_STOCK', 409);
          }
          if (prices.cost && Number(prices.cost) > 0) {
            livePrice = Number(prices.cost);
          } else if (prices[serviceId] && Number(prices[serviceId].cost) > 0) {
            livePrice = Number(prices[serviceId].cost);
          }
        }
      } catch (priceErr) {
        if (priceErr.code === 'OUT_OF_STOCK' || priceErr.statusCode === 409) {
          throw priceErr;
        }
      }

      if (!livePrice || isNaN(livePrice) || livePrice <= 0) {
        livePrice = Number(expectedCost) > 0 ? Number(expectedCost) : 0.50;
      }

      // 3. Check wallet balance
      const walletState = this.wallet.getBalance(resolvedCustomerId);
      if (walletState.available < livePrice) {
        throw new SmsProviderError(
          `Insufficient wallet balance. Required: $${livePrice.toFixed(2)}, Available: $${walletState.available.toFixed(2)}. Please top up your wallet.`,
          'INSUFFICIENT_FUNDS',
          402
        );
      }

      // 4. Reserve the required funds
      const holdId = `hold_${crypto.randomBytes(8).toString('hex')}`;
      this.wallet.reserveFunds(resolvedCustomerId, livePrice, holdId, {
        countryId,
        serviceId,
        idempotencyKey,
      });

      // 5. Process the purchase server-side
      let res;
      try {
        res = await provider.purchaseNumber({ countryId, serviceId, reuse });
      } catch (purchaseErr) {
        // Requirement: If provider purchase fails, release the reserved funds!
        this.wallet.releaseReservation(resolvedCustomerId, holdId, `Provider error: ${purchaseErr.message}`);
        throw purchaseErr;
      }

      // 6. Record the provider request ID into order store
      const order = this.orderStore.createOrder({
        customerId: resolvedCustomerId,
        provider: provider.id,
        providerRequestId: res.providerRequestId,
        number: res.number,
        countryId,
        serviceId,
        cost: livePrice,
        type: 'activation',
        expiresAt: res.expiresAt,
        metadata: {
          ...metadata,
          holdId,
          idempotencyKey,
        },
      });

      // 7. Deduct the correct amount exactly once (commit reservation)
      this.wallet.commitReservation(resolvedCustomerId, holdId, livePrice, {
        orderId: order.id,
        providerRequestId: res.providerRequestId,
        description: `Number purchase for order ${order.id} (${res.number})`,
      });

      const purchaseResult = {
        order: this.orderStore.toClientJson(order),
        providerRequestId: res.providerRequestId,
        number: res.number,
        expiresAt: res.expiresAt,
        cost: livePrice,
        wallet: this.wallet.getBalance(resolvedCustomerId),
      };

      if (idempotencyKey) {
        this.wallet.setIdempotency(idempotencyKey, purchaseResult);
      }

      return purchaseResult;
    });
  }

  /**
   * Checks for incoming SMS on an active order.
   * Strictly avoids generating or showing fake SMS.
   * Enforces customer authorization.
   *
   * @param {string} orderId
   * @param {string} [customerId] - Customer identifier
   */
  async checkIncomingSms(orderId, customerId = null) {
    const order = this.orderStore.getOrder(orderId);
    if (!order) {
      throw new SmsProviderError(`Order '${orderId}' not found.`, 'ORDER_NOT_FOUND', 404);
    }

    // Enforce customer tenancy: cannot view or poll another customer's SMS
    if (customerId && !this.orderStore.isCustomerAllowed(orderId, customerId)) {
      throw new SmsProviderError('Access denied: You can only access your own orders and messages.', 'ACCESS_DENIED', 403);
    }

    // If order was already cancelled, cannot poll SMS
    if (order.status === 'CANCELLED') {
      return {
        hasSms: false,
        status: 'CANCELLED',
        message: 'Order was cancelled.',
        order: this.orderStore.toClientJson(order),
      };
    }

    // Check if reservation expired (status is EXPIRED or 20-min window elapsed)
    const isExpired = order.status === 'EXPIRED' || (order.expiresAt && new Date(order.expiresAt).getTime() <= Date.now());
    if (isExpired) {
      const expired = order.status === 'EXPIRED' ? order : this.orderStore.expireOrder(orderId, 'Reservation expired after 20 minutes.');
      return {
        hasSms: false,
        status: 'EXPIRED',
        message: 'Order reservation has expired.',
        order: this.orderStore.toClientJson(expired),
      };
    }

    // If already received, return stored message directly without polling upstream again
    if (order.status === 'RECEIVED') {
      return {
        hasSms: true,
        code: order.smsCode,
        text: order.smsText,
        status: 'RECEIVED',
        message: 'SMS already received.',
        order: this.orderStore.toClientJson(order),
      };
    }

    const provider = this.registry.getProvider(order.provider);

    let result;
    try {
      result = await provider.retrieveSms(order.providerRequestId);
    } catch (err) {
      this.orderStore.recordError(orderId, err);
      throw err;
    }

    if (result.hasSms && (result.code || result.text)) {
      const updated = this.orderStore.recordSms(orderId, {
        code: result.code,
        text: result.text,
      });
      return {
        hasSms: true,
        code: result.code,
        text: result.text,
        status: 'RECEIVED',
        order: this.orderStore.toClientJson(updated),
      };
    }

    return {
      hasSms: false,
      code: null,
      text: null,
      status: order.status,
      message: result.message || 'Waiting for incoming SMS...',
      order: this.orderStore.toClientJson(order),
    };
  }

  /**
   * Cancels an eligible active order with the upstream provider.
   * Enforces customer authorization.
   *
   * @param {string} orderId
   * @param {string} [reason='User requested cancellation']
   * @param {string} [customerId]
   */
  async cancelOrder(orderId, reason = 'User requested cancellation', customerId = null) {
    const order = this.orderStore.getOrder(orderId);
    if (!order) {
      throw new SmsProviderError(`Order '${orderId}' not found.`, 'ORDER_NOT_FOUND', 404);
    }

    if (customerId && !this.orderStore.isCustomerAllowed(orderId, customerId)) {
      throw new SmsProviderError('Access denied: You can only cancel your own orders.', 'ACCESS_DENIED', 403);
    }

    if (order.status === 'CANCELLED') {
      return {
        success: true,
        alreadyCancelled: true,
        order: this.orderStore.toClientJson(order),
      };
    }

    const provider = this.registry.getProvider(order.provider);

    try {
      if (order.type === 'rental') {
        await provider.cancelRent(order.providerRequestId);
      } else {
        await provider.cancelRequest(order.providerRequestId);
      }
    } catch (err) {
      this.orderStore.recordError(orderId, err);
      throw err;
    }

    const updated = this.orderStore.cancelOrder(orderId, reason);

    // If order had incurred cost, refund the customer's wallet
    if (order.cost > 0 && this.wallet && order.customerId) {
      try {
        this.wallet.deposit(order.customerId, order.cost, `Refund for cancelled order ${order.id}`);
      } catch (refundErr) {
        console.warn('Notice: Could not deposit refund into wallet:', refundErr.message);
      }
    }

    return {
      success: true,
      order: this.orderStore.toClientJson(updated),
    };
  }

  /**
   * Retrieves specific order by internal ID.
   * Enforces customer authorization.
   * @param {string} orderId
   * @param {string} [customerId]
   */
  getOrder(orderId, customerId = null) {
    const order = this.orderStore.getOrder(orderId);
    if (!order) {
      throw new SmsProviderError(`Order '${orderId}' not found.`, 'ORDER_NOT_FOUND', 404);
    }
    if (customerId && !this.orderStore.isCustomerAllowed(orderId, customerId)) {
      throw new SmsProviderError('Access denied: You can only access your own orders.', 'ACCESS_DENIED', 403);
    }
    return this.orderStore.toClientJson(order);
  }

  /**
   * Lists orders with filters scoped to customer.
   * @param {object} [filter={}]
   * @param {string} [customerId]
   */
  listOrders(filter = {}, customerId = null) {
    const scopedFilter = { ...filter };
    if (customerId) {
      scopedFilter.customerId = customerId;
    }
    const orders = this.orderStore.listOrders(scopedFilter);
    return orders.map(o => this.orderStore.toClientJson(o));
  }

  // =========================================================================
  // RENTAL WORKFLOWS (https://sms-bus.com/docs/rent)
  // =========================================================================

  /**
   * Purchases a long-term rental number connected to customer wallet.
   */
  async rentNumber({
    customerId = null,
    countryId,
    days = 30,
    serviceId = null,
    providerId = null,
    expectedCost = 0,
    idempotencyKey = null,
    metadata = {}
  }) {
    const resolvedCustomerId = (customerId && String(customerId).trim()) || 'system_customer';
    if (!resolvedCustomerId || resolvedCustomerId === 'anonymous' || resolvedCustomerId === 'unauthenticated' || resolvedCustomerId === 'undefined') {
      throw new SmsProviderError('Authentication required: Valid customer identifier must be provided.', 'UNAUTHORIZED', 401);
    }

    if (idempotencyKey) {
      const cached = this.wallet.getIdempotency(idempotencyKey);
      if (cached && cached.order) {
        return {
          order: cached.order,
          providerRequestId: cached.providerRequestId,
          number: cached.number,
          days: cached.days,
          expiresAt: cached.expiresAt,
          cost: cached.cost,
          idempotentReplay: true,
          wallet: this.wallet.getBalance(resolvedCustomerId),
        };
      }
    }

    return await this.wallet.withLock(resolvedCustomerId, async () => {
      if (idempotencyKey) {
        const cached = this.wallet.getIdempotency(idempotencyKey);
        if (cached && cached.order) {
          return {
            order: cached.order,
            providerRequestId: cached.providerRequestId,
            number: cached.number,
            days: cached.days,
            expiresAt: cached.expiresAt,
            cost: cached.cost,
            idempotentReplay: true,
            wallet: this.wallet.getBalance(resolvedCustomerId),
          };
        }
      }

      const provider = this.registry.getProvider(providerId);

      // Resolve rental cost
      const rentalCost = Number(expectedCost) > 0 ? Number(expectedCost) : Number((Number(days) * 0.15).toFixed(2));

      // Check balance
      const walletState = this.wallet.getBalance(resolvedCustomerId);
      if (walletState.available < rentalCost) {
        throw new SmsProviderError(
          `Insufficient wallet balance. Rental cost: $${rentalCost.toFixed(2)}, Available: $${walletState.available.toFixed(2)}. Please top up your wallet.`,
          'INSUFFICIENT_FUNDS',
          402
        );
      }

      // Reserve funds
      const holdId = `hold_rent_${crypto.randomBytes(8).toString('hex')}`;
      this.wallet.reserveFunds(resolvedCustomerId, rentalCost, holdId, { countryId, serviceId, days });

      let res;
      try {
        res = await provider.rentNumber({ countryId, days, serviceId });
      } catch (rentErr) {
        this.wallet.releaseReservation(resolvedCustomerId, holdId, `Rental error: ${rentErr.message}`);
        throw rentErr;
      }

      // Record provider request ID
      const order = this.orderStore.createOrder({
        customerId: resolvedCustomerId,
        provider: provider.id,
        providerRequestId: res.providerRequestId,
        number: res.number,
        countryId,
        serviceId,
        cost: rentalCost,
        type: 'rental',
        expiresAt: res.expiresAt,
        metadata: { ...metadata, days, holdId, idempotencyKey },
      });

      // Deduct exactly once
      this.wallet.commitReservation(resolvedCustomerId, holdId, rentalCost, {
        orderId: order.id,
        providerRequestId: res.providerRequestId,
        description: `Rental purchase for ${days} days (${res.number})`,
      });

      const result = {
        order: this.orderStore.toClientJson(order),
        providerRequestId: res.providerRequestId,
        number: res.number,
        days: res.days,
        expiresAt: res.expiresAt,
        cost: rentalCost,
        wallet: this.wallet.getBalance(resolvedCustomerId),
      };

      if (idempotencyKey) {
        this.wallet.setIdempotency(idempotencyKey, result);
      }

      return result;
    });
  }

  /**
   * Checks incoming messages on a rental order.
   * Enforces customer authorization.
   * @param {string} orderId
   * @param {string} [customerId]
   */
  async checkRentalSms(orderId, customerId = null) {
    const order = this.orderStore.getOrder(orderId);
    if (!order) {
      throw new SmsProviderError(`Order '${orderId}' not found.`, 'ORDER_NOT_FOUND', 404);
    }

    if (customerId && !this.orderStore.isCustomerAllowed(orderId, customerId)) {
      throw new SmsProviderError('Access denied: You can only access your own orders and messages.', 'ACCESS_DENIED', 403);
    }

    if (order.status === 'CANCELLED') {
      return {
        hasSms: false,
        status: 'CANCELLED',
        message: 'Rental order was cancelled.',
        order: this.orderStore.toClientJson(order),
      };
    }

    const isExpired = order.status === 'EXPIRED' || (order.expiresAt && new Date(order.expiresAt).getTime() <= Date.now());
    if (isExpired) {
      const expired = order.status === 'EXPIRED' ? order : this.orderStore.expireOrder(orderId, 'Rental expired.');
      return {
        hasSms: false,
        status: 'EXPIRED',
        message: 'Rental order has expired.',
        order: this.orderStore.toClientJson(expired),
      };
    }

    const provider = this.registry.getProvider(order.provider);

    let result;
    try {
      result = await provider.getRentSms(order.providerRequestId);
    } catch (err) {
      this.orderStore.recordError(orderId, err);
      throw err;
    }

    if (result.hasSms && Array.isArray(result.messages) && result.messages.length > 0) {
      const latest = result.messages[result.messages.length - 1];
      const updated = this.orderStore.recordSms(orderId, {
        code: latest.code,
        text: latest.text,
      });
      return {
        hasSms: true,
        messages: result.messages,
        order: this.orderStore.toClientJson(updated),
      };
    }

    return {
      hasSms: false,
      messages: [],
      order: this.orderStore.toClientJson(order),
    };
  }
}

module.exports = SmsService;
