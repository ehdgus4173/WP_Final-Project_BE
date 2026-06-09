// votes 테이블 접근 (파라미터 바인딩 raw SQL)
// (post_id, user_id)당 1행 — UNIQUE 제약. value는 +1(추천) 또는 -1(비추천). 토글 로직은 voteService에

const db = require('../db');

// 이 유저의 글에 대한 현재 투표 → { value } 또는 null
async function find(postId, userId) {
  const { rows } = await db.query(
    `SELECT value FROM votes WHERE post_id = $1 AND user_id = $2`,
    [postId, userId],
  );
  return rows[0] || null;
}

// 새 투표
async function insert(postId, userId, value) {
  await db.query(
    `INSERT INTO votes (post_id, user_id, value) VALUES ($1, $2, $3)`,
    [postId, userId, value],
  );
}

// 투표 값 변경(추천↔비추천)
async function update(postId, userId, value) {
  await db.query(
    `UPDATE votes SET value = $3 WHERE post_id = $1 AND user_id = $2`,
    [postId, userId, value],
  );
}

// 투표 취소
async function remove(postId, userId) {
  await db.query(
    `DELETE FROM votes WHERE post_id = $1 AND user_id = $2`,
    [postId, userId],
  );
}

module.exports = { find, insert, update, remove };
