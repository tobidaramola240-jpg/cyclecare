/**
 * Unified SMS Provider Module Exports
 * 
 * Provides configured singleton and factory creation for SMS-BUS and extensible providers.
 */

const { BaseSmsProvider, SmsProviderError } = require('./BaseSmsProvider');
const SmsBusAdapter = require('./SmsBusAdapter');
const SmsOrderStore = require('./SmsOrderStore');
const SmsProviderRegistry = require('./SmsProviderRegistry');
const SmsService = require('./SmsService');
const CustomerWallet = require('./CustomerWallet');

// Instantiate default registry
const defaultRegistry = new SmsProviderRegistry('smsbus');

// Register SMS-BUS as default provider
const defaultSmsBus = new SmsBusAdapter();
defaultRegistry.register(defaultSmsBus, true);

// Instantiate default order store
const defaultOrderStore = new SmsOrderStore();

// Instantiate default customer wallet store
const defaultWallet = new CustomerWallet();

// Instantiate default unified service
const defaultSmsService = new SmsService({
  registry: defaultRegistry,
  orderStore: defaultOrderStore,
  wallet: defaultWallet,
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

  // Default instances
  defaultRegistry,
  defaultOrderStore,
  defaultWallet,
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

    return new SmsService({ registry, orderStore, wallet });
  },
};
