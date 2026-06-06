// tests/posts.test.js — auth & validation paths for post endpoints.
//
// These requests are rejected by the auth / validate middleware BEFORE the
// controller touches Postgres, so they run without a database (Jest sets
// NODE_ENV=test → DATABASE_URL optional, JWT_SECRET has a test default).
// Success / CRUD paths that hit the DB are covered separately once a test
// database is wired up.

const request = require('supertest');
const app = require('../src/app');
const { sign } = require('../src/utils/jwt');

const token = sign({ sub: 42, username: 'tester', role: 'user' });
const authHeader = { Authorization: `Bearer ${token}` };

describe('POST /api/issues/:id/posts — auth & validation', () => {
  test('401 without a token', async () => {
    const res = await request(app)
      .post('/api/issues/1/posts')
      .send({ title: 'ok', content: 'a'.repeat(20) });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/issues/1/posts')
      .set(authHeader)
      .send({ content: 'a'.repeat(20) });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_INPUT');
  });

  test('400 when content is too short', async () => {
    const res = await request(app)
      .post('/api/issues/1/posts')
      .set(authHeader)
      .send({ title: 'ok', content: 'short' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/posts/:id/votes — auth & validation', () => {
  test('401 without a token', async () => {
    const res = await request(app).post('/api/posts/1/votes').send({ value: 1 });
    expect(res.status).toBe(401);
  });

  test('400 when value is not 1 or -1', async () => {
    const res = await request(app)
      .post('/api/posts/1/votes')
      .set(authHeader)
      .send({ value: 2 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_INPUT');
  });
});

describe('PUT /api/posts/:id — auth & validation', () => {
  test('401 without a token', async () => {
    const res = await request(app)
      .put('/api/posts/1')
      .send({ title: 'ok', content: 'a'.repeat(20) });
    expect(res.status).toBe(401);
  });

  test('400 when content is too short', async () => {
    const res = await request(app)
      .put('/api/posts/1')
      .set(authHeader)
      .send({ title: 'ok', content: 'short' });
    expect(res.status).toBe(400);
  });
});
