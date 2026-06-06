// src/services/issueService.js — issue/home domain logic.
//
// getHome assembles the aggregated Home payload (Tech-Spec §4.1.1):
//   { today_issue (or null), past_issues[] }
// Only published issues are surfaced (filtering happens in issueRepo).

const issueRepo = require('../repositories/issueRepo');
const geminiClient = require('../jobs/geminiClient');
const { todayInKST } = require('../utils/time');
const { createError } = require('../middleware/errorHandler');

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

// Cron: generate today's issue (status='pending'). Skips if one already exists
// for today (KST, status-agnostic). Throws on Gemini/parse failure → controller
// logs + 500.
async function generateDailyIssue() {
  const date = todayInKST();
  const existing = await issueRepo.findByDate(date);
  if (existing) {
    return { date, status: 'skipped', issue_id: existing.id };
  }
  const ai = await geminiClient.generateIssue();
  const issue = await issueRepo.insert(ai);
  return { date, status: 'success', issue_id: issue.id };
}

// Issue detail (GET /api/issues/:id): published issue + its posts list.
// sort: 'top' (score) | 'latest' (recency); default 'top'.
async function getIssueDetail(id, sort) {
  const issue = await issueRepo.findPublishedById(id);
  if (!issue) throw createError(404, 'ISSUE_NOT_FOUND', '이슈를 찾을 수 없습니다.');
  const safeSort = sort === 'latest' ? 'latest' : 'top';
  const posts = await issueRepo.listPostsByIssue(id, safeSort);
  return { issue, posts };
}

// --- Admin issue review ---

async function listForAdmin(status = 'pending') {
  return issueRepo.listByStatus(status);
}

async function publishIssue(id) {
  const updated = await issueRepo.publish(id);
  if (updated) return updated;
  // Disambiguate why the publish didn't happen.
  const existing = await issueRepo.findById(id);
  if (!existing) throw createError(404, 'ISSUE_NOT_FOUND', '이슈를 찾을 수 없습니다.');
  throw createError(409, 'ALREADY_PUBLISHED', '이미 게시된 이슈입니다.');
}

async function rejectIssue(id) {
  const removed = await issueRepo.remove(id);
  if (removed) return;
  const existing = await issueRepo.findById(id);
  if (!existing) throw createError(404, 'ISSUE_NOT_FOUND', '이슈를 찾을 수 없습니다.');
  throw createError(409, 'NOT_PENDING', '검수 대기(pending) 상태가 아닙니다.');
}

module.exports = {
  getHome,
  getIssueDetail,
  generateDailyIssue,
  listForAdmin,
  publishIssue,
  rejectIssue,
};
