/**
 * Base SMS Provider Interface & Standard Error Classes
 * 
 * Provides a standardized contract for upstream SMS verification & rental suppliers.
 * Designed to support multi-provider routing and supplier swapping.
 */

class SmsProviderError extends Error {
  /**
   * @param {string} message - Human-readable error description
   * @param {string} code - Standardized machine code (e.g. 'AUTH_ERROR', 'NO_NUMBERS', 'INSUFFICIENT_FUNDS')
   * @param {number} [statusCode=500] - Corresponding HTTP status code
   * @param {string} [provider='unknown'] - Identifier of the upstream provider
   * @param {any} [raw=null] - Raw response payload from provider
   */
  constructor(message, code = 'PROVIDER_ERROR', statusCode = 500, provider = 'unknown', raw = null) {
    super(message);
    this.name = 'SmsProviderError';
    this.code = code;
    this.statusCode = statusCode;
    this.provider = provider;
    this.raw = raw;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
      provider: this.provider,
      timestamp: this.timestamp,
    };
  }
}

class BaseSmsProvider {
  /**
   * @param {string} id - Unique provider key (e.g. 'smsbus')
   * @param {string} name - Friendly provider name (e.g. 'SMS-BUS')
   * @param {object} [options={}] - Configuration options
   */
  constructor(id, name, options = {}) {
    if (!id || !name) {
      throw new Error('BaseSmsProvider requires an id and name.');
    }
    this.id = id;
    this.name = name;
    this.options = options;
  }

  /**
   * Checks if the provider is properly configured with credentials.
   * @returns {boolean}
   */
  isConfigured() {
    return false;
  }

  /**
   * Retrieves account wallet balance and currency.
   * @returns {Promise<{ balance: number, frozen: number, currency: string, raw?: any }>}
   */
  async getBalance() {
    throw new Error(`${this.name} does not implement getBalance()`);
  }

  /**
   * Fetches supported countries for activations.
   * @returns {Promise<Array<{ id: number|string, name: string, code: string, raw?: any }>>}
   */
  async fetchCountries() {
    throw new Error(`${this.name} does not implement fetchCountries()`);
  }

  /**
   * Fetches supported services/projects.
   * @returns {Promise<Array<{ id: number|string, name: string, code: string, raw?: any }>>}
   */
  async fetchServices() {
    throw new Error(`${this.name} does not implement fetchServices()`);
  }

  /**
   * Fetches pricing and live number availability for a given country.
   * @param {number|string} countryId
   * @param {number|string} [projectId]
   * @returns {Promise<Array<{ serviceId: number|string, cost: number, count: number, raw?: any }>>}
   */
  async fetchPrices(countryId, projectId = null) {
    throw new Error(`${this.name} does not implement fetchPrices()`);
  }

  /**
   * Purchases a virtual number.
   * @param {object} params
   * @param {number|string} params.countryId
   * @param {number|string} params.serviceId
   * @param {boolean} [params.reuse=false]
   * @param {string} [params.referId]
   * @returns {Promise<{ providerRequestId: number|string, number: string, cost?: number, expiresAt?: string, raw?: any }>}
   */
  async purchaseNumber(params) {
    throw new Error(`${this.name} does not implement purchaseNumber()`);
  }

  /**
   * Retrieves incoming SMS verification message or code.
   * @param {number|string} providerRequestId
   * @returns {Promise<{ hasSms: boolean, code?: string, text?: string, status: string, raw?: any }>}
   */
  async retrieveSms(providerRequestId) {
    throw new Error(`${this.name} does not implement retrieveSms()`);
  }

  /**
   * Cancels an active number request (releasing number and refunding balance if eligible).
   * @param {number|string} providerRequestId
   * @returns {Promise<{ success: boolean, message: string, raw?: any }>}
   */
  async cancelRequest(providerRequestId) {
    throw new Error(`${this.name} does not implement cancelRequest()`);
  }

  // ===== LONG-TERM RENTAL EXTENSIONS (https://sms-bus.com/docs/rent) =====

  /**
   * Rent a virtual number for extended periods.
   * @param {object} params
   * @returns {Promise<{ providerRequestId: number|string, number: string, days: number, raw?: any }>}
   */
  async rentNumber(params) {
    throw new Error(`${this.name} does not implement rentNumber()`);
  }

  /**
   * Retrieve messages received on a rented number.
   * @param {number|string} providerRequestId
   * @returns {Promise<{ hasSms: boolean, messages: Array<{ text: string, code?: string, date?: string }>, raw?: any }>}
   */
  async getRentSms(providerRequestId) {
    throw new Error(`${this.name} does not implement getRentSms()`);
  }

  /**
   * Cancel or release an active rental.
   * @param {number|string} providerRequestId
   * @returns {Promise<{ success: boolean, message: string, raw?: any }>}
   */
  async cancelRent(providerRequestId) {
    throw new Error(`${this.name} does not implement cancelRent()`);
  }
}

module.exports = {
  BaseSmsProvider,
  SmsProviderError,
};
