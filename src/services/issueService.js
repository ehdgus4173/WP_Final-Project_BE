// 이슈/홈 도메인 로직
// getHome은 홈 페이로드 조립: { today_issue (or null), past_issues[] }
// published 이슈만 노출(필터링은 issueRepo에서)

const issueRepo = require('../repositories/issueRepo');
const geminiClient = require('../jobs/geminiClient');
const { todayInKST } = require('../utils/time');
const { createError } = require('../middleware/errorHandler');

// today_issue는 source_url 유지, past_issues는 뺌 (스펙 예시 기준)
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

// 홈: 오늘 이슈 + 지난 이슈 10개 병렬 조회
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

// 크론: 오늘 이슈 생성(status='pending'). 오늘(KST) 이슈 이미 있으면 스킵(상태 무관)
// force면 중복 방지 무시하고 무조건 생성(데모/수동 재실행용). Gemini/파싱 실패 시 throw → 컨트롤러가 로그+500
async function generateDailyIssue(force = false) {
  const date = todayInKST();
  if (!force) {
    const existing = await issueRepo.findByDate(date);
    if (existing) {
      return { date, status: 'skipped', issue_id: existing.id };
    }
  }
  const ai = await geminiClient.generateIssue();
  const issue = await issueRepo.insert(ai);
  return { date, status: 'success', issue_id: issue.id };
}

// 이슈 상세 (GET /api/issues/:id): published 이슈 + 글 목록
// sort: 'top'(점수) | 'latest'(최신); 기본 'top'
async function getIssueDetail(id, sort) {
  const issue = await issueRepo.findPublishedById(id);
  if (!issue) throw createError(404, 'ISSUE_NOT_FOUND', 'Issue not found.');
  const safeSort = sort === 'latest' ? 'latest' : 'top';
  const posts = await issueRepo.listPostsByIssue(id, safeSort);
  return { issue, posts };
}

// 어드민 이슈 검수

// 상태별 이슈 목록
async function listForAdmin(status = 'pending') {
  return issueRepo.listByStatus(status);
}

// 이슈 승인(publish). 안 됐으면 이유 구분해서 404/409
async function publishIssue(id) {
  const updated = await issueRepo.publish(id);
  if (updated) return updated;
  // publish가 왜 안 됐는지 구분
  const existing = await issueRepo.findById(id);
  if (!existing) throw createError(404, 'ISSUE_NOT_FOUND', 'Issue not found.');
  throw createError(409, 'ALREADY_PUBLISHED', 'Issue is already published.');
}

// 이슈 거절(삭제). 안 됐으면 이유 구분해서 404/409
async function rejectIssue(id) {
  const removed = await issueRepo.remove(id);
  if (removed) return;
  const existing = await issueRepo.findById(id);
  if (!existing) throw createError(404, 'ISSUE_NOT_FOUND', 'Issue not found.');
  throw createError(409, 'NOT_PENDING', 'Issue is not in pending state.');
}

module.exports = {
  getHome,
  getIssueDetail,
  generateDailyIssue,
  listForAdmin,
  publishIssue,
  rejectIssue,
};
