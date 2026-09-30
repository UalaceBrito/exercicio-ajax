import { CONFIG } from '../config/constants.js';
import { HttpError } from './HttpError.js';
import { FetchAdapter } from './FetchAdapter.js';
import { XhrAdapter } from './XhrAdapter.js';
import { Cache } from './Cache.js';
import { withRetry } from '../utils/retry.js';
import { logger } from '../utils/logger.js';

/**
 * Fachada HTTP. Orquestra:
 *   - escolha do adaptador (fetch/xhr)
 *   - montagem de URL + query string
 *   - retry com backoff exponencial (apenas para erros retryable)
 *   - cache opcional com TTL
 *   - timeout
 */
export class HttpClient {
  constructor({ baseURL = CONFIG.API_BASE_URL, adapter = CONFIG.DEFAULT_ADAPTER, timeout = CONFIG.DEFAULT_TIMEOUT_MS } = {}) {
    this.baseURL = baseURL.replace(/\/+$/, '');
    this.timeout = timeout;
    this.adapters = { fetch: new FetchAdapter(), xhr: new XhrAdapter() };
    this.cache = new Cache();
    this.setAdapter(adapter);
  }

  setAdapter(name) {
    const chosen = this.adapters[name];
    if (!chosen) throw new Error(`Adaptador desconhecido: ${name}`);
    this.adapter = chosen;
    logger.info(`HttpClient usando adaptador: ${chosen.name}`);
  }

  #buildUrl(path, query) {
    const url = new URL(path.startsWith('http') ? path : `${this.baseURL}${path}`);
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      });
    }
    return url.toString();
  }

  async request(method, path, { body = null, headers = {}, query = null, timeout = this.timeout, signal = null, retries = CONFIG.MAX_RETRIES, cacheTtl = 0 } = {}) {
    const url = this.#buildUrl(path, query);
    const cacheKey = `${method}:${url}`;

    if (signal?.aborted) {
      throw new HttpError('Requisição cancelada', {
        status: 499, url, method, cause: signal.reason,
      });
    }

    // Cache hit (somente leitura)
    if (cacheTtl > 0 && method === 'GET') {
      const hit = this.cache.get(cacheKey);
      if (hit) { logger.debug('Cache HIT', cacheKey); return hit; }
    }

    const doFetch = () => this.adapter.request({ url, method, headers, body, timeout, signal });

    try {
      const response = await withRetry(doFetch, {
        retries,
        baseDelay: CONFIG.RETRY_BASE_DELAY_MS,
        maxDelay:  CONFIG.RETRY_MAX_DELAY_MS,
        shouldRetry: (err) => err instanceof HttpError && err.isRetryable,
      });

      if (cacheTtl > 0 && method === 'GET') this.cache.set(cacheKey, response, cacheTtl);
      return response;
    } catch (err) {
      logger.error(`[${method} ${url}]`, err);
      throw err;
    }
  }

  get(path, opts)          { return this.request('GET', path, opts); }
  post(path, body, opts)   { return this.request('POST', path, { ...opts, body }); }
  put(path, body, opts)    { return this.request('PUT', path, { ...opts, body }); }
  patch(path, body, opts)  { return this.request('PATCH', path, { ...opts, body }); }
  delete(path, opts)       { return this.request('DELETE', path, opts); }
}