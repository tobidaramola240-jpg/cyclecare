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

// Instantiate default registry
const defaultRegistry = new SmsProviderRegistry('smsbus');

// Register SMS-BUS as default provider
const defaultSmsBus = new SmsBusAdapter();
defaultRegistry.register(defaultSmsBus, true);

// Instantiate default order store
const defaultOrderStore = new SmsOrderStore();

// Instantiate default unified service
const defaultSmsService = new SmsService({
  registry: defaultRegistry,
  orderStore: defaultOrderStore,
});

module.exports = {
  // Classes for extension
  BaseSmsProvider,
  SmsProviderError,
  SmsBusAdapter,
  SmsOrderStore,
  SmsProviderRegistry,
  SmsService,

  // Default instances
  defaultRegistry,
  defaultOrderStore,
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

    return new SmsService({ registry, orderStore });
  },
};
