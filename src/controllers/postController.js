// src/controllers/postController.js — post HTTP layer (I/O only).
//
// Business logic lives in postService. Controllers only read req, call the
// service, and shape the response envelope { success, data }.

const postService = require('../services/postService');

// POST /api/issues/:issueId/posts  (auth)
// → 201 { id, issue_id, title, created_at } (FE redirects to /posts/:id)
async function create(req, res, next) {
  try {
    const post = await postService.create(req.params.issueId, req.user.sub, {
      title: req.body.title,
      content: req.body.content,
    });
    res.status(201).json({
      success: true,
      data: {
        id: post.id,
        issue_id: post.issue_id,
        title: post.title,
        created_at: post.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/posts/:id  (public) → { post, comments }
// user_vote is filled once votes land; comments arrive with feat/comments.
async function getById(req, res, next) {
  try {
    const post = await postService.getDetail(req.params.id);
    res.json({
      success: true,
      data: {
        post: { ...post, user_vote: null },
        comments: [],
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getById };
