import { HttpError } from './HttpError.js';

/**
 * Transporte via XMLHttpRequest.
 * Mesma interface do FetchAdapter — permite troca em runtime.
 */
export class XhrAdapter {
  get name() { return 'xhr'; }

  request({ url, method = 'GET', headers = {}, body = null, timeout = 10_000, signal = null }) {
    if (signal?.aborted) {
      return Promise.reject(new HttpError('Requisição cancelada', {
        status: 499, url, method, cause: signal.reason,
      }));
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.timeout = timeout;
      xhr.withCredentials = false;

      xhr.setRequestHeader('Accept', 'application/json');
      if (body) xhr.setRequestHeader('Content-Type', 'application/json');
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

      const cleanup = () => signal?.removeEventListener('abort', onAbort);
      const onAbort = () => xhr.abort();
      signal?.addEventListener('abort', onAbort, { once: true });

      xhr.onload = () => {
        cleanup();
        let data = xhr.responseText;
        const ct = xhr.getResponseHeader('content-type') ?? '';
        const isJson = /(?:application\/json|application\/[a-z0-9.-]+\+json)/i.test(ct);
        if (isJson && data) {
          try {
            data = JSON.parse(data);
          } catch (parseErr) {
            if (xhr.status >= 200 && xhr.status < 300) {
              reject(new HttpError('A API retornou um JSON inválido', {
                status: 502, url, method, cause: parseErr,
              }));
              return;
            }
          }
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ status: xhr.status, data: xhr.status === 204 ? null : data });
        } else {
          reject(new HttpError(`HTTP ${xhr.status} ${xhr.statusText}`, {
            status: xhr.status, statusText: xhr.statusText, url, method, payload: data,
          }));
        }
      };

      xhr.onerror = () => {
        cleanup();
        reject(new HttpError('Falha de rede (XHR)', { status: 0, url, method }));
      };

      xhr.ontimeout = () => {
        cleanup();
        reject(new HttpError('Timeout na requisição', { status: 408, url, method }));
      };

      xhr.onabort = () => {
        cleanup();
        reject(new HttpError('Requisição cancelada', { status: 499, url, method }));
      };

      xhr.send(body ? JSON.stringify(body) : null);
    });
  }
}