/**
 * Customer Wallet & Ledger Service
 * 
 * Provides:
 * - Multi-tenant customer wallet balances and currency management
 * - Two-phase fund reservation (hold / commit / release)
 * - Atomic transaction locking (prevents race conditions & double-spending)
 * - Idempotency cache (prevents duplicate purchases and double charges)
 * - Complete audit ledger history
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { SmsProviderError } = require('./BaseSmsProvider');

class MutexQueue {
  constructor() {
    this.locks = new Map();
  }

  /**
   * Executes an async function exclusively per key (e.g. customerId).
   * Guarantees sequential execution for identical customer requests.
   * @param {string} key
   * @param {Function} asyncFn
   */
  async runExclusive(key, asyncFn) {
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }
    let resolveLock;
    const lockPromise = new Promise(resolve => { resolveLock = resolve; });
    this.locks.set(key, lockPromise);

    try {
      return await asyncFn();
    } finally {
      this.locks.delete(key);
      resolveLock();
    }
  }
}

class CustomerWallet {
  /**
   * @param {object} [options]
   * @param {boolean} [options.persistToDisk=true]
   * @param {string} [options.filePath]
   * @param {number} [options.initialCredit=5.00] - Default credit for newly initialized wallets
   */
  constructor(options = {}) {
    this.persistToDisk = options.persistToDisk !== false;
    this.filePath = options.filePath || path.join(__dirname, '..', '.data', 'sms_wallets.json');
    this.initialCredit = typeof options.initialCredit === 'number' ? options.initialCredit : 5.00;

    this.wallets = new Map();
    this.idempotencyRecords = new Map(); // idempotencyKey -> { status, order, timestamp }
    this.mutex = new MutexQueue();

    this._loadFromDisk();
  }

  _loadFromDisk() {
    if (!this.persistToDisk) return;
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            this.wallets.set(item.customerId, item);
          }
        }
      }
    } catch (e) {
      console.warn('Notice: Could not load sms_wallets.json, initializing fresh store:', e.message);
    }
  }

  _saveToDisk() {
    if (!this.persistToDisk) return;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = Array.from(this.wallets.values());
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.warn('Notice: Could not save sms_wallets.json:', e.message);
    }
  }

  /**
   * Resolves or initializes a customer wallet.
   * @param {string} customerId
   * @returns {object}
   */
  getOrCreateWallet(customerId) {
    if (!customerId) {
      throw new SmsProviderError('Customer ID is required to access wallet.', 'UNAUTHORIZED', 401);
    }
    const cid = String(customerId).trim();
    if (!this.wallets.has(cid)) {
      const now = new Date().toISOString();
      const newWallet = {
        customerId: cid,
        balance: this.initialCredit, // Welcome balance
        reserved: 0.00,
        currency: 'USD',
        transactions: this.initialCredit > 0 ? [{
          id: `tx_${crypto.randomBytes(6).toString('hex')}`,
          type: 'DEPOSIT',
          amount: this.initialCredit,
          balanceAfter: this.initialCredit,
          reservedAfter: 0.00,
          availableAfter: this.initialCredit,
          referenceId: 'welcome_credit',
          timestamp: now,
          description: 'Initial wallet welcome balance',
        }] : [],
        activeHolds: {},
        createdAt: now,
        updatedAt: now,
      };
      this.wallets.set(cid, newWallet);
      this._saveToDisk();
    }
    return this.wallets.get(cid);
  }

  /**
   * Returns current balance metrics for a customer.
   * @param {string} customerId
   * @returns {object}
   */
  getBalance(customerId) {
    const wallet = this.getOrCreateWallet(customerId);
    const balance = Number(wallet.balance.toFixed(4));
    const reserved = Number(wallet.reserved.toFixed(4));
    const available = Number(Math.max(0, balance - reserved).toFixed(4));

    return {
      customerId: wallet.customerId,
      balance,
      reserved,
      available,
      currency: wallet.currency || 'USD',
      activeHoldsCount: Object.keys(wallet.activeHolds || {}).length,
    };
  }

  /**
   * Deposits funds into a customer's wallet.
   * @param {string} customerId
   * @param {number} amount
   * @param {string} [description='Funds deposit']
   * @param {string} [idempotencyKey=null]
   */
  deposit(customerId, amount, description = 'Funds deposit', idempotencyKey = null) {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new SmsProviderError('Deposit amount must be a positive number.', 'INVALID_AMOUNT', 400);
    }

    const wallet = this.getOrCreateWallet(customerId);

    // Check idempotency
    if (idempotencyKey) {
      const existing = wallet.transactions.find(t => t.idempotencyKey === idempotencyKey);
      if (existing) {
        return this.getBalance(customerId);
      }
    }

    wallet.balance = Number((wallet.balance + numAmount).toFixed(4));
    const now = new Date().toISOString();

    const tx = {
      id: `tx_${crypto.randomBytes(6).toString('hex')}`,
      type: 'DEPOSIT',
      amount: numAmount,
      balanceAfter: Number(wallet.balance.toFixed(4)),
      reservedAfter: Number(wallet.reserved.toFixed(4)),
      availableAfter: Number(Math.max(0, wallet.balance - wallet.reserved).toFixed(4)),
      referenceId: idempotencyKey || 'deposit_' + Date.now(),
      idempotencyKey: idempotencyKey || null,
      timestamp: now,
      description,
    };

    wallet.transactions.push(tx);
    wallet.updatedAt = now;
    this.wallets.set(wallet.customerId, wallet);
    this._saveToDisk();

    return {
      ...this.getBalance(customerId),
      transaction: tx,
    };
  }

  /**
   * Phase 1 of 2-Phase Commit:
   * Checks available balance and reserves the required purchase funds.
   * 
   * @param {string} customerId
   * @param {number} amount
   * @param {string} holdId
   * @param {object} [metadata={}]
   */
  reserveFunds(customerId, amount, holdId, metadata = {}) {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new SmsProviderError('Hold amount must be a positive number.', 'INVALID_AMOUNT', 400);
    }

    const wallet = this.getOrCreateWallet(customerId);
    const available = Number((wallet.balance - wallet.reserved).toFixed(4));

    if (available < numAmount) {
      throw new SmsProviderError(
        `Insufficient wallet balance. Required: $${numAmount.toFixed(2)}, Available: $${available.toFixed(2)}. Please top up your wallet.`,
        'INSUFFICIENT_FUNDS',
        402
      );
    }

    // Atomically increment reserved funds
    wallet.reserved = Number((wallet.reserved + numAmount).toFixed(4));
    const now = new Date().toISOString();

    if (!wallet.activeHolds) wallet.activeHolds = {};
    wallet.activeHolds[holdId] = {
      amount: numAmount,
      createdAt: now,
      metadata,
    };

    const tx = {
      id: `tx_${crypto.randomBytes(6).toString('hex')}`,
      type: 'HOLD_RESERVED',
      amount: numAmount,
      balanceAfter: Number(wallet.balance.toFixed(4)),
      reservedAfter: Number(wallet.reserved.toFixed(4)),
      availableAfter: Number(Math.max(0, wallet.balance - wallet.reserved).toFixed(4)),
      referenceId: holdId,
      timestamp: now,
      description: `Funds reserved for order hold (${holdId})`,
    };

    wallet.transactions.push(tx);
    wallet.updatedAt = now;
    this.wallets.set(wallet.customerId, wallet);
    this._saveToDisk();

    return {
      holdId,
      amount: numAmount,
      available: Number(Math.max(0, wallet.balance - wallet.reserved).toFixed(4)),
    };
  }

  /**
   * Phase 2 (Success) of 2-Phase Commit:
   * Commits the reservation, deducting the exact amount from balance and releasing the hold.
   * 
   * @param {string} customerId
   * @param {string} holdId
   * @param {number} [actualAmount]
   * @param {object} [metadata={}]
   */
  commitReservation(customerId, holdId, actualAmount = null, metadata = {}) {
    const wallet = this.getOrCreateWallet(customerId);
    if (!wallet.activeHolds || !wallet.activeHolds[holdId]) {
      throw new SmsProviderError(`Active hold '${holdId}' not found. Cannot commit funds.`, 'HOLD_NOT_FOUND', 404);
    }

    const hold = wallet.activeHolds[holdId];
    const deductAmount = typeof actualAmount === 'number' ? actualAmount : hold.amount;

    // Release the hold reservation
    wallet.reserved = Number(Math.max(0, wallet.reserved - hold.amount).toFixed(4));
    // Deduct exact amount from wallet balance exactly once
    wallet.balance = Number(Math.max(0, wallet.balance - deductAmount).toFixed(4));

    delete wallet.activeHolds[holdId];

    const now = new Date().toISOString();
    const tx = {
      id: `tx_${crypto.randomBytes(6).toString('hex')}`,
      type: 'PURCHASE_DEBIT',
      amount: deductAmount,
      balanceAfter: Number(wallet.balance.toFixed(4)),
      reservedAfter: Number(wallet.reserved.toFixed(4)),
      availableAfter: Number(Math.max(0, wallet.balance - wallet.reserved).toFixed(4)),
      referenceId: metadata.orderId || holdId,
      providerRequestId: metadata.providerRequestId || null,
      timestamp: now,
      description: metadata.description || `Purchase debit for order ${metadata.orderId || holdId}`,
    };

    wallet.transactions.push(tx);
    wallet.updatedAt = now;
    this.wallets.set(wallet.customerId, wallet);
    this._saveToDisk();

    return {
      success: true,
      deducted: deductAmount,
      balance: Number(wallet.balance.toFixed(4)),
      available: Number(Math.max(0, wallet.balance - wallet.reserved).toFixed(4)),
      transaction: tx,
    };
  }

  /**
   * Rollback of 2-Phase Commit:
   * If provider purchase fails, releases the reserved funds back to available balance.
   * Zero debit occurs.
   * 
   * @param {string} customerId
   * @param {string} holdId
   * @param {string} [reason='Purchase failed']
   */
  releaseReservation(customerId, holdId, reason = 'Purchase failed') {
    const wallet = this.getOrCreateWallet(customerId);
    if (!wallet.activeHolds || !wallet.activeHolds[holdId]) {
      return { released: false, reason: 'Hold not found or already released' };
    }

    const hold = wallet.activeHolds[holdId];
    wallet.reserved = Number(Math.max(0, wallet.reserved - hold.amount).toFixed(4));
    delete wallet.activeHolds[holdId];

    const now = new Date().toISOString();
    const tx = {
      id: `tx_${crypto.randomBytes(6).toString('hex')}`,
      type: 'HOLD_RELEASED',
      amount: hold.amount,
      balanceAfter: Number(wallet.balance.toFixed(4)),
      reservedAfter: Number(wallet.reserved.toFixed(4)),
      availableAfter: Number(Math.max(0, wallet.balance - wallet.reserved).toFixed(4)),
      referenceId: holdId,
      timestamp: now,
      description: `Reserved funds released: ${reason}`,
    };

    wallet.transactions.push(tx);
    wallet.updatedAt = now;
    this.wallets.set(wallet.customerId, wallet);
    this._saveToDisk();

    return {
      released: true,
      holdId,
      amount: hold.amount,
      available: Number(Math.max(0, wallet.balance - wallet.reserved).toFixed(4)),
      transaction: tx,
    };
  }

  /**
   * Retrieves transaction ledger history for a customer.
   * @param {string} customerId
   * @returns {Array}
   */
  getTransactions(customerId) {
    const wallet = this.getOrCreateWallet(customerId);
    return [...wallet.transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Runs an operation with transactional customer-level mutex lock.
   * @param {string} customerId
   * @param {Function} asyncFn
   */
  async withLock(customerId, asyncFn) {
    return await this.mutex.runExclusive(customerId, asyncFn);
  }

  /**
   * Idempotency cache checker & recorder
   */
  getIdempotency(key) {
    if (!key) return null;
    return this.idempotencyRecords.get(key) || null;
  }

  setIdempotency(key, record) {
    if (!key) return;
    this.idempotencyRecords.set(key, {
      ...record,
      timestamp: Date.now(),
    });
  }
}

module.exports = CustomerWallet;
