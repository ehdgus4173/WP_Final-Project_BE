// src/routes/comment.routes.js — comment routes.
//
// Comment URLs span two mount points (wired in routes/index.js):
//   - postCommentRouter → mounted at /api/posts    (POST /:postId/comments)
//   - commentRouter     → mounted at /api/comments  (DELETE /:id; likes added later)

const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const commentController = require('../controllers/commentController');

// content 2-1000 chars; parent_id optional (a positive int makes it a reply).
const commentBodyValidators = [
  body('content')
    .isString().withMessage('content must be a string.')
    .bail()
    .trim()
    .isLength({ min: 2, max: 1000 })
    .withMessage('content must be 2-1000 characters.'),
  body('parent_id')
    .optional({ nullable: true })
    .isInt({ gt: 0 })
    .withMessage('parent_id must be a positive integer.'),
];

// /api/posts — create a comment/reply on a post
const postCommentRouter = express.Router();
postCommentRouter.post(
  '/:postId/comments',
  auth,
  commentBodyValidators,
  validate,
  commentController.create,
);

// /api/comments
const commentRouter = express.Router();
commentRouter.delete('/:id', auth, commentController.remove);
commentRouter.post('/:id/likes', auth, commentController.like); // like toggle

module.exports = { postCommentRouter, commentRouter };
