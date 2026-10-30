/**
 * Unified SMS Provider Module Exports
 * 
 * Provides configured singletons and factory creation for:
 * - SMS-BUS and extensible provider registry
 * - 2PC Customer Wallet & Ledger
 * - Cryptographic Security, Scrypt Auth, & RBAC (SecurityManager)
 * - Anti-DDoS Sliding Window Rate Limiting (RateLimiter)
 * - Cryptographic Payment Intent & Webhook Verification (PaymentVerifier)
 * - Carrier Compliance & Anti-Abuse Guard (AntiAbuseGuard)
 * - Real-Time Provider Health & Error Translation (ProviderStatusTracker)
 * - Tamper-Evident Audit Logging (AuditLogger)
 * - AES-256-GCM Encrypted Secrets Vault (CryptoVault)
 */

const { BaseSmsProvider, SmsProviderError } = require('./BaseSmsProvider');
const SmsBusAdapter = require('./SmsBusAdapter');
const SmsOrderStore = require('./SmsOrderStore');
const SmsProviderRegistry = require('./SmsProviderRegistry');
const SmsService = require('./SmsService');
const CustomerWallet = require('./CustomerWallet');
const { CryptoVault } = require('./CryptoVault');
const AuditLogger = require('./AuditLogger');
const SecurityManager = require('./SecurityManager');
const RateLimiter = require('./RateLimiter');
const PaymentVerifier = require('./PaymentVerifier');
const AntiAbuseGuard = require('./AntiAbuseGuard');
const ProviderStatusTracker = require('./ProviderStatusTracker');

// 1. Audit Logger
const defaultAuditLogger = new AuditLogger();

// 2. Security & RBAC Manager
const defaultSecurityManager = new SecurityManager({ auditLogger: defaultAuditLogger });

// 3. Sliding Window Rate Limiter
const defaultRateLimiter = new RateLimiter({ auditLogger: defaultAuditLogger });

// 4. Payment Intent & Webhook Verifier
const defaultPaymentVerifier = new PaymentVerifier({ auditLogger: defaultAuditLogger });

// 5. Anti-Abuse & Carrier Rules Guard
const defaultAntiAbuseGuard = new AntiAbuseGuard({ auditLogger: defaultAuditLogger });

// 6. Provider Health & Error Tracker
const defaultProviderStatusTracker = new ProviderStatusTracker({ auditLogger: defaultAuditLogger });

// 7. Provider Registry & SMS-BUS Adapter
const defaultRegistry = new SmsProviderRegistry('smsbus');
const defaultSmsBus = new SmsBusAdapter();
defaultRegistry.register(defaultSmsBus, true);

// 8. Order Store & Customer Wallet
const defaultOrderStore = new SmsOrderStore();
const defaultWallet = new CustomerWallet();

// 9. Unified High-Level SMS Orchestration Service
const defaultSmsService = new SmsService({
  registry: defaultRegistry,
  orderStore: defaultOrderStore,
  wallet: defaultWallet,
  auditLogger: defaultAuditLogger,
  antiAbuseGuard: defaultAntiAbuseGuard,
  providerStatusTracker: defaultProviderStatusTracker,
});

module.exports = {
  // Classes for extension
  BaseSmsProvider,
  SmsProviderError,
  SmsBusAdapter,
  SmsOrderStore,
  SmsProviderRegistry,
  SmsService,
  CustomerWallet,
  CryptoVault,
  AuditLogger,
  SecurityManager,
  RateLimiter,
  PaymentVerifier,
  AntiAbuseGuard,
  ProviderStatusTracker,

  // Default production instances
  defaultRegistry,
  defaultOrderStore,
  defaultWallet,
  defaultAuditLogger,
  defaultSecurityManager,
  defaultRateLimiter,
  defaultPaymentVerifier,
  defaultAntiAbuseGuard,
  defaultProviderStatusTracker,
  defaultSmsService,

  // Factory function for customized test or isolated environments
  createSmsService: (options = {}) => {
    const registry = new SmsProviderRegistry(options.activeProviderId || 'smsbus');
    const smsBus = new SmsBusAdapter(options.smsBusConfig || {});
    registry.register(smsBus, true);

    if (options.additionalProviders) {
      for (const p of options.additionalProviders) {
        registry.register(p);
      }
    }

    const orderStore = new SmsOrderStore({
      persistToDisk: options.persistToDisk !== false,
      filePath: options.filePath,
    });

    const wallet = options.wallet || new CustomerWallet({
      persistToDisk: options.persistToDisk !== false,
      initialCredit: typeof options.initialCredit === 'number' ? options.initialCredit : 5.00,
    });

    const auditLogger = options.auditLogger || new AuditLogger({
      persistToDisk: options.persistToDisk !== false,
    });

    const antiAbuseGuard = options.antiAbuseGuard || new AntiAbuseGuard({
      auditLogger,
      maxActiveOrders: options.maxActiveOrders || 3,
      cooldownMs: options.cooldownMs !== undefined ? options.cooldownMs : 3000,
      maxHourlyPurchases: options.maxHourlyPurchases || 10,
    });

    const providerStatusTracker = options.providerStatusTracker || new ProviderStatusTracker({
      auditLogger,
    });

    return new SmsService({
      registry,
      orderStore,
      wallet,
      auditLogger,
      antiAbuseGuard,
      providerStatusTracker,
    });
  },
};
