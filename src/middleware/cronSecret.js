// src/middleware/cronSecret.js — shared-secret gate for the internal cron call.
//
// Supabase pg_cron calls POST /api/cron/generate-issues with
// `Authorization: Bearer <CRON_SECRET>`. 401 if missing/mismatched, or if the
// server has no CRON_SECRET configured (fail closed).

const env = require("../config/env");
const { createError } = require("./errorHandler");

function cronSecret(req, res, next) {
  const header = req.headers.authorization;
  const expected = env.CRON_SECRET;
  if (!expected || !header || header !== `Bearer ${expected}`) {
    return next(createError(401, "UNAUTHORIZED", "cron 인증에 실패했습니다."));
  }
  next();
}

module.exports = { cronSecret };
