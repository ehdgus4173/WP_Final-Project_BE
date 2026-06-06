// src/routes/post.routes.js — post routes.
//
// Post URLs span two mount points, so two routers are exported and wired
// separately in routes/index.js:
//   - postRouter      → mounted at /api/posts   (GET /:id; update/delete/votes later)
//   - issuePostRouter → mounted at /api/issues  (POST /:issueId/posts = create post)
// Keeping creation here (not in an issue router) keeps all post logic in the
// posts domain even though its URL is nested under /issues.

const express = require('express');
const { auth } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/optionalAuth');
const postController = require('../controllers/postController');
const voteController = require('../controllers/voteController');

// /api/posts
const postRouter = express.Router();
postRouter.get('/:id', optionalAuth, postController.getById); // public; fills user_vote if logged in
postRouter.put('/:id', auth, postController.update);          // author only
postRouter.delete('/:id', auth, postController.remove);       // author or admin
postRouter.post('/:id/votes', auth, voteController.vote);     // upvote/downvote toggle

// /api/issues — nested post creation under an issue
const issuePostRouter = express.Router();
issuePostRouter.post('/:issueId/posts', auth, postController.create);

module.exports = { postRouter, issuePostRouter };
