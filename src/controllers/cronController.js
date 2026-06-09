// 내부 크론용 HTTP 계층. POST /api/cron/generate-issues (cronSecret로 보호)
// 성공/스킵은 200, 실패는 로그 남기고 에러 핸들러로 넘김

const issueService = require('../services/issueService');

// 일일 이슈 생성 트리거. force면 하루 1회 중복 방지 무시하고 강제 재실행
async function generateIssues(req, res, next) {
  try {
    // ?force=true 또는 body.force=true → 중복 방지 건너뜀 (수동 재실행)
    const force = req.query.force === 'true' || req.body?.force === true;
    const result = await issueService.generateDailyIssue(force);
    res.json({ success: true, data: result });
  } catch (err) {
    // 크론 실패는 따로 로그 남겨서 추적되게 함
    console.error('[cron] generate-issues failed:', err.message);
    next(err);
  }
}

module.exports = { generateIssues };
