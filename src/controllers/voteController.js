// 투표 HTTP 계층 (I/O만)
// POST /api/posts/:id/votes (auth) — 추천/비추천 토글
// 새 투표면 201, 변경/취소면 200

const voteService = require('../services/voteService');

// 투표 토글
async function vote(req, res, next) {
  try {
    const result = await voteService.toggle(
      req.params.id,
      req.user.sub,
      req.body.value,
    );
    const status = result.action === 'created' ? 201 : 200;
    res.status(status).json({
      success: true,
      data: {
        post_id: Number(req.params.id),
        value: result.value,
        action: result.action,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { vote };
