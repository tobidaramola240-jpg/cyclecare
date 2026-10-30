/**
 * Secure Server-Side SMS Order Store
 * 
 * Safely persists provider request IDs, orders, incoming SMS, and error logs.
 * Never stores or exposes provider API tokens.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_STORE_DIR = path.join(__dirname, '..', '.data');
const DEFAULT_STORE_FILE = path.join(DEFAULT_STORE_DIR, 'sms_orders.json');

class SmsOrderStore {
  /**
   * @param {object} [options={}]
   * @param {string} [options.filePath] - Persistence file path
   * @param {boolean} [options.persistToDisk=true] - Whether to sync to disk
   */
  constructor(options = {}) {
    this.persistToDisk = options.persistToDisk !== false;
    this.filePath = options.filePath || DEFAULT_STORE_FILE;
    this.orders = new Map();

    if (this.persistToDisk) {
      this._loadFromDisk();
    }
  }

  /**
   * Loads existing orders from disk.
   * @private
   */
  _loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const order of parsed) {
            if (order && order.id) {
              this.orders.set(order.id, order);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Notice: Could not load stored SMS orders from disk:', err.message);
    }
  }

  /**
   * Flushes current orders to disk atomically.
   * @private
   */
  _saveToDisk() {
    if (!this.persistToDisk) return;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const array = Array.from(this.orders.values());
      const tempPath = `${this.filePath}.${Date.now()}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(array, null, 2), 'utf8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.warn('Warning: Could not persist SMS orders to disk:', err.message);
    }
  }

  /**
   * Creates and stores a new SMS order.
   * Securely saves the provider request ID.
   *
   * @param {object} params
   * @param {string} params.provider - Provider ID (e.g. 'smsbus')
   * @param {string|number} params.providerRequestId - Secure provider request identifier
   * @param {string} params.number - Allocated phone number
   * @param {number|string} params.countryId - Target country ID
   * @param {number|string} params.serviceId - Target service/project ID
   * @param {number} [params.cost=0] - Purchase price
   * @param {string} [params.type='activation'] - 'activation' or 'rental'
   * @param {string} [params.expiresAt] - Expiration timestamp
   * @param {object} [params.metadata={}] - Additional context
   * @returns {object} The created order
   */
  createOrder(params) {
    if (!params.provider) throw new Error('Order requires a provider.');
    if (!params.providerRequestId) throw new Error('Order requires a providerRequestId.');
    if (!params.number) throw new Error('Order requires a phone number.');

    const now = new Date().toISOString();
    const id = `ord_${crypto.randomBytes(8).toString('hex')}`;

    const order = {
      id,
      provider: params.provider,
      providerRequestId: String(params.providerRequestId),
      number: params.number,
      countryId: params.countryId,
      serviceId: params.serviceId,
      cost: Number(params.cost || 0),
      type: params.type || 'activation',
      status: 'PENDING', // PENDING | RECEIVED | CANCELLED | EXPIRED | FAILED
      smsCode: null,
      smsText: null,
      messages: [],
      errorHistory: [],
      createdAt: now,
      updatedAt: now,
      expiresAt: params.expiresAt || new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      metadata: params.metadata || {},
    };

    this.orders.set(id, order);
    this._saveToDisk();
    return order;
  }

  /**
   * Retrieves an order by internal ID.
   * @param {string} id
   * @returns {object|null}
   */
  getOrder(id) {
    return this.orders.get(id) || null;
  }

  /**
   * Finds an order by provider request ID.
   * @param {string} provider
   * @param {string|number} providerRequestId
   * @returns {object|null}
   */
  getOrderByProviderRequestId(provider, providerRequestId) {
    const target = String(providerRequestId);
    for (const order of this.orders.values()) {
      if (order.provider === provider && order.providerRequestId === target) {
        return order;
      }
    }
    return null;
  }

  /**
   * Lists orders with optional filters.
   * @param {object} [filter={}]
   * @returns {Array<object>}
   */
  listOrders(filter = {}) {
    let list = Array.from(this.orders.values());

    if (filter.status) {
      list = list.filter(o => o.status === filter.status);
    }
    if (filter.provider) {
      list = list.filter(o => o.provider === filter.provider);
    }
    if (filter.number) {
      list = list.filter(o => o.number.includes(filter.number));
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Updates an order.
   * @param {string} id
   * @param {object} updates
   * @returns {object|null}
   */
  updateOrder(id, updates) {
    const order = this.orders.get(id);
    if (!order) return null;

    Object.assign(order, updates, { updatedAt: new Date().toISOString() });
    this.orders.set(id, order);
    this._saveToDisk();
    return order;
  }

  /**
   * Records received SMS on an order.
   * @param {string} id
   * @param {object} smsData
   * @param {string} [smsData.code]
   * @param {string} [smsData.text]
   * @returns {object|null}
   */
  recordSms(id, smsData) {
    const order = this.orders.get(id);
    if (!order) return null;

    const entry = {
      receivedAt: new Date().toISOString(),
      code: smsData.code || null,
      text: smsData.text || null,
    };

    order.status = 'RECEIVED';
    order.smsCode = smsData.code || order.smsCode;
    order.smsText = smsData.text || order.smsText;
    order.messages.push(entry);
    order.updatedAt = new Date().toISOString();

    this.orders.set(id, order);
    this._saveToDisk();
    return order;
  }

  /**
   * Records a provider error against an order.
   * @param {string} id
   * @param {object} err
   */
  recordError(id, err) {
    const order = this.orders.get(id);
    if (!order) return null;

    order.errorHistory.push({
      timestamp: new Date().toISOString(),
      code: err.code || 'UNKNOWN_ERROR',
      message: err.message || String(err),
      statusCode: err.statusCode || 500,
    });
    order.updatedAt = new Date().toISOString();

    this.orders.set(id, order);
    this._saveToDisk();
    return order;
  }

  /**
   * Marks an order as CANCELLED.
   * @param {string} id
   * @param {string} [reason]
   * @returns {object|null}
   */
  cancelOrder(id, reason = 'User cancelled') {
    const order = this.orders.get(id);
    if (!order) return null;

    order.status = 'CANCELLED';
    order.cancelledAt = new Date().toISOString();
    order.cancelReason = reason;
    order.updatedAt = new Date().toISOString();

    this.orders.set(id, order);
    this._saveToDisk();
    return order;
  }

  /**
   * Returns a sanitized, client-safe JSON representation of an order.
   * Guarantees internal credentials are never exposed.
   * @param {object} order
   * @returns {object}
   */
  toClientJson(order) {
    if (!order) return null;
    return {
      id: order.id,
      provider: order.provider,
      providerRequestId: order.providerRequestId,
      number: order.number,
      countryId: order.countryId,
      serviceId: order.serviceId,
      cost: order.cost,
      type: order.type,
      status: order.status,
      smsCode: order.smsCode,
      smsText: order.smsText,
      messages: order.messages,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      expiresAt: order.expiresAt,
      errorCount: order.errorHistory.length,
      lastError: order.errorHistory[order.errorHistory.length - 1] || null,
    };
  }
}

module.exports = SmsOrderStore;
