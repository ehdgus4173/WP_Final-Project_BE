// src/repositories/commentRepo.js — comments table access (raw parameterized SQL).
//
// Comments are flat rows carrying parent_id/depth (ERD v4.1): depth 0 = comment,
// depth 1 = reply. like_count / liked_by_me are aggregated from comment_likes.
// findByPost returns comments AND replies in one list; the FE nests replies
// under their parent via parent_id.

const db = require('../db');

// One comment/reply with author + like aggregation.
// $2 = requester id (or null) → liked_by_me is false for anonymous users.
const COMMENT_ROW = `
  c.id,
  c.parent_id,
  c.depth,
  c.content,
  c.created_at,
  json_build_object('id', u.id, 'username', u.username) AS author,
  COALESCE(cl.cnt, 0)::int AS like_count,
  (ml.user_id IS NOT NULL) AS liked_by_me
`;

// All comments/replies on a post, oldest first.
async function findByPost(postId, userId) {
  const { rows } = await db.query(
    `SELECT ${COMMENT_ROW}
       FROM comments c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN (
         SELECT comment_id, COUNT(*) AS cnt
           FROM comment_likes
          GROUP BY comment_id
       ) cl ON cl.comment_id = c.id
       LEFT JOIN comment_likes ml ON ml.comment_id = c.id AND ml.user_id = $2
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC`,
    [postId, userId],
  );
  return rows;
}

// Bare row (incl. user_id, post_id, depth) for permission & depth checks.
async function findById(id) {
  const { rows } = await db.query(
    `SELECT id, post_id, user_id, parent_id, depth FROM comments WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

async function insert({ post_id, user_id, parent_id, depth, content }) {
  const { rows } = await db.query(
    `INSERT INTO comments (post_id, user_id, parent_id, depth, content)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, post_id, user_id, parent_id, depth, content, created_at`,
    [post_id, user_id, parent_id, depth, content],
  );
  return rows[0];
}

// Hard delete. A parent comment cascades to its replies and comment_likes.
async function remove(id) {
  const { rowCount } = await db.query(`DELETE FROM comments WHERE id = $1`, [id]);
  return rowCount > 0;
}

module.exports = { findByPost, findById, insert, remove };
