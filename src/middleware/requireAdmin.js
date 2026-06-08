// src/middleware/requireAdmin.js — admin-only gate.
//
// Use AFTER `auth` (which sets req.user). 403 if the authenticated user is not
// an admin. Applied to /api/admin/* via router.use(auth, requireAdmin).

const { createError } = require("./errorHandler");

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return next(createError(403, "FORBIDDEN", "Admin privileges required."));
  }
  next();
}

module.exports = { requireAdmin };
