// /api/issues 읽기 라우트 (issues 도메인)
//
//   GET  /:id  (validate)  이슈(published) + 게시물 목록 (?sort=top|latest, 비로그인 가능)
//
// post-creation 라우터(POST /:id/posts)와 같은 /api/issues에 mount; method+path가 달라 공존.

const express = require('express');
const { param } = require('express-validator');

const issueController = require('../controllers/issueController');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get(
  '/:id',
  param('id').isInt().withMessage('issue id must be an integer.'),
  validate,
  issueController.getById,
);

module.exports = router;
