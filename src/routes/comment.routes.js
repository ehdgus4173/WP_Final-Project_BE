// src/routes/comment.routes.js — comment routes.
//
// Comment URLs span two mount points (wired in routes/index.js):
//   - postCommentRouter → mounted at /api/posts    (POST /:postId/comments)
//   - commentRouter     → mounted at /api/comments  (DELETE /:id; likes added later)

const express = require('express');
const { auth } = require('../middleware/auth');
const commentController = require('../controllers/commentController');

// /api/posts — create a comment/reply on a post
const postCommentRouter = express.Router();
postCommentRouter.post('/:postId/comments', auth, commentController.create);

// /api/comments
const commentRouter = express.Router();
commentRouter.delete('/:id', auth, commentController.remove);

module.exports = { postCommentRouter, commentRouter };
