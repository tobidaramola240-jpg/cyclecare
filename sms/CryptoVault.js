/**
 * CryptoVault — Encrypted Secrets & Data Protection Engine
 * 
 * Provides:
 * - Authenticated AES-256-GCM encryption and decryption for sensitive data at rest
 * - Cryptographic key derivation (PBKDF2 with SHA-256, 100,000 iterations)
 * - Safe identifier and PII masking (phone numbers, tokens, emails)
 * - Cryptographically secure token and secret generation
 * - Protection against timing attacks with constant-time equality
 */

const crypto = require('crypto');

// Master encryption key fallback (can be overridden via MASTER_ENCRYPTION_KEY env var)
const DEFAULT_SALT = 'smsbus_salt_production_entropy_2026';
const MASTER_SECRET = process.env.MASTER_ENCRYPTION_KEY || process.env.SESSION_SECRET || 'smsbus-production-master-secret-key-32b!';

// Derive a 32-byte AES key using PBKDF2
function deriveKey(secret = MASTER_SECRET, salt = DEFAULT_SALT) {
  return crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha256');
}

const GLOBAL_AES_KEY = deriveKey();

class CryptoVault {
  /**
   * Encrypts plaintext using AES-256-GCM with a fresh random 12-byte IV.
   * Format: "iv:authTag:ciphertext" (in hex)
   * 
   * @param {string|object} data - Plaintext or JSON object to encrypt
   * @param {Buffer} [customKey] - Optional custom 32-byte key
   * @returns {string} Encrypted string
   */
  static encrypt(data, customKey = GLOBAL_AES_KEY) {
    if (data === null || data === undefined) return '';
    const plaintext = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', customKey, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypts an AES-256-GCM encrypted string.
   * 
   * @param {string} encryptedString - Format "iv:authTag:ciphertext"
   * @param {Buffer} [customKey] - Optional custom 32-byte key
   * @returns {string|object} Decrypted plaintext (or parsed JSON if valid JSON)
   */
  static decrypt(encryptedString, customKey = GLOBAL_AES_KEY) {
    if (!encryptedString || typeof encryptedString !== 'string') return '';
    const parts = encryptedString.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format. Expected iv:authTag:ciphertext');
    }

    const [ivHex, authTagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', customKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  }

  /**
   * Generates a cryptographically secure random hexadecimal or url-safe token.
   * @param {number} [bytes=32]
   * @returns {string}
   */
  static generateRandomToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Masks a phone number to protect customer PII in logs and public UI.
   * Example: "+12025550199" -> "+1 (***) ***-0199"
   * 
   * @param {string} phone
   * @returns {string} Masked phone number
   */
  static maskPhone(phone) {
    if (!phone || typeof phone !== 'string') return '***';
    const clean = phone.replace(/[^0-9+]/g, '');
    if (clean.length <= 4) return '***';
    const last4 = clean.slice(-4);
    const prefix = clean.startsWith('+') ? clean.slice(0, 2) : '';
    return `${prefix} (***) ***-${last4}`;
  }

  /**
   * Masks sensitive secrets like API keys or provider tokens.
   * Example: "smsbus_live_98a7b6c5d4e3" -> "smsbus_li...d4e3"
   * 
   * @param {string} secret
   * @returns {string} Masked string
   */
  static maskSecret(secret) {
    if (!secret || typeof secret !== 'string') return '***';
    if (secret.length <= 8) return '****';
    const start = secret.slice(0, 6);
    const end = secret.slice(-4);
    return `${start}...${end}`;
  }

  /**
   * Masks an email address for public display.
   * Example: "alex.smith@example.com" -> "a***h@example.com"
   * 
   * @param {string} email
   * @returns {string} Masked email
   */
  static maskEmail(email) {
    if (!email || typeof email !== 'string') return '***';
    const parts = email.split('@');
    if (parts.length !== 2) return '***';
    const [user, domain] = parts;
    if (user.length <= 2) return `${user[0] || '*'}***@${domain}`;
    return `${user[0]}***${user[user.length - 1]}@${domain}`;
  }

  /**
   * Constant-time string comparison to prevent timing attacks.
   * 
   * @param {string} a
   * @param {string} b
   * @returns {boolean}
   */
  static constantTimeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }
}

module.exports = {
  CryptoVault,
  deriveKey,
  GLOBAL_AES_KEY,
};
