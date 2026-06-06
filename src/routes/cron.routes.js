// src/routes/cron.routes.js — /api/cron (internal, CRON_SECRET-protected).
//
//   POST /generate-issues   pg_cron이 호출. Gemini → issues INSERT (pending)

const express = require('express');
const { cronSecret } = require('../middleware/cronSecret');
const cronController = require('../controllers/cronController');

const router = express.Router();

router.post('/generate-issues', cronSecret, cronController.generateIssues);

module.exports = router;
