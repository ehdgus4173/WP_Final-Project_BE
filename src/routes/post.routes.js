// 글 라우트
// 라우터 2개 export, routes/index.js에서 각각 다른 경로에 mount:
//   GET    /api/posts/:id             (optionalAuth)     게시물 상세 (로그인 시 user_vote 포함)
//   PUT    /api/posts/:id             (auth + validate)  게시물 수정 (작성자만)
//   DELETE /api/posts/:id             (auth)             게시물 삭제 (작성자 또는 admin)
//   POST   /api/posts/:id/votes       (auth + validate)  추천/비추천 토글 (value ±1)
//   POST   /api/issues/:issueId/posts (auth + validate)  게시물 작성 (issue 하위에 nested)
//
// 작성(create)을 issue 라우터가 아닌 여기 두어 URL은 /issues 하위지만 post 로직을 posts 도메인에 유지.

const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/optionalAuth');
const { validate } = require('../middleware/validate');
const postController = require('../controllers/postController');
const voteController = require('../controllers/voteController');

// 작성/수정 본문 검증 (title 1~120, content 20~10000)
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

// 투표 값은 정확히 +1 또는 -1만
const voteValidators = [
  body('value')
    .custom((v) => v === 1 || v === -1)
    .withMessage('value must be 1 or -1.'),
];

// /api/posts
const postRouter = express.Router();
postRouter.get('/:id', optionalAuth, postController.getById); // 공개; 로그인 시 user_vote 채움
postRouter.put('/:id', auth, postBodyValidators, validate, postController.update); // 작성자만
postRouter.delete('/:id', auth, postController.remove); // 작성자 또는 어드민
postRouter.post('/:id/votes', auth, voteValidators, validate, voteController.vote); // 토글

// /api/issues — 이슈 하위 글 작성(nested)
const issuePostRouter = express.Router();
issuePostRouter.post(
  '/:issueId/posts',
  auth,
  postBodyValidators,
  validate,
  postController.create,
);

module.exports = { postRouter, issuePostRouter };
