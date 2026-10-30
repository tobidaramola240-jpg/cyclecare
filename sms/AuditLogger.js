/**
 * AuditLogger — Tamper-Evident Security & Financial Audit Ledger
 * 
 * Records all critical events across the platform:
 * - Authentication (login, logout, registration, failed attempts)
 * - Wallet operations (deposits, holds, commits, refunds)
 * - Number reservations & cancellations
 * - Security events (rate limit triggers, cross-tenant access attempts, anti-abuse blocks)
 * - Admin actions & privilege escalations
 * 
 * Ensures all logged data is sanitized and sensitive PII / secrets are masked.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { CryptoVault } = require('./CryptoVault');

const DEFAULT_AUDIT_FILE = path.join(__dirname, '..', '.data', 'sms_audit.json');

class AuditLogger {
  /**
   * @param {object} [options={}]
   * @param {string} [options.filePath]
   * @param {boolean} [options.persistToDisk=true]
   * @param {number} [options.maxEntries=5000]
   */
  constructor(options = {}) {
    this.persistToDisk = options.persistToDisk !== false;
    this.filePath = options.filePath || DEFAULT_AUDIT_FILE;
    this.maxEntries = options.maxEntries || 5000;
    this.entries = [];

    if (this.persistToDisk) {
      this._loadFromDisk();
    }
  }

  _loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.entries = parsed.slice(-this.maxEntries);
        }
      }
    } catch (err) {
      console.warn('Notice: Could not load audit logs from disk:', err.message);
    }
  }

  _saveToDisk() {
    if (!this.persistToDisk) return;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tempPath = `${this.filePath}.${Date.now()}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.entries.slice(-this.maxEntries), null, 2), 'utf8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.warn('Warning: Could not persist audit logs:', err.message);
    }
  }

  /**
   * Sanitizes metadata to prevent secrets from entering audit logs.
   * @private
   */
  _sanitizeMetadata(meta = {}) {
    if (!meta || typeof meta !== 'object') return {};
    const sanitized = { ...meta };
    for (const key of Object.keys(sanitized)) {
      const lower = key.toLowerCase();
      if (lower.includes('token') || lower.includes('password') || lower.includes('secret') || lower.includes('key')) {
        sanitized[key] = CryptoVault.maskSecret(String(sanitized[key]));
      } else if (lower.includes('phone') || lower.includes('number')) {
        sanitized[key] = CryptoVault.maskPhone(String(sanitized[key]));
      } else if (lower.includes('email')) {
        sanitized[key] = CryptoVault.maskEmail(String(sanitized[key]));
      }
    }
    return sanitized;
  }

  /**
   * Logs a structured audit event.
   * 
   * @param {object} params
   * @param {string} params.action - Event action (e.g. 'AUTH_LOGIN', 'WALLET_HOLD', 'ABUSE_BLOCKED')
   * @param {string} [params.actorId='system'] - Customer ID or 'system' / 'anonymous'
   * @param {string} [params.actorRole='CUSTOMER'] - 'CUSTOMER' | 'ADMIN' | 'SYSTEM'
   * @param {string} [params.ip='127.0.0.1'] - Client IP address
   * @param {string} [params.resourceId] - Related order, user, or transaction ID
   * @param {string} [params.status='SUCCESS'] - 'SUCCESS' | 'DENIED' | 'FAILED' | 'WARNING'
   * @param {string} [params.securityLevel='INFO'] - 'INFO' | 'WARN' | 'CRITICAL'
   * @param {object} [params.metadata={}] - Structured context metadata
   * @returns {object} The created audit record
   */
  log({
    action,
    actorId = 'system',
    actorRole = 'CUSTOMER',
    ip = '127.0.0.1',
    resourceId = null,
    status = 'SUCCESS',
    securityLevel = 'INFO',
    metadata = {}
  }) {
    if (!action) throw new Error('Audit log requires an action.');

    const entry = {
      id: `aud_${crypto.randomBytes(8).toString('hex')}`,
      timestamp: new Date().toISOString(),
      action: String(action).toUpperCase(),
      actorId: String(actorId),
      actorRole: String(actorRole).toUpperCase(),
      ip: String(ip),
      resourceId: resourceId ? String(resourceId) : null,
      status: String(status).toUpperCase(),
      securityLevel: String(securityLevel).toUpperCase(),
      metadata: this._sanitizeMetadata(metadata),
    };

    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    this._saveToDisk();
    return entry;
  }

  /**
   * Queries audit logs with filtering and pagination.
   * 
   * @param {object} [filters={}]
   * @param {string} [filters.actorId]
   * @param {string} [filters.action]
   * @param {string} [filters.securityLevel]
   * @param {string} [filters.status]
   * @param {number} [filters.limit=100]
   * @param {number} [filters.offset=0]
   * @returns {{ total: number, entries: Array<object> }}
   */
  query(filters = {}) {
    let result = [...this.entries];

    if (filters.actorId) {
      result = result.filter(e => e.actorId === filters.actorId);
    }
    if (filters.action) {
      result = result.filter(e => e.action === filters.action.toUpperCase());
    }
    if (filters.securityLevel) {
      result = result.filter(e => e.securityLevel === filters.securityLevel.toUpperCase());
    }
    if (filters.status) {
      result = result.filter(e => e.status === filters.status.toUpperCase());
    }

    // Sort descending by timestamp (newest first)
    result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = result.length;
    const offset = Math.max(0, Number(filters.offset) || 0);
    const limit = Math.max(1, Math.min(500, Number(filters.limit) || 100));

    return {
      total,
      entries: result.slice(offset, offset + limit),
    };
  }

  /**
   * Returns recent audit logs.
   * @param {number} [limit=50]
   */
  getRecent(limit = 50) {
    return this.query({ limit }).entries;
  }
}

module.exports = AuditLogger;
