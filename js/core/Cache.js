import { CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';

/**
 * Cache em localStorage com TTL. Chave = prefixo + hash simples.
 * Degrada graciosamente se localStorage estiver indisponível.
 */
export class Cache {
  constructor({ prefix = CONFIG.CACHE_PREFIX, ttl = CONFIG.CACHE_TTL_MS } = {}) {
    this.prefix = prefix;
    this.ttl = ttl;
    this.available = this.#checkAvailability();
  }

  #checkAvailability() {
    try {
      const k = '__test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch (error) {
      logger.warn('Cache desabilitado: localStorage indisponível.', error);
      return false;
    }
  }

  #key(key) { return `${this.prefix}${key}`; }

  #disable(operation, error) {
    logger.warn(`Cache desabilitado após falha ao ${operation} no localStorage.`, error);
    this.available = false;
  }

  get(key) {
    if (!this.available) return null;
    let raw;
    try {
      raw = localStorage.getItem(this.#key(key));
    } catch (error) {
      this.#disable('ler', error);
      return null;
    }

    if (!raw) return null;
    try {
      const entry = JSON.parse(raw);
      if (!entry || !Number.isFinite(entry.expiresAt) || !('value' in entry)) {
        throw new TypeError('Entrada de cache inválida');
      }
      if (Date.now() >= entry.expiresAt) { this.remove(key); return null; }
      return entry.value;
    } catch (error) {
      logger.warn('Entrada inválida removida do cache.', error);
      this.remove(key);
      return null;
    }
  }

  set(key, value, ttl = this.ttl) {
    if (!this.available) return;
    try {
      localStorage.setItem(this.#key(key), JSON.stringify({
        value, expiresAt: Date.now() + ttl,
      }));
    } catch (error) {
      this.#disable('gravar', error);
    }
  }

  remove(key) {
    if (!this.available) return;
    try {
      localStorage.removeItem(this.#key(key));
    } catch (error) {
      this.#disable('remover', error);
    }
  }

  clear() {
    if (!this.available) return;
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(this.prefix))
        .forEach((k) => localStorage.removeItem(k));
    } catch (error) {
      this.#disable('limpar', error);
    }
  }
}