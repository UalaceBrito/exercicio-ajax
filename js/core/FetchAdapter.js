import { HttpError } from './HttpError.js';

/**
 * Transporte via Fetch API.
 * - Timeout via AbortController
 * - Suporte a AbortSignal externo
 * - Parse automático de JSON/texto
 */
export class FetchAdapter {
  get name() { return 'fetch'; }

  async request({ url, method = 'GET', headers = {}, body = null, timeout = 10_000, signal = null }) {
    if (signal?.aborted) {
      throw new HttpError('Requisição cancelada', { status: 499, url, method, cause: signal.reason });
    }

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(new DOMException('Timeout', 'TimeoutError')), timeout);
    const onAbort    = () => controller.abort(signal?.reason);
    signal?.addEventListener('abort', onAbort, { once: true });

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        credentials: 'same-origin',
        cache: 'no-store',
      });

      const contentType = response.headers.get('content-type') ?? '';
      const isJson = /(?:application\/json|application\/[a-z0-9.-]+\+json)/i.test(contentType);
      let payload = null;

      if (response.status !== 204) {
        try {
          payload = isJson
            ? await response.json()
            : await response.text();
        } catch (parseErr) {
          if (response.ok && isJson) {
            throw new HttpError('A API retornou um JSON inválido', {
              status: 502, url, method, cause: parseErr,
            });
          }
        }
      }

      if (!response.ok) {
        throw new HttpError(`HTTP ${response.status} ${response.statusText}`, {
          status: response.status, statusText: response.statusText,
          url, method, payload,
        });
      }

      return { status: response.status, data: payload, headers: response.headers };
    } catch (err) {
      if (err instanceof HttpError) throw err;

      if (controller.signal.reason?.name === 'TimeoutError' || err?.name === 'TimeoutError') {
        throw new HttpError('Timeout na requisição', { status: 408, url, method, cause: err });
      }
      if (signal?.aborted || err?.name === 'AbortError') {
        throw new HttpError('Requisição cancelada', {
          status: 499, url, method, cause: signal?.reason ?? err,
        });
      }
      throw new HttpError('Falha de rede', { status: 0, url, method, cause: err });
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onAbort);
    }
  }
}