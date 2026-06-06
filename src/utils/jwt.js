// src/utils/jwt.js — JWT sign/verify.
//
// Payload shape (Tech-Spec §5.2): { sub, username, role } + iat/exp.
// `sub` is the user id and is the comparison key used by canMutate().

const jwt = require("jsonwebtoken");
const env = require("../config/env");

// claims: { sub, username, role }
function sign(claims) {
  return jwt.sign(claims, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

// Returns the decoded payload, or throws (expired / tampered / wrong secret).
function verify(token) {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
}

module.exports = { sign, verify };
