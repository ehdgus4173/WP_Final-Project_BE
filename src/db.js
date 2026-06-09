// pg 커넥션 풀 싱글턴
// 단발 쿼리는 db.query(...), 트랜잭션은 db.getClient()로 전용 클라 받아서 쓰고 꼭 release()

const { Pool } = require('pg');
const env = require('./config/env');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (err) => {
  // 유휴 클라에서 터짐. Supabase가 커넥션 끊으면 알아채려고 로그 남김
  console.error('[db] idle client error:', err);
});

// 단발 쿼리 실행. 개발 환경에선 소요시간·행수·쿼리 앞부분 찍음
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  if (env.isDev) {
    const ms = Date.now() - start;
    const preview = text.replace(/\s+/g, ' ').slice(0, 80);
    console.log(`[db] ${ms}ms rows=${res.rowCount ?? 0} :: ${preview}`);
  }
  return res;
}

// 트랜잭션용 전용 클라 체크아웃 (쓰고 나서 release 해야 함)
async function getClient() {
  return pool.connect();
}

// 풀 전체 종료 (서버 내려갈 때 호출)
async function close() {
  await pool.end();
}

module.exports = { pool, query, getClient, close };
