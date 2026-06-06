// src/controllers/voteController.js — vote HTTP layer (I/O only).
//
// POST /api/posts/:id/votes  (auth) — toggle upvote/downvote.
// 201 on new vote, 200 on update/delete.

const voteService = require('../services/voteService');

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
