// 글 엔드포인트 인증·검증 경로 테스트
// 컨트롤러가 Postgres 닿기 전에 auth/validate 미들웨어가 막는 거라 DB 없이 돌아감
// (NODE_ENV=test → DATABASE_URL 선택, JWT_SECRET 테스트 기본값)
// DB 닿는 성공/CRUD 경로는 테스트 DB 붙으면 따로 커버

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
