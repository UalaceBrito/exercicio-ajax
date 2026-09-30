export const CONFIG = Object.freeze({
  API_BASE_URL: 'https://jsonplaceholder.typicode.com',
  DEFAULT_TIMEOUT_MS: 10_000,
  MAX_RETRIES: 3,
  RETRY_BASE_DELAY_MS: 300,
  RETRY_MAX_DELAY_MS: 5_000,
  CACHE_TTL_MS: 60_000,
  CACHE_PREFIX: 'ajax-ex:',
  DEFAULT_ADAPTER: 'fetch',       // 'fetch' | 'xhr'
  LOG_LEVEL: 'debug',             // 'debug' | 'info' | 'warn' | 'error' | 'silent'
});