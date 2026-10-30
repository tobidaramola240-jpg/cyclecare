/**
 * RateLimiter — Sliding Window API Rate Limiter
 * 
 * Provides DDoS protection, anti-brute-force defense, and abuse prevention.
 * Uses a sliding-window counter algorithm with millisecond precision.
 */

class RateLimiter {
  /**
   * @param {object} [options={}]
   * @param {import('./AuditLogger')} [options.auditLogger]
   * @param {object} [options.limits]
   */
  constructor(options = {}) {
    this.auditLogger = options.auditLogger || null;
    this.windows = new Map(); // `${bucket}:${key}` -> Array<number> (timestamps in ms)

    // Default rate limit configurations
    this.limits = {
      auth: { max: 5, windowMs: 60 * 1000 },      // 5 auth attempts per min
      orders: { max: 6, windowMs: 60 * 1000 },    // 6 purchases/reservations per min (anti-bot)
      polling: { max: 60, windowMs: 60 * 1000 },  // 60 SMS status pings per min
      wallet: { max: 10, windowMs: 60 * 1000 },   // 10 top-ups per min
      general: { max: 120, windowMs: 60 * 1000 }, // 120 standard API calls per min
      ...options.limits,
    };

    // Periodic garbage collection every 2 minutes
    this._cleanupInterval = setInterval(() => this._cleanup(), 2 * 60 * 1000);
    if (this._cleanupInterval.unref) {
      this._cleanupInterval.unref();
    }
  }

  _cleanup() {
    const now = Date.now();
    for (const [compositeKey, timestamps] of this.windows.entries()) {
      const bucket = compositeKey.split(':')[0];
      const cfg = this.limits[bucket] || this.limits.general;
      const validTimestamps = timestamps.filter(ts => (now - ts) < cfg.windowMs);
      if (validTimestamps.length === 0) {
        this.windows.delete(compositeKey);
      } else {
        this.windows.set(compositeKey, validTimestamps);
      }
    }
  }

  /**
   * Checks if an action is allowed under the specified rate limit bucket.
   * 
   * @param {string} key - Client identifier (IP address, Customer ID, or both)
   * @param {string} [bucket='general'] - Bucket name ('auth' | 'orders' | 'polling' | 'wallet' | 'general')
   * @returns {{ allowed: boolean, remaining: number, resetSeconds: number, limit: number }}
   */
  checkLimit(key, bucket = 'general') {
    const cfg = this.limits[bucket] || this.limits.general;
    const compositeKey = `${bucket}:${key}`;
    const now = Date.now();
    const cutoff = now - cfg.windowMs;

    let timestamps = this.windows.get(compositeKey) || [];
    // Prune entries outside the current sliding window
    timestamps = timestamps.filter(ts => ts > cutoff);

    if (timestamps.length >= cfg.max) {
      const oldestInWindow = timestamps[0] || now;
      const resetMs = Math.max(0, (oldestInWindow + cfg.windowMs) - now);
      const resetSeconds = Math.ceil(resetMs / 1000) || 1;

      if (this.auditLogger) {
        this.auditLogger.log({
          action: 'RATE_LIMIT_EXCEEDED',
          actorId: key,
          status: 'DENIED',
          securityLevel: 'WARN',
          metadata: { bucket, limit: cfg.max, resetSeconds },
        });
      }

      return {
        allowed: false,
        remaining: 0,
        resetSeconds,
        limit: cfg.max,
      };
    }

    // Record request timestamp
    timestamps.push(now);
    this.windows.set(compositeKey, timestamps);

    const remaining = Math.max(0, cfg.max - timestamps.length);
    const resetSeconds = Math.ceil(cfg.windowMs / 1000);

    return {
      allowed: true,
      remaining,
      resetSeconds,
      limit: cfg.max,
    };
  }

  /**
   * Helper method to attach rate limit headers to HTTP response.
   */
  setHeaders(res, result) {
    if (!res || !result) return;
    res.setHeader('X-RateLimit-Limit', String(result.limit));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader('X-RateLimit-Reset', String(result.resetSeconds));
    if (!result.allowed) {
      res.setHeader('Retry-After', String(result.resetSeconds));
    }
  }

  /**
   * Resets all windows (useful for testing).
   */
  reset() {
    this.windows.clear();
  }

  destroy() {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
    }
  }
}

module.exports = RateLimiter;
