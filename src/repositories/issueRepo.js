// issues 테이블 접근 (파라미터 바인딩 raw SQL)
// 홈은 published 이슈만 노출(ERD v4.1: status pending/published)
// "오늘"은 SQL에서 KST 날짜로 판단 → 서버/DB 타임존과 무관
// post_count는 LEFT JOIN으로 집계, ::int로 숫자 반환

const db = require("../db");

// 홈 카드 공통 컬럼. date는 KST 달력 날짜 문자열
const ISSUE_CARD = `
  i.id,
  i.title,
  i.summary,
  i.source_url,
  i.created_at,
  to_char(i.created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD') AS date,
  COUNT(p.id)::int AS post_count
`;

// KST 기준 오늘 날짜의 published 이슈. 하루 최대 1개, 최신 우선
async function findTodayPublished() {
  const { rows } = await db.query(
    `SELECT ${ISSUE_CARD}
       FROM issues i
       LEFT JOIN posts p ON p.issue_id = i.id
      WHERE i.status = 'published'
        AND (i.published_at AT TIME ZONE 'Asia/Seoul')::date
            = (now() AT TIME ZONE 'Asia/Seoul')::date
      GROUP BY i.id
      ORDER BY i.created_at DESC
      LIMIT 1`,
  );
  return rows[0] || null;
}

// 오늘 말고 지난 날들의 published 이슈, 최신순
async function findPastPublished(limit = 10) {
  const { rows } = await db.query(
    `SELECT ${ISSUE_CARD}
       FROM issues i
       LEFT JOIN posts p ON p.issue_id = i.id
      WHERE i.status = 'published'
        AND (i.published_at AT TIME ZONE 'Asia/Seoul')::date
            <> (now() AT TIME ZONE 'Asia/Seoul')::date
      GROUP BY i.id
      ORDER BY i.created_at DESC
      LIMIT $1`,
    [limit],
  );
  return rows;
}

// 해당 KST 날짜의 아무 이슈(상태 무관) — 크론 중복 체크용
async function findByDate(kstDate) {
  const { rows } = await db.query(
    `SELECT id, status FROM issues
      WHERE (created_at AT TIME ZONE 'Asia/Seoul')::date = $1
      ORDER BY created_at DESC
      LIMIT 1`,
    [kstDate],
  );
  return rows[0] || null;
}

// 크론 생성 이슈 INSERT. status는 DB DEFAULT 'pending' — 어드민 승인 전까진 숨겨짐
async function insert({ title, summary, source_url }) {
  const { rows } = await db.query(
    `INSERT INTO issues (title, summary, source_url)
     VALUES ($1, $2, $3)
     RETURNING id, status, created_at`,
    [title, summary, source_url],
  );
  return rows[0];
}

// 어드민 검수 (상태 기반, post_count 없음)

const ADMIN_COLS =
  "id, title, summary, source_url, status, published_at, created_at";

// 특정 상태 이슈 전부, 최신순 (어드민 목록)
async function listByStatus(status) {
  const { rows } = await db.query(
    `SELECT ${ADMIN_COLS} FROM issues WHERE status = $1 ORDER BY created_at DESC`,
    [status],
  );
  return rows;
}

// 단일 이슈, 상태 무관 (publish/reject 존재 체크용)
async function findById(id) {
  const { rows } = await db.query(
    `SELECT ${ADMIN_COLS} FROM issues WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

// 승인: pending → published. row 반환, 없거나 pending 아니면 null
async function publish(id) {
  const { rows } = await db.query(
    `UPDATE issues SET status = 'published', published_at = now()
      WHERE id = $1 AND status = 'pending'
      RETURNING id, status, published_at`,
    [id],
  );
  return rows[0] || null;
}

// 거절: pending 이슈 하드 삭제. 삭제됐으면 true
async function remove(id) {
  const { rowCount } = await db.query(
    `DELETE FROM issues WHERE id = $1 AND status = 'pending'`,
    [id],
  );
  return rowCount > 0;
}

// 이슈 상세 (GET /api/issues/:id)

// post_count + KST date 붙은 단일 published 이슈. 없거나 미공개면 null
async function findPublishedById(id) {
  const { rows } = await db.query(
    `SELECT ${ISSUE_CARD}
       FROM issues i
       LEFT JOIN posts p ON p.issue_id = i.id
      WHERE i.status = 'published' AND i.id = $1
      GROUP BY i.id`,
    [id],
  );
  return rows[0] || null;
}

// 화이트리스트 ORDER BY (유저 입력 직접 끼워넣지 않음)
const POST_ORDER = {
  top: "score DESC, p.created_at DESC",
  latest: "p.created_at DESC",
};

// 이슈 아래 글 목록 — 작성자 + 투표 점수 + 댓글 수 + 본문 미리보기
// votes/comments는 스칼라 서브쿼리로 집계해서 JOIN fan-out 방지
async function listPostsByIssue(issueId, sort = "top") {
  const orderBy = POST_ORDER[sort] || POST_ORDER.top;
  const { rows } = await db.query(
    `SELECT
       p.id,
       p.title,
       left(p.content, 100) AS body_preview,
       json_build_object('id', u.id, 'username', u.username) AS author,
       COALESCE((SELECT SUM(CASE WHEN value = 1  THEN 1 ELSE 0 END)
                   FROM votes WHERE post_id = p.id), 0)::int AS upvotes,
       COALESCE((SELECT SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END)
                   FROM votes WHERE post_id = p.id), 0)::int AS downvotes,
       COALESCE((SELECT SUM(value) FROM votes WHERE post_id = p.id), 0)::int AS score,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.id)::int AS comment_count,
       p.created_at,
       p.updated_at
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.issue_id = $1
     ORDER BY ${orderBy}`,
    [issueId],
  );
  return rows;
}

module.exports = {
  findTodayPublished,
  findPastPublished,
  findByDate,
  insert,
  listByStatus,
  findById,
  publish,
  remove,
  findPublishedById,
  listPostsByIssue,
};
