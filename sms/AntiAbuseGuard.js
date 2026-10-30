/**
 * AntiAbuseGuard — Compliance & Anti-Abuse Protection Engine
 * 
 * Enforces third-party provider rules and carrier policies:
 * - Prohibits bulk automated account creation and bot harvesting
 * - Limits concurrent active reservations per customer (max 3 concurrent)
 * - Enforces purchase cooldown intervals (minimum 3 seconds between purchases)
 * - Enforces hourly velocity limits (max 10 purchases/hr)
 * - Requires explicit Acceptable Use Policy (AUP) compliance
 */

class AntiAbuseGuard {
  /**
   * @param {object} [options={}]
   * @param {number} [options.maxActiveOrders=5]
   * @param {number} [options.cooldownMs=1000]
   * @param {number} [options.maxHourlyPurchases=30]
   * @param {import('./AuditLogger')} [options.auditLogger]
   */
  constructor(options = {}) {
    this.maxActiveOrders = options.maxActiveOrders || 5;
    this.cooldownMs = options.cooldownMs !== undefined ? options.cooldownMs : 1000;
    this.maxHourlyPurchases = options.maxHourlyPurchases || 30;
    this.auditLogger = options.auditLogger || null;

    this.lastPurchaseTime = new Map(); // customerId -> timestamp
    this.hourlyHistory = new Map();     // customerId -> Array<timestamp>
  }

  /**
   * Evaluates if a customer is allowed to place a new number reservation.
   * 
   * @param {object} params
   * @param {string} params.customerId
   * @param {Array<object>} activeOrders - List of current orders for this customer
   * @param {string} [params.ip='127.0.0.1']
   * @returns {{ allowed: boolean, reason?: string, code?: string, statusCode?: number }}
   */
  evaluateOrderRequest({ customerId, activeOrders = [], ip = '127.0.0.1' }) {
    if (!customerId) {
      return { allowed: false, reason: 'Customer identifier is required.', code: 'UNAUTHORIZED', statusCode: 401 };
    }

    const now = Date.now();

    // 1. Concurrent active reservation limit (prevents bot hoarding)
    // Only count truly active PENDING reservations whose 20-min window has NOT expired
    const pendingOrders = activeOrders.filter(o => {
      if (!o || o.status !== 'PENDING') return false;
      if (o.expiresAt && new Date(o.expiresAt).getTime() <= now) return false;
      return true;
    });

    if (pendingOrders.length >= this.maxActiveOrders) {
      const reason = `Reservation quota exceeded: You have ${pendingOrders.length} active numbers awaiting SMS. Maximum allowed is ${this.maxActiveOrders} to prevent bulk account creation abuse. Complete or cancel active numbers before requesting another.`;
      if (this.auditLogger) {
        this.auditLogger.log({
          action: 'ABUSE_CONCURRENT_LIMIT_BLOCKED',
          actorId: customerId,
          ip,
          status: 'DENIED',
          securityLevel: 'WARN',
          metadata: { activeCount: pendingOrders.length, max: this.maxActiveOrders },
        });
      }
      return {
        allowed: false,
        reason,
        code: 'MAX_ACTIVE_EXCEEDED',
        statusCode: 429,
      };
    }

    // 2. Cooldown between purchases (prevents automated rapid bursts)
    const lastTime = this.lastPurchaseTime.get(customerId) || 0;
    const elapsed = now - lastTime;
    if (elapsed < this.cooldownMs) {
      const remainingSec = Math.ceil((this.cooldownMs - elapsed) / 1000);
      const reason = `Automated purchase rate limit: Please wait ${remainingSec}s before ordering another number. Bulk scripted requests are prohibited.`;
      if (this.auditLogger) {
        this.auditLogger.log({
          action: 'ABUSE_COOLDOWN_BLOCKED',
          actorId: customerId,
          ip,
          status: 'DENIED',
          securityLevel: 'WARN',
          metadata: { elapsedMs: elapsed, cooldownMs: this.cooldownMs },
        });
      }
      return {
        allowed: false,
        reason,
        code: 'COOLDOWN_ACTIVE',
        statusCode: 429,
      };
    }

    // 3. Hourly velocity check
    let hourly = this.hourlyHistory.get(customerId) || [];
    const oneHourAgo = now - 3600 * 1000;
    hourly = hourly.filter(t => t > oneHourAgo);

    if (hourly.length >= this.maxHourlyPurchases) {
      const reason = `Hourly purchase velocity exceeded: Maximum ${this.maxHourlyPurchases} numbers per hour permitted. Bulk fake-account creation is strictly prohibited under carrier and provider terms.`;
      if (this.auditLogger) {
        this.auditLogger.log({
          action: 'ABUSE_VELOCITY_BLOCKED',
          actorId: customerId,
          ip,
          status: 'DENIED',
          securityLevel: 'WARN',
          metadata: { hourlyCount: hourly.length, max: this.maxHourlyPurchases },
        });
      }
      return {
        allowed: false,
        reason,
        code: 'VELOCITY_LIMIT_EXCEEDED',
        statusCode: 429,
      };
    }

    return { allowed: true };
  }

  /**
   * Records a successful purchase to enforce cooldowns and velocity limits.
   * @param {string} customerId
   */
  recordPurchase(customerId) {
    const now = Date.now();
    this.lastPurchaseTime.set(customerId, now);

    let hourly = this.hourlyHistory.get(customerId) || [];
    hourly = hourly.filter(t => (now - t) < 3600 * 1000);
    hourly.push(now);
    this.hourlyHistory.set(customerId, hourly);
  }

  /**
   * Returns official Acceptable Use Policy text for transparency.
   */
  getAcceptableUsePolicy() {
    return {
      title: 'SMS Gateway Acceptable Use & Anti-Abuse Policy',
      version: '2026.1',
      rules: [
        'Phone numbers are provisioned strictly for legitimate personal identity verification and authorized developer testing.',
        'Bulk automated account creation, bot farm verification, and syndication to circumvent third-party platform security are strictly prohibited.',
        'Spam delivery, phishing, credential harvesting, or fraudulent financial activities will result in immediate permanent account termination and referral to regulatory authorities.',
        'All orders are subject to carrier routing policies and upstream provider inventory constraints.',
      ],
      complianceOfficerContact: 'compliance@smsbus.io',
    };
  }
}

module.exports = AntiAbuseGuard;
