// src/repositories/voteRepo.js — votes table access (raw parameterized SQL).
//
// One row per (post_id, user_id) — enforced by UNIQUE constraint. value is
// +1 (upvote) or -1 (downvote). The toggle logic lives in voteService.

const db = require('../db');

// Current user's vote on a post → { value } or null.
async function find(postId, userId) {
  const { rows } = await db.query(
    `SELECT value FROM votes WHERE post_id = $1 AND user_id = $2`,
    [postId, userId],
  );
  return rows[0] || null;
}

async function insert(postId, userId, value) {
  await db.query(
    `INSERT INTO votes (post_id, user_id, value) VALUES ($1, $2, $3)`,
    [postId, userId, value],
  );
}

async function update(postId, userId, value) {
  await db.query(
    `UPDATE votes SET value = $3 WHERE post_id = $1 AND user_id = $2`,
    [postId, userId, value],
  );
}

async function remove(postId, userId) {
  await db.query(
    `DELETE FROM votes WHERE post_id = $1 AND user_id = $2`,
    [postId, userId],
  );
}

module.exports = { find, insert, update, remove };
