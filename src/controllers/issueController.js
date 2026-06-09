// 이슈 상세 HTTP 계층 (I/O만)
// GET /api/issues/:id (공개) → { issue, posts }

const issueService = require('../services/issueService');

// 이슈 상세 조회. sort 쿼리(top|latest)로 글 정렬
async function getById(req, res, next) {
  try {
    const data = await issueService.getIssueDetail(req.params.id, req.query.sort);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getById };
