// src/repositories/commentLikeRepo.js — comment_likes table access (raw SQL).
//
// Single-direction like: a row's existence means "liked". One row per
// (comment_id, user_id) — enforced by UNIQUE. Toggle logic lives in
// commentService.

const db = require('../db');

// Has this user liked this comment? → row or null.
async function find(commentId, userId) {
  const { rows } = await db.query(
    `SELECT 1 FROM comment_likes WHERE comment_id = $1 AND user_id = $2`,
    [commentId, userId],
  );
  return rows[0] || null;
}

async function insert(commentId, userId) {
  await db.query(
    `INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)`,
    [commentId, userId],
  );
}

async function remove(commentId, userId) {
  await db.query(
    `DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2`,
    [commentId, userId],
  );
}

async function countByComment(commentId) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS cnt FROM comment_likes WHERE comment_id = $1`,
    [commentId],
  );
  return rows[0].cnt;
}

module.exports = { find, insert, remove, countByComment };
