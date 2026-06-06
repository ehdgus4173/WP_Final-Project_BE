// src/controllers/issueController.js — issue detail HTTP layer (I/O only).
//
// GET /api/issues/:id (public) → { issue, posts } (Tech-Spec §4.1.1).

const issueService = require('../services/issueService');

async function getById(req, res, next) {
  try {
    const data = await issueService.getIssueDetail(req.params.id, req.query.sort);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getById };
