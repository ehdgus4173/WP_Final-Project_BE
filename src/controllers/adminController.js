// src/controllers/adminController.js — admin issue review (I/O only).
//
// Mounted under /api/admin (auth + requireAdmin). Review the AI-suggested
// pending issues: list / publish (approve) / delete (reject).

const issueService = require('../services/issueService');

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

module.exports = { listIssues, publishIssue, rejectIssue };
