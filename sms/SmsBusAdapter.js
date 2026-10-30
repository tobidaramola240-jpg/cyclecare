/**
 * SMS-BUS Official Provider Adapter
 * 
 * Implements upstream integration for SMS-BUS via its official REST endpoints:
 * - Activations: https://sms-bus.com/docs
 * - Rentals: https://sms-bus.com/docs/rent
 * 
 * Security & Compliance:
 * - Subject to SMS-BUS authorization and resale permissions.
 * - API Token is strictly retrieved from environment variables and never exposed to the frontend.
 * - No mock availability in production mode.
 * - No synthetic/fake SMS messages displayed as real communications.
 */

const { BaseSmsProvider, SmsProviderError } = require('./BaseSmsProvider');

const DEFAULT_BASE_URL = 'https://sms-bus.com/api/control';
const DEFAULT_TIMEOUT_MS = 15000;

class SmsBusAdapter extends BaseSmsProvider {
  /**
   * @param {object} [config={}]
   * @param {string} [config.token] - Upstream API token (defaults to process.env.SMSBUS_API_TOKEN)
   * @param {string} [config.baseUrl] - Base API URL (defaults to https://sms-bus.com/api/control)
   * @param {number} [config.timeoutMs] - HTTP request timeout
   * @param {Function} [config.fetchFn] - Injected fetch implementation for testing
   * @param {boolean} [config.isProduction] - Production enforcement mode
   */
  constructor(config = {}) {
    super('smsbus', 'SMS-BUS', config);

    this.token = config.token || process.env.SMSBUS_API_TOKEN || process.env.SMS_PROVIDER_API_KEY || '';
    this.baseUrl = (config.baseUrl || process.env.SMSBUS_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = config.timeoutMs || Number(process.env.SMSBUS_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
    this.fetchFn = config.fetchFn || globalThis.fetch;
    this.isProduction = config.isProduction ?? (process.env.NODE_ENV === 'production' || process.env.SMS_STRICT_PRODUCTION === 'true');
  }

  /**
   * Validates configuration and credentials.
   * @returns {boolean}
   */
  isConfigured() {
    return Boolean(this.token && typeof this.token === 'string' && this.token.trim().length > 0);
  }

  /**
   * Asserts token presence before executing upstream requests.
   * @private
   */
  _assertConfigured() {
    if (!this.isConfigured()) {
      throw new SmsProviderError(
        'SMS-BUS upstream API token is missing or not configured in environment variables (SMSBUS_API_TOKEN).',
        'AUTH_CONFIG_MISSING',
        401,
        this.id
      );
    }
  }

  /**
   * Dispatches a signed GET request to SMS-BUS API.
   * @private
   * @param {string} endpointPath - Endpoint relative path (e.g. '/list/countries')
   * @param {Record<string, any>} [queryParams={}]
   * @returns {Promise<any>}
   */
  async _request(endpointPath, queryParams = {}) {
    this._assertConfigured();

    const normalizedPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
    const url = new URL(`${this.baseUrl}${normalizedPath}`);

    // SMS-BUS authenticates strictly via query param 'token'
    url.searchParams.set('token', this.token);

    for (const [key, val] of Object.entries(queryParams)) {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.set(key, String(val));
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response;
    try {
      response = await this.fetchFn(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CycleCare-SmsBusAdapter/1.0',
        },
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      const isTimeout = err.name === 'AbortError';
      throw new SmsProviderError(
        isTimeout ? `SMS-BUS API request timed out after ${this.timeoutMs}ms.` : `Network connection to SMS-BUS failed: ${err.message}`,
        isTimeout ? 'UPSTREAM_TIMEOUT' : 'NETWORK_ERROR',
        504,
        this.id,
        { originalError: err.message }
      );
    } finally {
      clearTimeout(timer);
    }

    let bodyText = '';
    try {
      bodyText = await response.text();
    } catch (err) {
      throw new SmsProviderError(
        'Failed to read response body from SMS-BUS API.',
        'RESPONSE_PARSE_ERROR',
        502,
        this.id
      );
    }

    let payload;
    try {
      payload = JSON.parse(bodyText);
    } catch (err) {
      // Some endpoints might return raw strings or HTML on upstream server crashes
      throw new SmsProviderError(
        `Invalid JSON returned from SMS-BUS (HTTP ${response.status}): ${bodyText.slice(0, 160)}`,
        'UPSTREAM_INVALID_JSON',
        502,
        this.id,
        { rawBody: bodyText }
      );
    }

    // Evaluate SMS-BUS response codes (official format: { code: 200, message: "...", data: ... })
    if (payload.code && payload.code !== 200) {
      const msg = payload.message || 'Upstream SMS-BUS operation failed';
      let errCode = 'PROVIDER_ERROR';
      let statusCode = 400;

      if (payload.code === 401 || /token|auth/i.test(msg)) {
        errCode = 'AUTH_ERROR';
        statusCode = 401;
      } else if (/no number|out of stock|available/i.test(msg)) {
        errCode = 'NO_NUMBERS_AVAILABLE';
        statusCode = 409;
      } else if (/balance|funds|money/i.test(msg) || payload.code === 402) {
        errCode = 'INSUFFICIENT_FUNDS';
        statusCode = 402;
      } else if (payload.code === 422) {
        errCode = 'UNPROCESSABLE_ENTITY';
        statusCode = 422;
      } else if (payload.code === 404 || /not found|expired/i.test(msg)) {
        errCode = 'NOT_FOUND';
        statusCode = 404;
      } else if (payload.code === 429) {
        errCode = 'RATE_LIMITED';
        statusCode = 429;
      }

      throw new SmsProviderError(msg, errCode, statusCode, this.id, payload);
    }

    return payload;
  }

  // =========================================================================
  // 1. GET BALANCE
  // =========================================================================

  /**
   * Retrieves account wallet balance.
   * Endpoint: GET /get/balance?token=$token (or /get?token=$token)
   */
  async getBalance() {
    let res;
    try {
      res = await this._request('/get/balance');
    } catch (err) {
      // Fallback to /get route if /get/balance is not enabled on host
      if (err.statusCode === 404) {
        res = await this._request('/get');
      } else {
        throw err;
      }
    }

    const data = res.data || {};
    return {
      balance: Number(data.balance ?? 0),
      frozen: Number(data.frozen ?? 0),
      currency: 'USD',
      raw: res,
    };
  }

  // =========================================================================
  // 2. FETCH AVAILABLE COUNTRIES
  // =========================================================================

  /**
   * Retrieves available countries and region IDs.
   * Endpoint: GET /list/countries?token=$token
   * Documentation: https://sms-bus.com/docs
   */
  async fetchCountries() {
    const res = await this._request('/list/countries');
    const data = res.data;

    const countries = [];
    if (Array.isArray(data)) {
      for (const item of data) {
        countries.push({
          id: Number(item.id || item.country_id),
          name: item.title || item.name || `Country #${item.id}`,
          code: (item.code || '').toLowerCase(),
          raw: item,
        });
      }
    } else if (data && typeof data === 'object') {
      for (const [key, val] of Object.entries(data)) {
        countries.push({
          id: Number(val.id || key),
          name: val.title || val.name || `Country #${key}`,
          code: (val.code || '').toLowerCase(),
          raw: val,
        });
      }
    }

    return countries.sort((a, b) => a.name.localeCompare(b.name));
  }

  // =========================================================================
  // 3. FETCH AVAILABLE SERVICES (PROJECTS)
  // =========================================================================

  /**
   * Retrieves available services/projects supported for activation.
   * Endpoint: GET /list/projects?token=$token
   * Documentation: https://sms-bus.com/docs
   */
  async fetchServices() {
    const res = await this._request('/list/projects');
    const data = res.data;

    const services = [];
    if (Array.isArray(data)) {
      for (const item of data) {
        services.push({
          id: Number(item.id || item.project_id),
          name: item.title || item.name || `Service #${item.id}`,
          code: item.code || String(item.id),
          raw: item,
        });
      }
    } else if (data && typeof data === 'object') {
      for (const [key, val] of Object.entries(data)) {
        services.push({
          id: Number(val.id || key),
          name: val.title || val.name || `Service #${key}`,
          code: val.code || String(key),
          raw: val,
        });
      }
    }

    return services.sort((a, b) => a.name.localeCompare(b.name));
  }

  // =========================================================================
  // 4. FETCH COUNTRY-SPECIFIC SERVICE PRICES AND AVAILABILITY
  // =========================================================================

  /**
   * Retrieves prices and live number availability count for services in a target country.
   * Endpoint: GET /list/prices?token=$token&country_id=$countryId
   * Documentation: https://sms-bus.com/docs
   *
   * @param {number|string} countryId
   * @param {number|string} [projectId]
   */
  async fetchPrices(countryId, projectId = null) {
    if (!countryId) {
      throw new SmsProviderError('countryId is required to fetch service prices.', 'INVALID_PARAMS', 400, this.id);
    }

    const params = { country_id: countryId };
    if (projectId) {
      params.project_id = projectId;
    }

    const res = await this._request('/list/prices', params);
    const data = res.data || {};

    const priceList = [];
    if (Array.isArray(data)) {
      for (const item of data) {
        priceList.push({
          serviceId: Number(item.project_id || item.service_id || item.id),
          cost: Number(item.cost ?? item.price ?? 0),
          count: Number(item.count ?? item.available ?? 0),
          countryId: Number(countryId),
          raw: item,
        });
      }
    } else if (data && typeof data === 'object') {
      for (const [sId, item] of Object.entries(data)) {
        if (typeof item === 'object' && item !== null) {
          priceList.push({
            serviceId: Number(item.project_id || sId),
            cost: Number(item.cost ?? item.price ?? 0),
            count: Number(item.count ?? item.available ?? 0),
            countryId: Number(countryId),
            raw: item,
          });
        } else {
          // Flattened format: { [serviceId]: count } or { [serviceId]: cost }
          priceList.push({
            serviceId: Number(sId),
            cost: 0,
            count: Number(item),
            countryId: Number(countryId),
            raw: item,
          });
        }
      }
    }

    return priceList;
  }

  // =========================================================================
  // 5. PURCHASE / ORDER A NUMBER
  // =========================================================================

  /**
   * Purchases a virtual number for a country and service project.
   * Endpoint: GET /get/number?token=$token&country_id=$countryId&project_id=$projectId[&reuse=true][&refer_id=...]
   * Documentation: https://sms-bus.com/docs
   *
   * @param {object} params
   * @param {number|string} params.countryId - Target country ID
   * @param {number|string} params.serviceId - Service / Project ID
   * @param {boolean} [params.reuse=false] - Reusable number within 20 mins
   * @param {string} [params.referId] - Optional affiliate/referral code
   */
  async purchaseNumber({ countryId, serviceId, reuse = false, referId = null }) {
    if (!countryId) {
      throw new SmsProviderError('countryId is required to purchase a number.', 'INVALID_PARAMS', 400, this.id);
    }
    if (!serviceId) {
      throw new SmsProviderError('serviceId is required to purchase a number.', 'INVALID_PARAMS', 400, this.id);
    }

    const queryParams = {
      country_id: countryId,
      project_id: serviceId,
    };
    if (reuse) {
      queryParams.reuse = 'true';
    }
    if (referId) {
      queryParams.refer_id = referId;
    }

    const res = await this._request('/get/number', queryParams);
    const data = res.data;

    if (!data || !data.request_id || !data.number) {
      throw new SmsProviderError(
        'Upstream provider did not return a valid request_id or phone number.',
        'PROVISIONING_FAILED',
        502,
        this.id,
        res
      );
    }

    // Normalize phone number (strip whitespace/dashes, ensure standard format)
    const rawNumber = String(data.number).trim().replace(/[\s-]/g, '');
    const cleanNumber = rawNumber.startsWith('+') ? rawNumber : `+${rawNumber}`;

    return {
      providerRequestId: String(data.request_id),
      number: cleanNumber,
      countryId: Number(countryId),
      serviceId: Number(serviceId),
      expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(), // 20-minute standard activation window
      raw: res,
    };
  }

  // =========================================================================
  // 6. RETRIEVE INCOMING SMS
  // =========================================================================

  /**
   * Checks for incoming SMS verification message or code.
   * Endpoint: GET /get/sms?token=$token&request_id=$requestId
   * Documentation: https://sms-bus.com/docs
   *
   * Strict Production Rule: Does not forge or generate fake SMS when live production is active.
   *
   * @param {number|string} providerRequestId
   */
  async retrieveSms(providerRequestId) {
    if (!providerRequestId) {
      throw new SmsProviderError('providerRequestId is required to retrieve SMS.', 'INVALID_PARAMS', 400, this.id);
    }

    let res;
    try {
      res = await this._request('/get/sms', { request_id: providerRequestId });
    } catch (err) {
      // In SMS-BUS, when SMS has not arrived yet, the endpoint may return 400 or specific status message
      if (err.statusCode === 400 && /no message|waiting|pending/i.test(err.message)) {
        return {
          hasSms: false,
          code: null,
          text: null,
          status: 'PENDING',
          message: err.message,
          raw: err.raw,
        };
      }
      throw err;
    }

    const data = res.data;

    // Check if SMS content is present
    if (data && (typeof data === 'string' || typeof data === 'number' || (typeof data === 'object' && Object.keys(data).length > 0))) {
      let code = null;
      let text = null;

      if (typeof data === 'string' || typeof data === 'number') {
        const textStr = String(data).trim();
        text = textStr;
        // Extract 4-8 digit numeric verification code
        const codeMatch = textStr.match(/\b\d{4,8}\b/);
        code = codeMatch ? codeMatch[0] : textStr;
      } else if (typeof data === 'object') {
        text = data.text || data.sms || data.message || JSON.stringify(data);
        code = data.code || (text ? (text.match(/\b\d{4,8}\b/) || [])[0] : null);
      }

      return {
        hasSms: true,
        code,
        text,
        status: 'RECEIVED',
        raw: res,
      };
    }

    return {
      hasSms: false,
      code: null,
      text: null,
      status: 'PENDING',
      message: res.message || 'Waiting for incoming SMS...',
      raw: res,
    };
  }

  // =========================================================================
  // 7. CANCEL ELIGIBLE REQUESTS
  // =========================================================================

  /**
   * Cancels an active activation request (releases number and refunds balance if within cancellation window).
   * Endpoint: GET /cancel?token=$token&request_id=$requestId
   * Documentation: https://sms-bus.com/docs
   *
   * @param {number|string} providerRequestId
   */
  async cancelRequest(providerRequestId) {
    if (!providerRequestId) {
      throw new SmsProviderError('providerRequestId is required to cancel request.', 'INVALID_PARAMS', 400, this.id);
    }

    const res = await this._request('/cancel', { request_id: providerRequestId });
    return {
      success: true,
      message: res.message || 'Order successfully cancelled with upstream provider.',
      raw: res,
    };
  }

  // =========================================================================
  // 8. LONG-TERM NUMBER RENTALS (https://sms-bus.com/docs/rent)
  // =========================================================================

  /**
   * Rent a virtual number for extended duration.
   * Endpoint: GET /rent/get/number?token=$token&country_id=$countryId&days=$days[&project_id=$serviceId]
   */
  async rentNumber({ countryId, days = 30, serviceId = null }) {
    if (!countryId) {
      throw new SmsProviderError('countryId is required to rent a number.', 'INVALID_PARAMS', 400, this.id);
    }

    const params = {
      country_id: countryId,
      days: days,
    };
    if (serviceId) {
      params.project_id = serviceId;
    }

    const res = await this._request('/rent/get/number', params);
    const data = res.data || {};

    if (!data.request_id || !data.number) {
      throw new SmsProviderError(
        'Upstream provider did not return valid rental request_id or number.',
        'RENTAL_FAILED',
        502,
        this.id,
        res
      );
    }

    const rawNumber = String(data.number).trim().replace(/[\s-]/g, '');
    const cleanNumber = rawNumber.startsWith('+') ? rawNumber : `+${rawNumber}`;

    return {
      providerRequestId: String(data.request_id),
      number: cleanNumber,
      days: Number(days),
      expiresAt: data.expire_at || data.keep_at || new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
      raw: res,
    };
  }

  /**
   * Retrieve all messages received on a rented number.
   * Endpoint: GET /rent/get/sms?token=$token&request_id=$requestId
   */
  async getRentSms(providerRequestId) {
    if (!providerRequestId) {
      throw new SmsProviderError('providerRequestId is required to check rent SMS.', 'INVALID_PARAMS', 400, this.id);
    }

    const res = await this._request('/rent/get/sms', { request_id: providerRequestId });
    const data = res.data;

    const messages = [];
    if (Array.isArray(data)) {
      for (const m of data) {
        const text = m.text || m.sms || String(m);
        const codeMatch = text.match(/\b\d{4,8}\b/);
        messages.push({
          text,
          code: m.code || (codeMatch ? codeMatch[0] : null),
          date: m.date || m.created_at || new Date().toISOString(),
          raw: m,
        });
      }
    } else if (data && typeof data === 'string') {
      const codeMatch = data.match(/\b\d{4,8}\b/);
      messages.push({
        text: data,
        code: codeMatch ? codeMatch[0] : null,
        date: new Date().toISOString(),
      });
    }

    return {
      hasSms: messages.length > 0,
      messages,
      raw: res,
    };
  }

  /**
   * Cancel or release an active rental.
   * Endpoint: GET /rent/cancel?token=$token&request_id=$requestId
   */
  async cancelRent(providerRequestId) {
    if (!providerRequestId) {
      throw new SmsProviderError('providerRequestId is required to cancel rental.', 'INVALID_PARAMS', 400, this.id);
    }

    const res = await this._request('/rent/cancel', { request_id: providerRequestId });
    return {
      success: true,
      message: res.message || 'Rental successfully cancelled.',
      raw: res,
    };
  }
}

module.exports = SmsBusAdapter;
