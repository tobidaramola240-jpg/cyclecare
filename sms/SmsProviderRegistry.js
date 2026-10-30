/**
 * Configurable SMS Provider Registry
 * 
 * Enables multi-provider routing and supplier swapping.
 * Supports hot-registering new authorized SMS suppliers (e.g. 5SIM, SMS-Activate, DaisySMS).
 */

const { BaseSmsProvider, SmsProviderError } = require('./BaseSmsProvider');

class SmsProviderRegistry {
  constructor(defaultProviderId = 'smsbus') {
    this.providers = new Map();
    this.activeProviderId = defaultProviderId;
  }

  /**
   * Registers a provider instance.
   * @param {BaseSmsProvider} provider
   * @param {boolean} [setActive=false]
   */
  register(provider, setActive = false) {
    if (!(provider instanceof BaseSmsProvider)) {
      throw new Error('Provider must be an instance extending BaseSmsProvider.');
    }
    this.providers.set(provider.id, provider);
    if (setActive || !this.activeProviderId) {
      this.activeProviderId = provider.id;
    }
    return this;
  }

  /**
   * Unregisters a provider.
   * @param {string} id
   */
  unregister(id) {
    this.providers.delete(id);
    if (this.activeProviderId === id) {
      const remaining = Array.from(this.providers.keys());
      this.activeProviderId = remaining[0] || null;
    }
  }

  /**
   * Sets the active provider by ID.
   * @param {string} id
   */
  setActiveProvider(id) {
    if (!this.providers.has(id)) {
      throw new SmsProviderError(
        `Cannot set active provider '${id}'. Provider not registered. Available: ${Array.from(this.providers.keys()).join(', ')}`,
        'PROVIDER_NOT_REGISTERED',
        404
      );
    }
    this.activeProviderId = id;
  }

  /**
   * Gets a specific provider or the currently active provider.
   * @param {string} [id]
   * @returns {BaseSmsProvider}
   */
  getProvider(id) {
    const targetId = id || this.activeProviderId;
    if (!targetId || !this.providers.has(targetId)) {
      throw new SmsProviderError(
        `No SMS provider found for ID '${targetId}'. Registered: ${Array.from(this.providers.keys()).join(', ') || 'none'}`,
        'PROVIDER_NOT_FOUND',
        404
      );
    }
    return this.providers.get(targetId);
  }

  /**
   * Lists all registered providers and their status.
   * Client-safe: never returns API credentials.
   * @returns {Array<{ id: string, name: string, isConfigured: boolean, isActive: boolean }>}
   */
  listProviders() {
    const list = [];
    for (const [id, provider] of this.providers.entries()) {
      list.push({
        id: provider.id,
        name: provider.name,
        isConfigured: provider.isConfigured(),
        isActive: id === this.activeProviderId,
      });
    }
    return list;
  }
}

module.exports = SmsProviderRegistry;
