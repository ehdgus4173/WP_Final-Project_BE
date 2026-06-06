// src/services/issueService.js — issue/home domain logic.
//
// getHome assembles the aggregated Home payload (Tech-Spec §4.1.1):
//   { today_issue (or null), past_issues[] }
// Only published issues are surfaced (filtering happens in issueRepo).

const issueRepo = require('../repositories/issueRepo');

// today_issue keeps source_url; past_issues omit it (spec §4.1.1 example).
function toPastCard(row) {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    date: row.date,
    post_count: row.post_count,
    created_at: row.created_at,
  };
}

async function getHome() {
  const [today, past] = await Promise.all([
    issueRepo.findTodayPublished(),
    issueRepo.findPastPublished(10),
  ]);

  return {
    today_issue: today || null,
    past_issues: past.map(toPastCard),
  };
}

module.exports = { getHome };
