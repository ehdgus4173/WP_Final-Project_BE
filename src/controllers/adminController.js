// src/controllers/adminController.js — admin issue review (I/O only).
//
// Mounted under /api/admin (auth + requireAdmin). Review the AI-suggested
// pending issues: list / publish (approve) / delete (reject), and manually
// (re)generate today's issue (admin-triggered counterpart to the cron job).

const issueService = require('../services/issueService');
const { createError } = require('../middleware/errorHandler');

async function listIssues(req, res, next) {
  try {
    const status = req.query.status || 'pending';
    const issues = await issueService.listForAdmin(status);
    res.json({ success: true, data: { issues } });
  } catch (err) {
    next(err);
  }
}

async function publishIssue(req, res, next) {
  try {
    const data = await issueService.publishIssue(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function rejectIssue(req, res, next) {
  try {
    await issueService.rejectIssue(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// Manual (re)generate today's issue — admin-triggered version of the cron job.
// Reuses the same service; `force` bypasses the daily dedup. The generated
// issue is created as 'pending' (still needs admin approval to surface).
async function regenerateIssues(req, res, next) {
  try {
    const force = req.body?.force === true;
    const data = await issueService.generateDailyIssue(force);
    res.json({ success: true, data }); // { date, status, issue_id }
  } catch (err) {
    // Gemini/parse failures are plain Errors (no status) → normalize so the FE
    // can distinguish "AI generation failed" from other 500s.
    if (!err.status) {
      return next(
        createError(500, 'GENERATION_FAILED', 'AI 이슈 생성에 실패했습니다.'),
      );
    }
    next(err);
  }
}

module.exports = { listIssues, publishIssue, rejectIssue, regenerateIssues };
