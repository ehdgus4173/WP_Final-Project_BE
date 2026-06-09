// 헬스 체크 Supertest 통합 테스트
// Express 앱 직접 import(포트 바인딩 없음). NODE_ENV=test라 env.js가 DATABASE_URL 선택 처리 →
// DB 없이 부팅됨. liveness 프로브와 404 폴백은 Postgres 안 닿음

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
