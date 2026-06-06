// src/controllers/commentController.js — comment HTTP layer (I/O only).

const commentService = require('../services/commentService');

// POST /api/posts/:postId/comments  (auth) → 201 comment/reply.
// author is taken from the JWT (sub/username); a fresh comment has 0 likes.
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

// DELETE /api/comments/:id  (auth, author or admin) → 204 No Content
async function remove(req, res, next) {
  try {
    await commentService.remove(req.params.id, req.user);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { create, remove };
