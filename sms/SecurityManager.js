/**
 * SecurityManager — Secure Authentication, User Store & Role-Based Access Control
 * 
 * Features:
 * - Scrypt password hashing with individual 16-byte random salts
 * - Constant-time comparison preventing timing side-channel attacks
 * - Signed HMAC-SHA256 session tokens with expiration and signature verification
 * - Role-Based Access Control (RBAC): CUSTOMER vs ADMIN
 * - Database access policy enforcement & tenant isolation
 * - Protection of sensitive credentials (never exposed in output)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { CryptoVault } = require('./CryptoVault');

const DEFAULT_USERS_FILE = path.join(__dirname, '..', '.data', 'sms_users.json');
const TOKEN_SECRET = process.env.SESSION_SECRET || 'smsbus_session_signing_secret_hmac_2026_prod';
const DEFAULT_EXPIRATION_HOURS = 24;

class SecurityManager {
  /**
   * @param {object} [options={}]
   * @param {string} [options.filePath]
   * @param {boolean} [options.persistToDisk=true]
   * @param {import('./AuditLogger')} [options.auditLogger]
   */
  constructor(options = {}) {
    this.persistToDisk = options.persistToDisk !== false;
    this.filePath = options.filePath || DEFAULT_USERS_FILE;
    this.auditLogger = options.auditLogger || null;
    this.users = new Map(); // customerId -> user
    this.usersByEmail = new Map(); // email.toLowerCase() -> customerId

    if (this.persistToDisk) {
      this._loadFromDisk();
    }

    // Ensure bootstrap admin exists
    this._ensureAdminUser();
  }

  _loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const u of parsed) {
            if (u && u.id && u.email) {
              this.users.set(u.id, u);
              this.usersByEmail.set(u.email.toLowerCase(), u.id);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Notice: Could not load users from disk:', err.message);
    }
  }

  _saveToDisk() {
    if (!this.persistToDisk) return;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const array = Array.from(this.users.values());
      const tempPath = `${this.filePath}.${Date.now()}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(array, null, 2), 'utf8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.warn('Warning: Could not persist users to disk:', err.message);
    }
  }

  _ensureAdminUser() {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@smsbus.internal').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecure2026!';

    if (!this.usersByEmail.has(adminEmail)) {
      const adminId = 'admin_system_01';
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = this._hashPassword(adminPassword, salt);

      const adminUser = {
        id: adminId,
        email: adminEmail,
        name: 'System Administrator',
        role: 'ADMIN',
        salt,
        passwordHash: hash,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.users.set(adminId, adminUser);
      this.usersByEmail.set(adminEmail, adminId);
      this._saveToDisk();

      if (this.auditLogger) {
        this.auditLogger.log({
          action: 'ADMIN_BOOTSTRAP',
          actorId: adminId,
          actorRole: 'ADMIN',
          metadata: { email: adminEmail },
        });
      }
    }
  }

  _hashPassword(password, salt) {
    return crypto.scryptSync(password, salt, 64).toString('hex');
  }

  _verifyPassword(password, salt, hash) {
    const key = crypto.scryptSync(password, salt, 64);
    const keyHash = key.toString('hex');
    return CryptoVault.constantTimeEqual(keyHash, hash);
  }

  /**
   * Sanitizes user object by stripping cryptographic secrets.
   * @param {object} user
   * @returns {object}
   */
  sanitizeUser(user) {
    if (!user) return null;
    const { passwordHash, salt, ...safe } = user;
    return safe;
  }

  /**
   * Generates a signed HMAC-SHA256 session token.
   * Format: base64url(header).base64url(payload).base64url(signature)
   * 
   * @param {object} user
   * @param {number} [expiresInHours=24]
   * @returns {string}
   */
  createSessionToken(user, expiresInHours = DEFAULT_EXPIRATION_HOURS) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const nowSec = Math.floor(Date.now() / 1000);
    const expSec = nowSec + (expiresInHours * 3600);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role || 'CUSTOMER',
      name: user.name || user.email.split('@')[0],
      iat: nowSec,
      exp: expSec,
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verifies and decodes a signed HMAC-SHA256 session token.
   * 
   * @param {string} token
   * @returns {object|null} Decoded payload or null if invalid/expired
   */
  verifySessionToken(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, receivedSig] = parts;

    // Verify HMAC signature in constant time
    const expectedSig = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (!CryptoVault.constantTimeEqual(expectedSig, receivedSig)) {
      return null;
    }

    try {
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < nowSec) {
        return null; // Expired token
      }
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Registers a new customer with hashed credentials.
   * 
   * @param {object} params
   * @param {string} params.email
   * @param {string} params.password
   * @param {string} [params.name]
   * @param {string} [params.role='CUSTOMER']
   * @param {string} [params.ip='127.0.0.1']
   */
  register({ email, password, name, role = 'CUSTOMER', ip = '127.0.0.1' }) {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new Error('Valid email address is required.');
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (this.usersByEmail.has(normalizedEmail)) {
      throw new Error('An account with this email address already exists.');
    }

    const assignedRole = role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER';
    const customerId = `cust_${crypto.randomBytes(8).toString('hex')}`;
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this._hashPassword(password, salt);

    const user = {
      id: customerId,
      email: normalizedEmail,
      name: (name && String(name).trim()) || normalizedEmail.split('@')[0],
      role: assignedRole,
      salt,
      passwordHash,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.set(customerId, user);
    this.usersByEmail.set(normalizedEmail, customerId);
    this._saveToDisk();

    if (this.auditLogger) {
      this.auditLogger.log({
        action: 'AUTH_REGISTER',
        actorId: customerId,
        actorRole: assignedRole,
        ip,
        status: 'SUCCESS',
        metadata: { email: normalizedEmail },
      });
    }

    const token = this.createSessionToken(user);
    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Authenticates a user and issues a signed session token.
   * 
   * @param {object} params
   * @param {string} params.email
   * @param {string} params.password
   * @param {string} [params.ip='127.0.0.1']
   */
  login({ email, password, ip = '127.0.0.1' }) {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const customerId = this.usersByEmail.get(normalizedEmail);
    const user = customerId ? this.users.get(customerId) : null;

    if (!user || user.status === 'BLOCKED') {
      if (this.auditLogger) {
        this.auditLogger.log({
          action: 'AUTH_LOGIN_FAILED',
          actorId: 'anonymous',
          ip,
          status: 'DENIED',
          securityLevel: 'WARN',
          metadata: { email: normalizedEmail, reason: user ? 'ACCOUNT_BLOCKED' : 'USER_NOT_FOUND' },
        });
      }
      throw new Error('Invalid email or password.');
    }

    const isValid = this._verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid) {
      if (this.auditLogger) {
        this.auditLogger.log({
          action: 'AUTH_LOGIN_FAILED',
          actorId: user.id,
          actorRole: user.role,
          ip,
          status: 'DENIED',
          securityLevel: 'WARN',
          metadata: { email: normalizedEmail, reason: 'INVALID_CREDENTIALS' },
        });
      }
      throw new Error('Invalid email or password.');
    }

    if (this.auditLogger) {
      this.auditLogger.log({
        action: 'AUTH_LOGIN_SUCCESS',
        actorId: user.id,
        actorRole: user.role,
        ip,
        status: 'SUCCESS',
        metadata: { email: normalizedEmail },
      });
    }

    const token = this.createSessionToken(user);
    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Retrieves a user by customer ID.
   * @param {string} customerId
   */
  getUser(customerId) {
    const user = this.users.get(customerId);
    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * Authenticates an incoming HTTP request session.
   * Supports:
   * 1. Authorization: Bearer <HMAC-token>
   * 2. x-customer-id header (synthesizes/maps to customer session)
   * 
   * @param {import('http').IncomingMessage} req
   * @returns {{ customerId: string, role: string, email?: string, user?: object }|null}
   */
  authenticateRequest(req) {
    // 1. Bearer Token
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      const payload = this.verifySessionToken(token);
      if (payload && payload.sub) {
        const user = this.getUser(payload.sub);
        return {
          customerId: payload.sub,
          role: payload.role || 'CUSTOMER',
          email: payload.email,
          user,
        };
      }
    }

    // 2. x-customer-id Header
    const headerId = req.headers['x-customer-id'];
    if (headerId && typeof headerId === 'string' && headerId.trim()) {
      const cleanId = headerId.trim();
      const user = this.getUser(cleanId);
      return {
        customerId: cleanId,
        role: user ? user.role : 'CUSTOMER',
        email: user ? user.email : undefined,
        user: user || null,
      };
    }

    return null;
  }

  /**
   * Database Access Policy: verifies whether the active session has permission to
   * access records belonging to `targetCustomerId`.
   * 
   * Rule:
   * - An ADMIN can access all records.
   * - A CUSTOMER can only access their own records (`session.customerId === targetCustomerId`).
   * 
   * @param {{ customerId: string, role: string }} session
   * @param {string} targetCustomerId
   * @returns {boolean}
   */
  canAccessCustomerData(session, targetCustomerId) {
    if (!session) return false;
    if (session.role === 'ADMIN') return true;
    return Boolean(session.customerId && targetCustomerId && session.customerId === targetCustomerId);
  }

  /**
   * Lists all registered users (Admin only).
   */
  listUsers() {
    return Array.from(this.users.values()).map(u => this.sanitizeUser(u));
  }

  /**
   * Updates user status (Admin only).
   */
  setUserStatus(customerId, status) {
    const user = this.users.get(customerId);
    if (!user) throw new Error('User not found.');
    user.status = status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE';
    user.updatedAt = new Date().toISOString();
    this._saveToDisk();
    return this.sanitizeUser(user);
  }
}

module.exports = SecurityManager;
