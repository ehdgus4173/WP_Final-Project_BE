// 댓글 라우트
// 라우터 2개 export, routes/index.js에서 각각 다른 경로에 mount:
//   POST   /api/posts/:postId/comments  (auth + validate)  댓글/대댓글 작성 (parent_id 있으면 대댓글)
//   DELETE /api/comments/:id            (auth)              댓글 삭제 (작성자 또는 admin)
//   POST   /api/comments/:id/likes      (auth)              댓글 좋아요 토글

const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const commentController = require('../controllers/commentController');

// content 2~1000자; parent_id 선택(양의 정수면 대댓글)
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

// /api/posts — 글에 댓글/대댓글 작성
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
commentRouter.post('/:id/likes', auth, commentController.like); // 좋아요 토글

module.exports = { postCommentRouter, commentRouter };
