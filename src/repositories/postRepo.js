// src/repositories/postRepo.js — posts table access (raw parameterized SQL).
//
// Vote score is aggregated from the votes table via LEFT JOIN (::int so
// node-pg returns numbers). Comments are NOT joined here — the comment list
// for GET /posts/:id is assembled separately in the comments work (feat/comments).
// EDIT is author-only: the service compares reqUser.sub === post.user_id using
// findById(); DELETE uses canMutate (author or admin). See ERD v4.1.

const db = require('../db');

// Detail columns for GET /posts/:id — post + author + aggregated vote score.
const POST_DETAIL = `
  p.id,
  p.issue_id,
  p.title,
  p.content,
  p.created_at,
  p.updated_at,
  json_build_object('id', u.id, 'username', u.username) AS author,
  COALESCE(SUM(CASE WHEN v.value = 1  THEN 1 ELSE 0 END), 0)::int AS upvotes,
  COALESCE(SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END), 0)::int AS downvotes,
  COALESCE(SUM(v.value), 0)::int AS score
`;

// Create a post under an issue. Returns the created row.
async function insert({ issue_id, user_id, title, content }) {
  const { rows } = await db.query(
    `INSERT INTO posts (issue_id, user_id, title, content)
     VALUES ($1, $2, $3, $4)
     RETURNING id, issue_id, user_id, title, content, created_at, updated_at`,
    [issue_id, user_id, title, content],
  );
  return rows[0];
}

// Bare row including user_id — used for ownership/permission checks.
async function findById(id) {
  const { rows } = await db.query(
    `SELECT id, issue_id, user_id, title, content, created_at, updated_at
       FROM posts
      WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

// Detail for GET /posts/:id — post + author + score. Comments added by caller.
async function findDetailById(id) {
  const { rows } = await db.query(
    `SELECT ${POST_DETAIL}
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN votes v ON v.post_id = p.id
      WHERE p.id = $1
      GROUP BY p.id, u.id`,
    [id],
  );
  return rows[0] || null;
}

// Update title/content and bump updated_at. Returns the updated row (or null).
async function update(id, { title, content }) {
  const { rows } = await db.query(
    `UPDATE posts
        SET title = $2, content = $3, updated_at = now()
      WHERE id = $1
      RETURNING id, issue_id, user_id, title, content, created_at, updated_at`,
    [id, title, content],
  );
  return rows[0] || null;
}

// Hard delete (FK ON DELETE CASCADE removes comments/votes). Returns boolean.
async function remove(id) {
  const { rowCount } = await db.query(`DELETE FROM posts WHERE id = $1`, [id]);
  return rowCount > 0;
}

module.exports = { insert, findById, findDetailById, update, remove };
