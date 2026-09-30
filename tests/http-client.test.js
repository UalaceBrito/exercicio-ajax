import test from 'node:test';
import assert from 'node:assert/strict';
import { HttpClient } from '../js/core/HttpClient.js';
import { HttpError } from '../js/core/HttpError.js';

test('HttpClient retries transient server errors and builds query strings', async () => {
  const client = new HttpClient({ baseURL: 'https://example.test/' });
  let attempts = 0;
  client.adapter = {
    async request(options) {
      attempts += 1;
      assert.equal(options.url, 'https://example.test/users?_limit=20');
      if (attempts === 1) {
        throw new HttpError('Unavailable', { status: 503, url: options.url });
      }
      return { status: 200, data: [] };
    },
  };

  const response = await client.get('/users', {
    query: { _limit: 20 },
    retries: 1,
  });

  assert.equal(response.status, 200);
  assert.equal(attempts, 2);
});

test('HttpClient does not retry client errors', async () => {
  const client = new HttpClient({ baseURL: 'https://example.test' });
  let attempts = 0;
  client.adapter = {
    async request(options) {
      attempts += 1;
      throw new HttpError('Not found', { status: 404, url: options.url });
    },
  };

  await assert.rejects(
    client.get('/users/missing', { retries: 3 }),
    (error) => error instanceof HttpError && error.status === 404,
  );
  assert.equal(attempts, 1);
});

test('HttpClient honors an aborted signal before consulting cache or transport', async () => {
  const client = new HttpClient({ baseURL: 'https://example.test' });
  let attempts = 0;
  client.adapter = { async request() { attempts += 1; } };
  const controller = new AbortController();
  controller.abort('cancelled');

  await assert.rejects(
    client.get('/users', { signal: controller.signal, cacheTtl: 30_000 }),
    (error) => error instanceof HttpError && error.isAborted,
  );
  assert.equal(attempts, 0);
});
