// comment_likes 테이블 접근 (raw SQL)
// 단방향 좋아요: row 있으면 "좋아요함". (comment_id, user_id)당 1행 — UNIQUE로 보장
// 토글 로직은 commentService에 있음

const db = require('../db');

// 이 유저가 이 댓글 좋아요 했나? → row 또는 null
async function find(commentId, userId) {
  const { rows } = await db.query(
    `SELECT 1 FROM comment_likes WHERE comment_id = $1 AND user_id = $2`,
    [commentId, userId],
  );
  return rows[0] || null;
}

// 좋아요 추가
async function insert(commentId, userId) {
  await db.query(
    `INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)`,
    [commentId, userId],
  );
}

// 좋아요 취소
async function remove(commentId, userId) {
  await db.query(
    `DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2`,
    [commentId, userId],
  );
}

// 댓글의 좋아요 수
async function countByComment(commentId) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS cnt FROM comment_likes WHERE comment_id = $1`,
    [commentId],
  );
  return rows[0].cnt;
}

module.exports = { find, insert, remove, countByComment };
