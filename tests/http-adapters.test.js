import test from 'node:test';
import assert from 'node:assert/strict';
import { FetchAdapter } from '../js/core/FetchAdapter.js';
import { XhrAdapter } from '../js/core/XhrAdapter.js';
import { HttpError } from '../js/core/HttpError.js';

test('FetchAdapter parses JSON and sends JSON request bodies', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response('{"id":1}', {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    const result = await new FetchAdapter().request({
      url: 'https://example.test/users',
      method: 'POST',
      body: { name: 'Ada' },
    });

    assert.equal(result.status, 201);
    assert.deepEqual(result.data, { id: 1 });
    assert.equal(request.options.headers['Content-Type'], 'application/json');
    assert.equal(request.options.body, '{"name":"Ada"}');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('FetchAdapter preserves HTTP status and payload for failed responses', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('{"message":"Not found"}', {
    status: 404,
    headers: { 'content-type': 'application/problem+json' },
  });

  try {
    await assert.rejects(
      new FetchAdapter().request({ url: 'https://example.test/users/1' }),
      (error) => error instanceof HttpError
        && error.status === 404
        && error.payload.message === 'Not found',
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('FetchAdapter rejects invalid successful JSON with a protocol error', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('{invalid', {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

  try {
    await assert.rejects(
      new FetchAdapter().request({ url: 'https://example.test/users' }),
      (error) => error instanceof HttpError && error.status === 502,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('FetchAdapter returns null for a successful no-content response', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 204 });

  try {
    const result = await new FetchAdapter().request({ url: 'https://example.test/users' });
    assert.equal(result.status, 204);
    assert.equal(result.data, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('FetchAdapter does not send a request for an already-aborted signal', async () => {
  const controller = new AbortController();
  controller.abort('cancelled before start');

  await assert.rejects(
    new FetchAdapter().request({
      url: 'https://example.test/users',
      signal: controller.signal,
    }),
    (error) => error instanceof HttpError && error.isAborted,
  );
});

test('XhrAdapter parses JSON and resolves successful responses', async () => {
  const OriginalXhr = globalThis.XMLHttpRequest;
  let xhrInstance;
  globalThis.XMLHttpRequest = class {
    constructor() {
      xhrInstance = this;
      this.status = 200;
      this.statusText = 'OK';
      this.responseText = '{"id":2}';
    }
    open(method, url, async) { this.request = { method, url, async }; }
    setRequestHeader() {}
    getResponseHeader() { return 'application/json'; }
    send() { this.onload(); }
  };

  try {
    const result = await new XhrAdapter().request({
      url: 'https://example.test/users',
      method: 'GET',
    });
    assert.deepEqual(result, { status: 200, data: { id: 2 } });
    assert.deepEqual(xhrInstance.request, {
      method: 'GET', url: 'https://example.test/users', async: true,
    });
  } finally {
    globalThis.XMLHttpRequest = OriginalXhr;
  }
});

test('XhrAdapter does not send a request for an already-aborted signal', async () => {
  const controller = new AbortController();
  controller.abort('cancelled before start');

  await assert.rejects(
    new XhrAdapter().request({
      url: 'https://example.test/users',
      signal: controller.signal,
    }),
    (error) => error instanceof HttpError && error.isAborted,
  );
});
