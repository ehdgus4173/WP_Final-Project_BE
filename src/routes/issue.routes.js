// src/routes/issue.routes.js — /api/issues read routes (issues domain).
//
//   GET /:id   이슈(published) + 게시물 목록 (?sort=top|latest, 비로그인 가능)
//
// Mounted at /api/issues alongside the post-creation router (POST /:id/posts);
// method+path differ so they coexist.

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
