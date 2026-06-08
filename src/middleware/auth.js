// src/middleware/auth.js — required JWT authentication.
//
// Extracts `Authorization: Bearer <token>`, verifies it, and injects the
// decoded payload as `req.user` ({ sub, username, role, iat, exp }).
// 401 on missing header or invalid/expired token.

const { verify } = require("../utils/jwt");
const { createError } = require("./errorHandler");

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(createError(401, "UNAUTHORIZED", "Authentication required."));
  }
  try {
    req.user = verify(header.slice(7)); // strip 'Bearer '
    next();
  } catch (err) {
    next(createError(401, "INVALID_TOKEN", "Invalid token."));
  }
}

module.exports = { auth };
