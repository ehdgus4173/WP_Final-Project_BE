// posts 테이블 접근 (파라미터 바인딩 raw SQL)
// 투표 점수는 votes 테이블 LEFT JOIN으로 집계(::int로 캐스팅해서 node-pg가 숫자 반환)
// 댓글은 여기서 조인 안 함 — GET /posts/:id의 댓글 목록은 commentRepo에서 따로 조립
// 수정은 작성자만(서비스가 findById로 sub===user_id 비교), 삭제는 canMutate. ERD v4.1

const db = require('../db');

// GET /posts/:id용 상세 컬럼 — 글 + 작성자 + 집계된 투표 점수
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

// 이슈 아래 글 생성. 생성된 row 반환
async function insert({ issue_id, user_id, title, content }) {
  const { rows } = await db.query(
    `INSERT INTO posts (issue_id, user_id, title, content)
     VALUES ($1, $2, $3, $4)
     RETURNING id, issue_id, user_id, title, content, created_at, updated_at`,
    [issue_id, user_id, title, content],
  );
  return rows[0];
}

// user_id 포함한 기본 row — 소유권/권한 체크용
async function findById(id) {
  const { rows } = await db.query(
    `SELECT id, issue_id, user_id, title, content, created_at, updated_at
       FROM posts
      WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

// GET /posts/:id 상세 — 글 + 작성자 + 점수. 댓글은 호출자가 붙임
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

// 제목/내용 수정 + updated_at 갱신. 갱신된 row(또는 null) 반환
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

// 유저가 쓴 최근 글(최신순) — 마이페이지 "최근 게시물"
// id, title, created_at, 집계 점수, 댓글 수 반환
async function findRecentByUser(userId, limit = 3) {
  const { rows } = await db.query(
    `SELECT p.id,
            p.issue_id,
            p.title,
            p.created_at,
            COALESCE(SUM(v.value), 0)::int AS score,
            (SELECT COUNT(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count
       FROM posts p
       LEFT JOIN votes v ON v.post_id = p.id
      WHERE p.user_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT $2`,
    [userId, limit],
  );
  return rows;
}

// 하드 삭제(FK ON DELETE CASCADE로 댓글/투표 같이 삭제). 삭제 여부 boolean 반환
async function remove(id) {
  const { rowCount } = await db.query(`DELETE FROM posts WHERE id = $1`, [id]);
  return rowCount > 0;
}

module.exports = { insert, findById, findDetailById, update, remove, findRecentByUser };
