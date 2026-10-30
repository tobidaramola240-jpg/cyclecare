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

const { SmsProviderError } = require('./BaseSmsProvider');

class SmsService {
  /**
   * @param {object} params
   * @param {import('./SmsProviderRegistry')} params.registry
   * @param {import('./SmsOrderStore')} params.orderStore
   */
  constructor({ registry, orderStore }) {
    this.registry = registry;
    this.orderStore = orderStore;
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
   * Purchases a number and securely stores the provider request ID.
   *
   * @param {object} params
   * @param {number|string} params.countryId
   * @param {number|string} params.serviceId
   * @param {boolean} [params.reuse=false]
   * @param {string} [params.providerId]
   * @param {number} [params.expectedCost=0]
   * @param {object} [params.metadata={}]
   */
  async purchaseNumber({ countryId, serviceId, reuse = false, providerId = null, expectedCost = 0, metadata = {} }) {
    const provider = this.registry.getProvider(providerId);

    let res;
    try {
      res = await provider.purchaseNumber({ countryId, serviceId, reuse });
    } catch (err) {
      // Re-throw standardized error with context
      throw err;
    }

    // Securely persist provider request ID and metadata
    const order = this.orderStore.createOrder({
      provider: provider.id,
      providerRequestId: res.providerRequestId,
      number: res.number,
      countryId,
      serviceId,
      cost: expectedCost,
      type: 'activation',
      expiresAt: res.expiresAt,
      metadata,
    });

    return {
      order: this.orderStore.toClientJson(order),
      providerRequestId: res.providerRequestId,
      number: res.number,
      expiresAt: res.expiresAt,
    };
  }

  /**
   * Checks for incoming SMS on an active order.
   * Strictly avoids generating or showing fake SMS.
   *
   * @param {string} orderId
   */
  async checkIncomingSms(orderId) {
    const order = this.orderStore.getOrder(orderId);
    if (!order) {
      throw new SmsProviderError(`Order '${orderId}' not found.`, 'ORDER_NOT_FOUND', 404);
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
   *
   * @param {string} orderId
   * @param {string} [reason='User requested cancellation']
   */
  async cancelOrder(orderId, reason = 'User requested cancellation') {
    const order = this.orderStore.getOrder(orderId);
    if (!order) {
      throw new SmsProviderError(`Order '${orderId}' not found.`, 'ORDER_NOT_FOUND', 404);
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
    return {
      success: true,
      order: this.orderStore.toClientJson(updated),
    };
  }

  /**
   * Retrieves specific order by internal ID.
   */
  getOrder(orderId) {
    const order = this.orderStore.getOrder(orderId);
    if (!order) {
      throw new SmsProviderError(`Order '${orderId}' not found.`, 'ORDER_NOT_FOUND', 404);
    }
    return this.orderStore.toClientJson(order);
  }

  /**
   * Lists orders with filters.
   */
  listOrders(filter = {}) {
    const orders = this.orderStore.listOrders(filter);
    return orders.map(o => this.orderStore.toClientJson(o));
  }

  // =========================================================================
  // RENTAL WORKFLOWS (https://sms-bus.com/docs/rent)
  // =========================================================================

  /**
   * Purchases a long-term rental number.
   */
  async rentNumber({ countryId, days = 30, serviceId = null, providerId = null, expectedCost = 0, metadata = {} }) {
    const provider = this.registry.getProvider(providerId);

    const res = await provider.rentNumber({ countryId, days, serviceId });

    const order = this.orderStore.createOrder({
      provider: provider.id,
      providerRequestId: res.providerRequestId,
      number: res.number,
      countryId,
      serviceId,
      cost: expectedCost,
      type: 'rental',
      expiresAt: res.expiresAt,
      metadata: { ...metadata, days },
    });

    return {
      order: this.orderStore.toClientJson(order),
      providerRequestId: res.providerRequestId,
      number: res.number,
      days: res.days,
      expiresAt: res.expiresAt,
    };
  }

  /**
   * Checks incoming messages on a rental order.
   */
  async checkRentalSms(orderId) {
    const order = this.orderStore.getOrder(orderId);
    if (!order) {
      throw new SmsProviderError(`Order '${orderId}' not found.`, 'ORDER_NOT_FOUND', 404);
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
