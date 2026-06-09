// /api/admin 라우트 (auth + requireAdmin 전역 적용)
//
//   GET    /issues             (validate)  검수 대기/전체 이슈 목록 (?status=pending 기본)
//   PATCH  /issues/:id         (validate)  승인 → published ({ status: 'published' })
//   DELETE /issues/:id         (validate)  거절 → pending 이슈 하드 삭제
//   POST   /regenerate-issues  (validate)  수동 이슈 생성 (cron 동일 서비스, { force? })

const express = require('express');
const { param, body, query } = require('express-validator');

const adminController = require('../controllers/adminController');
const { auth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const { validate } = require('../middleware/validate');

const router = express.Router();

// 모든 어드민 라우트는 유효한 어드민 토큰 필요
router.use(auth, requireAdmin);

router.get(
  '/issues',
  query('status').optional().isIn(['pending', 'published'])
    .withMessage("status must be either 'pending' or 'published'."),
  validate,
  adminController.listIssues,
);

router.patch(
  '/issues/:id',
  param('id').isInt().withMessage('issue id must be an integer.'),
  body('status').equals('published').withMessage("status must be 'published'."),
  validate,
  adminController.publishIssue,
);

router.delete(
  '/issues/:id',
  param('id').isInt().withMessage('issue id must be an integer.'),
  validate,
  adminController.rejectIssue,
);

router.post(
  '/regenerate-issues',
  body('force').optional().isBoolean().withMessage('force must be a boolean.'),
  validate,
  adminController.regenerateIssues,
);

module.exports = router;
