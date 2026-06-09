// 어드민 이슈 검수 (I/O만)
// /api/admin 아래(auth + requireAdmin). AI가 제안한 pending 이슈 검수:
// 목록 / 승인(publish) / 거절(delete), 그리고 오늘 이슈 수동 (재)생성(크론의 어드민판)

const issueService = require('../services/issueService');
const { createError } = require('../middleware/errorHandler');

// 이슈 목록. status 쿼리 없으면 pending
async function listIssues(req, res, next) {
  try {
    const status = req.query.status || 'pending';
    const issues = await issueService.listForAdmin(status);
    res.json({ success: true, data: { issues } });
  } catch (err) {
    next(err);
  }
}

// 이슈 승인(공개 전환)
async function publishIssue(req, res, next) {
  try {
    const data = await issueService.publishIssue(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// 이슈 거절(삭제). 성공 시 204
async function rejectIssue(req, res, next) {
  try {
    await issueService.rejectIssue(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// 오늘 이슈 수동 (재)생성 — 크론 잡의 어드민 트리거판
// 같은 서비스 재사용, force면 일일 중복 방지 무시. 생성된 이슈는 'pending'(승인 필요)
async function regenerateIssues(req, res, next) {
  try {
    const force = req.body?.force === true;
    const data = await issueService.generateDailyIssue(force);
    res.json({ success: true, data }); // { date, status, issue_id }
  } catch (err) {
    // Gemini/파싱 실패는 status 없는 일반 Error → 정규화해서 FE가 "AI 생성 실패"를 다른 500과 구분하게
    if (!err.status) {
      return next(
        createError(500, 'GENERATION_FAILED', 'Failed to generate the AI issue.'),
      );
    }
    next(err);
  }
}

module.exports = { listIssues, publishIssue, rejectIssue, regenerateIssues };
