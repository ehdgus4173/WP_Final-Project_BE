// tests/comments.test.js — auth & validation paths for comment endpoints.
//
// Rejected by auth / validate middleware before any DB access, so these run
// without a database (NODE_ENV=test → DATABASE_URL optional, JWT_SECRET default).

const request = require('supertest');
const app = require('../src/app');
const { sign } = require('../src/utils/jwt');

const token = sign({ sub: 42, username: 'tester', role: 'user' });
const authHeader = { Authorization: `Bearer ${token}` };

describe('POST /api/posts/:id/comments — auth & validation', () => {
  test('401 without a token', async () => {
    const res = await request(app).post('/api/posts/1/comments').send({ content: 'hello' });
    expect(res.status).toBe(401);
  });

  test('400 when content is too short', async () => {
    const res = await request(app)
      .post('/api/posts/1/comments')
      .set(authHeader)
      .send({ content: 'a' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_INPUT');
  });

  test('400 when parent_id is not a positive integer', async () => {
    const res = await request(app)
      .post('/api/posts/1/comments')
      .set(authHeader)
      .send({ content: 'a valid comment', parent_id: 'abc' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/comments/:id — auth', () => {
  test('401 without a token', async () => {
    const res = await request(app).delete('/api/comments/1');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/comments/:id/likes — auth', () => {
  test('401 without a token', async () => {
    const res = await request(app).post('/api/comments/1/likes');
    expect(res.status).toBe(401);
  });
});
