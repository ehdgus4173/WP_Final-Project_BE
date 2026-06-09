// 홈 HTTP 계층 (I/O만)
// GET /api/home → 오늘 이슈 + 최근 지난 이슈들 (한 응답에)

const issueService = require('../services/issueService');

// 홈 데이터 조회
async function getHome(req, res, next) {
  try {
    const data = await issueService.getHome();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHome };
