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
    const post = await postService.getDetail(req.params.id, req.user?.sub);
    res.json({
      success: true,
      data: {
        post, // includes user_vote (null when anonymous)
        comments: [], // filled in feat/comments
      },
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/posts/:id  (auth, author only) → 200 { id, title, updated_at }
async function update(req, res, next) {
  try {
    const post = await postService.update(req.params.id, req.user, {
      title: req.body.title,
      content: req.body.content,
    });
    res.json({
      success: true,
      data: { id: post.id, title: post.title, updated_at: post.updated_at },
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/posts/:id  (auth, author or admin) → 204 No Content
async function remove(req, res, next) {
  try {
    await postService.remove(req.params.id, req.user);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getById, update, remove };
