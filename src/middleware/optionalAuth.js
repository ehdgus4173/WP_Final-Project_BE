// src/middleware/optionalAuth.js — optional JWT authentication.
//
// If a valid `Authorization: Bearer <token>` is present, decodes it into
// req.user ({ sub, username, role, ... }); otherwise continues anonymously
// without error. Used by public reads that personalize when logged in
// (e.g. GET /posts/:id fills user_vote / liked_by_me).

const { verify } = require('../utils/jwt');

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = verify(header.slice(7)); // strip 'Bearer '
    } catch (err) {
      // Invalid/expired token → treat as anonymous (no error thrown).
    }
  }
  next();
}

module.exports = { optionalAuth };
