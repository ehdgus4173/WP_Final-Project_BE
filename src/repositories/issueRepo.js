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

module.exports = { findTodayPublished, findPastPublished };
