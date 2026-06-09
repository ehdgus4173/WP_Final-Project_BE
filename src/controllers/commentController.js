// 댓글 HTTP 계층 (I/O만)

const commentService = require('../services/commentService');

// POST /api/posts/:postId/comments (auth) → 201 댓글/대댓글
// 작성자는 JWT(sub/username)에서 가져옴. 새 댓글은 좋아요 0
async function create(req, res, next) {
  try {
    const c = await commentService.create(req.params.postId, req.user.sub, {
      content: req.body.content,
      parent_id: req.body.parent_id,
    });
    res.status(201).json({
      success: true,
      data: {
        id: c.id,
        post_id: c.post_id,
        parent_id: c.parent_id,
        depth: c.depth,
        content: c.content,
        author: { id: req.user.sub, username: req.user.username },
        like_count: 0,
        liked_by_me: false,
        created_at: c.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/comments/:id (auth, 작성자 또는 어드민) → 204
async function remove(req, res, next) {
  try {
    await commentService.remove(req.params.id, req.user);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// POST /api/comments/:id/likes (auth) — 좋아요 토글
// 좋아요 추가 시 201, 취소 시 200
async function like(req, res, next) {
  try {
    const result = await commentService.toggleLike(req.params.id, req.user.sub);
    const status = result.action === 'created' ? 201 : 200;
    res.status(status).json({
      success: true,
      data: {
        comment_id: Number(req.params.id),
        liked: result.liked,
        like_count: result.like_count,
        action: result.action,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, remove, like };
