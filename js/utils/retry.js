import { logger } from './logger.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Executa `fn` com retry exponencial + jitter.
 * @param {(attempt:number)=>Promise<any>} fn
 * @param {{ retries?:number, baseDelay?:number, maxDelay?:number, shouldRetry?:(err:any)=>boolean }} opts
 */
export async function withRetry(fn, opts = {}) {
  const {
    retries    = 3,
    baseDelay  = 300,
    maxDelay   = 5_000,
    shouldRetry = () => true,
  } = opts;

  let lastError;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      const isLast = attempt === retries + 1;
      if (isLast || !shouldRetry(err)) throw err;

      const backoff = Math.min(maxDelay, baseDelay * 2 ** (attempt - 1));
      const jitter  = Math.random() * backoff * 0.3;
      const delay   = Math.round(backoff + jitter);

      logger.warn(`Retry ${attempt}/${retries} em ${delay}ms —`, err.message);
      await sleep(delay);
    }
  }
  throw lastError;
}