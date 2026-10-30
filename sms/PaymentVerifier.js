/**
 * PaymentVerifier — Cryptographic Payment Intent & Webhook Signature Verification
 * 
 * Protects wallet balance integrity by requiring cryptographic proof of payment:
 * - Issues cryptographically signed payment intents
 * - Verifies upstream payment gateway webhooks (e.g. Stripe, PayPal, or crypto gateways)
 * - Prevents replay attacks using timestamp windows & nonces
 * - Enforces positive currency amounts
 */

const crypto = require('crypto');
const { CryptoVault } = require('./CryptoVault');

const PAYMENT_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || process.env.SESSION_SECRET || 'smsbus_payment_hmac_secret_2026';
const MAX_TIMESTAMP_DRIFT_SEC = 300; // 5-minute replay defense window

class PaymentVerifier {
  /**
   * @param {object} [options={}]
   * @param {string} [options.secret]
   * @param {boolean} [options.isProduction=false]
   * @param {import('./AuditLogger')} [options.auditLogger]
   */
  constructor(options = {}) {
    this.secret = options.secret || PAYMENT_SECRET;
    this.isProduction = options.isProduction !== undefined ? options.isProduction : (process.env.NODE_ENV === 'production');
    this.auditLogger = options.auditLogger || null;
    this.processedReceipts = new Set(); // Replay protection nonce cache
  }

  /**
   * Generates a signed payment intent for client-side checkout.
   * 
   * @param {object} params
   * @param {string} params.customerId
   * @param {number} params.amount
   * @param {string} [params.currency='USD']
   * @returns {{ intentId: string, customerId: string, amount: number, currency: string, timestamp: number, signature: string }}
   */
  createPaymentIntent({ customerId, amount, currency = 'USD' }) {
    if (!customerId) throw new Error('customerId is required for payment intent');
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Payment amount must be a positive number');
    }

    const intentId = `pi_${crypto.randomBytes(8).toString('hex')}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = `${intentId}:${customerId}:${numAmount.toFixed(2)}:${currency}:${timestamp}`;
    const signature = crypto.createHmac('sha256', this.secret).update(payload).digest('hex');

    return {
      intentId,
      customerId,
      amount: numAmount,
      currency,
      timestamp,
      signature,
    };
  }

  /**
   * Verifies an incoming payment proof or webhook notification.
   * 
   * @param {object} params
   * @param {string} params.intentId
   * @param {string} params.customerId
   * @param {number} params.amount
   * @param {string} [params.currency='USD']
   * @param {number} params.timestamp
   * @param {string} params.signature
   * @returns {{ verified: boolean, reason?: string }}
   */
  verifyPayment({ intentId, customerId, amount, currency = 'USD', timestamp, signature }) {
    if (!intentId || !customerId || !amount || !timestamp || !signature) {
      return { verified: false, reason: 'Missing required payment verification fields' };
    }

    // 1. Prevent replay attacks via used receipt nonces
    if (this.processedReceipts.has(intentId)) {
      if (this.auditLogger) {
        this.auditLogger.log({
          action: 'PAYMENT_REPLAY_ATTACK_DETECTED',
          actorId: customerId,
          status: 'DENIED',
          securityLevel: 'CRITICAL',
          metadata: { intentId },
        });
      }
      return { verified: false, reason: 'Payment intent has already been claimed (replay attempt)' };
    }

    // 2. Prevent replay attacks outside time drift window
    const nowSec = Math.floor(Date.now() / 1000);
    const drift = Math.abs(nowSec - Number(timestamp));
    if (drift > MAX_TIMESTAMP_DRIFT_SEC) {
      return { verified: false, reason: `Payment verification expired (timestamp drift ${drift}s > ${MAX_TIMESTAMP_DRIFT_SEC}s)` };
    }

    // 3. Cryptographic signature verification
    const numAmount = Number(amount);
    const expectedPayload = `${intentId}:${customerId}:${numAmount.toFixed(2)}:${currency}:${timestamp}`;
    const expectedSig = crypto.createHmac('sha256', this.secret).update(expectedPayload).digest('hex');

    const isValid = CryptoVault.constantTimeEqual(expectedSig, signature);
    if (!isValid) {
      if (this.auditLogger) {
        this.auditLogger.log({
          action: 'PAYMENT_SIGNATURE_INVALID',
          actorId: customerId,
          status: 'DENIED',
          securityLevel: 'CRITICAL',
          metadata: { intentId, amount: numAmount },
        });
      }
      return { verified: false, reason: 'Cryptographic payment signature mismatch' };
    }

    // Mark intent as claimed
    this.processedReceipts.add(intentId);

    if (this.auditLogger) {
      this.auditLogger.log({
        action: 'PAYMENT_VERIFIED_SUCCESS',
        actorId: customerId,
        resourceId: intentId,
        status: 'SUCCESS',
        metadata: { amount: numAmount, currency },
      });
    }

    return { verified: true };
  }
}

module.exports = PaymentVerifier;
