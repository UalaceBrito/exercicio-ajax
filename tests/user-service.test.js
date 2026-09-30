import test from 'node:test';
import assert from 'node:assert/strict';
import { UserService } from '../js/services/UserService.js';
import { HttpError } from '../js/core/HttpError.js';

test('UserService requests a bounded user list and validates its response', async () => {
  let request;
  const service = new UserService({
    async get(path, options) {
      request = { path, options };
      return { data: [{ id: 1, name: 'Ada' }] };
    },
  });

  const users = await service.list();
  assert.deepEqual(users, [{ id: 1, name: 'Ada' }]);
  assert.equal(request.path, '/users');
  assert.deepEqual(request.options.query, { _limit: 20 });
  assert.equal(request.options.cacheTtl, 30_000);
});

test('UserService reports an invalid list response instead of disguising it as empty data', async () => {
  const service = new UserService({ async get() { return { data: null }; } });

  await assert.rejects(
    service.list(),
    (error) => error instanceof HttpError && error.status === 502,
  );
});

test('UserService trims submitted fields and validates the created user response', async () => {
  let payload;
  const service = new UserService({
    async post(path, body) {
      payload = { path, body };
      return { data: { id: 3, name: body.name, email: body.email } };
    },
  });

  const user = await service.create({
    name: '  Ada Lovelace  ',
    email: '  ada@example.test ',
    company: ' Analytical Engines ',
  });

  assert.deepEqual(payload, {
    path: '/users',
    body: {
      name: 'Ada Lovelace',
      email: 'ada@example.test',
      company: { name: 'Analytical Engines' },
    },
  });
  assert.equal(user.id, 3);
});

test('UserService reports an invalid created-user response', async () => {
  const service = new UserService({ async post() { return { data: [] }; } });

  await assert.rejects(
    service.create({ name: 'Ada', email: 'ada@example.test', company: '' }),
    (error) => error instanceof HttpError && error.status === 502,
  );
});
