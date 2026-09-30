import test from 'node:test';
import assert from 'node:assert/strict';
import { Cache } from '../js/core/Cache.js';

test('Cache stores values with a prefix and expires them after their TTL', () => {
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    },
  });

  try {
    const cache = new Cache({ prefix: 'test:' });
    cache.set('users', [{ id: 1 }], 60_000);
    assert.deepEqual(cache.get('users'), [{ id: 1 }]);
    assert.ok(values.has('test:users'));

    cache.set('expired', 'old value', -1);
    assert.equal(cache.get('expired'), null);
    assert.equal(values.has('test:expired'), false);
  } finally {
    if (previousStorage) {
      Object.defineProperty(globalThis, 'localStorage', previousStorage);
    } else {
      delete globalThis.localStorage;
    }
  }
});

test('Cache discards malformed entries rather than returning corrupt data', () => {
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map([['test:users', '{broken']]);
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    },
  });

  try {
    const cache = new Cache({ prefix: 'test:' });
    assert.equal(cache.get('users'), null);
    assert.equal(values.has('test:users'), false);
  } finally {
    if (previousStorage) {
      Object.defineProperty(globalThis, 'localStorage', previousStorage);
    } else {
      delete globalThis.localStorage;
    }
  }
});
