// src/routes/post.routes.js — post routes.
//
// Post URLs span two mount points, so two routers are exported and wired
// separately in routes/index.js:
//   - postRouter      → mounted at /api/posts   (GET/PUT/DELETE /:id, POST /:id/votes)
//   - issuePostRouter → mounted at /api/issues  (POST /:issueId/posts = create post)
// Keeping creation here (not in an issue router) keeps all post logic in the
// posts domain even though its URL is nested under /issues.

const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/optionalAuth');
const { validate } = require('../middleware/validate');
const postController = require('../controllers/postController');
const voteController = require('../controllers/voteController');

// Body validators for create/update (Tech-Spec §4: title 1-120, content 20-10000).
const postBodyValidators = [
  body('title')
    .isString().withMessage('title must be a string.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('title must be 1-120 characters.'),
  body('content')
    .isString().withMessage('content must be a string.')
    .bail()
    .isLength({ min: 20, max: 10000 })
    .withMessage('content must be 20-10000 characters.'),
];

// Vote value must be exactly +1 or -1.
const voteValidators = [
  body('value')
    .custom((v) => v === 1 || v === -1)
    .withMessage('value must be 1 or -1.'),
];

// /api/posts
const postRouter = express.Router();
postRouter.get('/:id', optionalAuth, postController.getById); // public; fills user_vote if logged in
postRouter.put('/:id', auth, postBodyValidators, validate, postController.update); // author only
postRouter.delete('/:id', auth, postController.remove); // author or admin
postRouter.post('/:id/votes', auth, voteValidators, validate, voteController.vote); // toggle

// /api/issues — nested post creation under an issue
const issuePostRouter = express.Router();
issuePostRouter.post(
  '/:issueId/posts',
  auth,
  postBodyValidators,
  validate,
  postController.create,
);

module.exports = { postRouter, issuePostRouter };
