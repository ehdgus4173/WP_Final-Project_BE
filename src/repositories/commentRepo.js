// comments 테이블 접근 (파라미터 바인딩 raw SQL)
// 댓글은 parent_id/depth 들고 있는 평면 row(ERD v4.1): depth 0 = 댓글, depth 1 = 대댓글
// like_count / liked_by_me는 comment_likes에서 집계
// findByPost는 댓글+대댓글을 한 목록으로 줌. 중첩은 FE가 parent_id로 함

const db = require('../db');

// 댓글/대댓글 1건 + 작성자 + 좋아요 집계
// $2 = 요청자 id(또는 null) → 익명이면 liked_by_me는 false
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

// 글의 모든 댓글/대댓글, 오래된 순
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

// 기본 row(user_id, post_id, depth 포함) — 권한·depth 체크용
async function findById(id) {
  const { rows } = await db.query(
    `SELECT id, post_id, user_id, parent_id, depth FROM comments WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

// 댓글/대댓글 INSERT
async function insert({ post_id, user_id, parent_id, depth, content }) {
  const { rows } = await db.query(
    `INSERT INTO comments (post_id, user_id, parent_id, depth, content)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, post_id, user_id, parent_id, depth, content, created_at`,
    [post_id, user_id, parent_id, depth, content],
  );
  return rows[0];
}

// 하드 삭제. 부모 댓글이면 답글·comment_likes까지 CASCADE
async function remove(id) {
  const { rowCount } = await db.query(`DELETE FROM comments WHERE id = $1`, [id]);
  return rowCount > 0;
}

module.exports = { findByPost, findById, insert, remove };
