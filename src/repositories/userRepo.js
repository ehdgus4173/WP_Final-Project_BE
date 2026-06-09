// users 테이블 접근 (파라미터 바인딩 raw SQL)
// 모든 SELECT는 role 포함. password_hash는 findByEmail만 반환(로그인 검증용), 그 외엔 절대 노출 안 함

const db = require("../db");

const PUBLIC_COLS = "id, email, username, role, description, created_at";

// 이메일로 조회. 로그인 검증 위해 password_hash까지 같이 가져옴
async function findByEmail(email) {
  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLS}, password_hash FROM users WHERE email = $1`,
    [email],
  );
  return rows[0] || null;
}

// username으로 조회 (중복 체크용)
async function findByUsername(username) {
  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLS} FROM users WHERE username = $1`,
    [username],
  );
  return rows[0] || null;
}

// id로 조회
async function findById(id) {
  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLS} FROM users WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

// 유저 생성. role 일부러 안 넣음 → DB DEFAULT 'user' (API로 권한 상승 못 함)
async function create({ email, username, password_hash }) {
  const { rows } = await db.query(
    `INSERT INTO users (email, username, password_hash)
     VALUES ($1, $2, $3)
     RETURNING ${PUBLIC_COLS}`,
    [email, username, password_hash],
  );
  return rows[0];
}

// 프로필 수정(username, description). 이메일은 읽기전용
// 넘어온 필드만 바뀌고 나머진 COALESCE로 기존값 유지
async function updateProfile(id, { username, description }) {
  const { rows } = await db.query(
    `UPDATE users
        SET username    = COALESCE($2, username),
            description = COALESCE($3, description)
      WHERE id = $1
      RETURNING ${PUBLIC_COLS}`,
    [id, username ?? null, description ?? null],
  );
  return rows[0] || null;
}

// 소셜 로그인(OAuth)

// provider 신원(provider + Supabase user.id)으로 계정 조회
async function findByProviderId(provider, providerId) {
  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLS} FROM users WHERE provider = $1 AND provider_id = $2`,
    [provider, providerId],
  );
  return rows[0] || null;
}

// OAuth 계정 생성: password_hash 없음(NULL), role 생략(DB DEFAULT 'user' — create()와 동일 방어)
async function createOAuth({ email, username, provider, provider_id }) {
  const { rows } = await db.query(
    `INSERT INTO users (email, username, provider, provider_id)
     VALUES ($1, $2, $3, $4)
     RETURNING ${PUBLIC_COLS}`,
    [email, username, provider, provider_id],
  );
  return rows[0];
}

// 기존(이메일 매칭) 계정에 provider 신원 연결 → 같은 사람이 중복 row 안 생기게. 갱신된 공개 row 반환
async function linkProvider(userId, provider, provider_id) {
  const { rows } = await db.query(
    `UPDATE users SET provider = $2, provider_id = $3
     WHERE id = $1
     RETURNING ${PUBLIC_COLS}`,
    [userId, provider, provider_id],
  );
  return rows[0] || null;
}

module.exports = {
  findByEmail,
  findByUsername,
  findById,
  create,
  updateProfile,
  findByProviderId,
  createOAuth,
  linkProvider,
};
