// src/repositories/issueRepo.js — issues table access (raw parameterized SQL).
//
// Home only surfaces published issues (ERD v4.1: status pending/published).
// "Today" is decided by KST date in SQL so it's independent of server/DB TZ.
// post_count is aggregated via LEFT JOIN; ::int so node-pg returns a number.

const db = require('../db');

// Columns shared by home cards. `date` is the KST calendar date as a string.
const ISSUE_CARD = `
  i.id,
  i.title,
  i.summary,
  i.source_url,
  i.created_at,
  to_char(i.created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD') AS date,
  COUNT(p.id)::int AS post_count
`;

// Published issue whose KST date is today. At most one per day; newest wins.
async function findTodayPublished() {
  const { rows } = await db.query(
    `SELECT ${ISSUE_CARD}
       FROM issues i
       LEFT JOIN posts p ON p.issue_id = i.id
      WHERE i.status = 'published'
        AND (i.created_at AT TIME ZONE 'Asia/Seoul')::date
            = (now() AT TIME ZONE 'Asia/Seoul')::date
      GROUP BY i.id
      ORDER BY i.created_at DESC
      LIMIT 1`,
  );
  return rows[0] || null;
}

// Published issues from days other than today, newest first.
async function findPastPublished(limit = 10) {
  const { rows } = await db.query(
    `SELECT ${ISSUE_CARD}
       FROM issues i
       LEFT JOIN posts p ON p.issue_id = i.id
      WHERE i.status = 'published'
        AND (i.created_at AT TIME ZONE 'Asia/Seoul')::date
            <> (now() AT TIME ZONE 'Asia/Seoul')::date
      GROUP BY i.id
      ORDER BY i.created_at DESC
      LIMIT $1`,
    [limit],
  );
  return rows;
}

// Any issue (status-agnostic) on the given KST date — cron dedup check.
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

// Insert a cron-generated issue. status defaults to 'pending' (DB DEFAULT) —
// it stays hidden until an admin publishes it.
async function insert({ title, summary, source_url }) {
  const { rows } = await db.query(
    `INSERT INTO issues (title, summary, source_url)
     VALUES ($1, $2, $3)
     RETURNING id, status, created_at`,
    [title, summary, source_url],
  );
  return rows[0];
}

// --- Admin review (status-aware, no post_count) ---

const ADMIN_COLS = 'id, title, summary, source_url, status, published_at, created_at';

// All issues of a given status, newest first (admin list).
async function listByStatus(status) {
  const { rows } = await db.query(
    `SELECT ${ADMIN_COLS} FROM issues WHERE status = $1 ORDER BY created_at DESC`,
    [status],
  );
  return rows;
}

// Single issue, any status (existence checks for publish/reject).
async function findById(id) {
  const { rows } = await db.query(
    `SELECT ${ADMIN_COLS} FROM issues WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

// Approve: pending → published. Returns row, or null if not found / not pending.
async function publish(id) {
  const { rows } = await db.query(
    `UPDATE issues SET status = 'published', published_at = now()
      WHERE id = $1 AND status = 'pending'
      RETURNING id, status, published_at`,
    [id],
  );
  return rows[0] || null;
}

// Reject: hard delete a pending issue. Returns true if a row was deleted.
async function remove(id) {
  const { rowCount } = await db.query(
    `DELETE FROM issues WHERE id = $1 AND status = 'pending'`,
    [id],
  );
  return rowCount > 0;
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
};
