// src/routes/admin.routes.js — /api/admin (auth + requireAdmin on all routes).
//
//   GET    /issues       검수 대기/전체 이슈 목록 (?status=pending 기본)
//   PATCH  /issues/:id   승인 → published ({ status: 'published' })
//   DELETE /issues/:id   거절 → pending 이슈 hard delete

const express = require('express');
const { param, body, query } = require('express-validator');

const adminController = require('../controllers/adminController');
const { auth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Every admin route requires a valid admin token.
router.use(auth, requireAdmin);

router.get(
  '/issues',
  query('status').optional().isIn(['pending', 'published'])
    .withMessage("status는 'pending' 또는 'published'만 허용됩니다."),
  validate,
  adminController.listIssues,
);

router.patch(
  '/issues/:id',
  param('id').isInt().withMessage('issue id는 정수여야 합니다.'),
  body('status').equals('published').withMessage("status는 'published'만 허용됩니다."),
  validate,
  adminController.publishIssue,
);

router.delete(
  '/issues/:id',
  param('id').isInt().withMessage('issue id는 정수여야 합니다.'),
  validate,
  adminController.rejectIssue,
);

module.exports = router;
