// tests/health.test.js — Supertest integration test for the health probes.
//
// Imports the Express app directly (no port bind). Jest sets NODE_ENV=test, so
// env.js makes DATABASE_URL optional and the app boots without a database —
// the liveness probe and 404 fallback don't touch Postgres.

const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  test('returns 200 with liveness payload', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { status: 'up' } });
  });
});

describe('unknown route', () => {
  test('returns 404 error envelope', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
