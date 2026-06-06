// src/controllers/cronController.js — internal cron HTTP layer.
//
// POST /api/cron/generate-issues (cronSecret-protected). 200 for success/skip;
// failures are logged (cron visibility) and propagated to the error handler.

const issueService = require('../services/issueService');

async function generateIssues(req, res, next) {
  try {
    const result = await issueService.generateDailyIssue();
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[cron] generate-issues failed:', err.message);
    next(err);
  }
}

module.exports = { generateIssues };
