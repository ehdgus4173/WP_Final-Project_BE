// src/controllers/cronController.js — internal cron HTTP layer.
//
// POST /api/cron/generate-issues (cronSecret-protected). 200 for success/skip;
// failures are logged (cron visibility) and propagated to the error handler.

const issueService = require('../services/issueService');

async function generateIssues(req, res, next) {
  try {
    // ?force=true (or { force: true }) bypasses the daily dedup — manual re-trigger.
    const force = req.query.force === 'true' || req.body?.force === true;
    const result = await issueService.generateDailyIssue(force);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[cron] generate-issues failed:', err.message);
    next(err);
  }
}

module.exports = { generateIssues };
