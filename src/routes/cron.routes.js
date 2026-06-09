// /api/cron 라우트 (내부용, CRON_SECRET 보호)
//
//   POST  /generate-issues  (cronSecret)  pg_cron 호출 → Gemini → issues INSERT (pending)

const express = require('express');
const { cronSecret } = require('../middleware/cronSecret');
const cronController = require('../controllers/cronController');

const router = express.Router();

router.post('/generate-issues', cronSecret, cronController.generateIssues);

module.exports = router;
