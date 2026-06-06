// src/routes/post.routes.js — post routes.
//
// Post URLs span two mount points, so two routers are exported and wired
// separately in routes/index.js:
//   - postRouter      → mounted at /api/posts   (GET /:id; update/delete/votes later)
//   - issuePostRouter → mounted at /api/issues  (POST /:issueId/posts = 게시물 작성)
// Keeping creation here (not in an issue router) keeps all post logic in the
// posts domain even though its URL is nested under /issues.

const express = require('express');
const { auth } = require('../middleware/auth');
const postController = require('../controllers/postController');

// /api/posts
const postRouter = express.Router();
postRouter.get('/:id', postController.getById); // public (optionalAuth added with votes)

// /api/issues — nested post creation under an issue
const issuePostRouter = express.Router();
issuePostRouter.post('/:issueId/posts', auth, postController.create);

module.exports = { postRouter, issuePostRouter };
