/**
 * Erro tipado da camada HTTP.
 * Carrega status, payload e informações de contexto para diagnóstico.
 */
export class HttpError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'HttpError';
    this.status     = options.status     ?? 0;
    this.statusText = options.statusText ?? '';
    this.url        = options.url        ?? '';
    this.method     = options.method     ?? 'GET';
    this.payload    = options.payload    ?? null;
    this.cause      = options.cause      ?? null;
    this.timestamp  = new Date().toISOString();
  }

  get isNetwork()  { return this.status === 0; }
  get isTimeout()  { return this.status === 408; }
  get isAborted()  { return this.status === 499; }
  get isClient()   { return this.status >= 400 && this.status < 500; }
  get isServer()   { return this.status >= 500; }
  get isRetryable(){ return this.isNetwork || this.isTimeout || this.isServer; }

  toJSON() {
    return {
      name: this.name, message: this.message, status: this.status,
      url: this.url, method: this.method, timestamp: this.timestamp,
    };
  }
}