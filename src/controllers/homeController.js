// src/controllers/homeController.js — Home HTTP layer (I/O only).
//
// GET /api/home → today's issue + recent past issues (single response).

const issueService = require('../services/issueService');

async function getHome(req, res, next) {
  try {
    const data = await issueService.getHome();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHome };
