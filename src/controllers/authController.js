// src/controllers/authController.js — auth HTTP layer (I/O only).
//
// Translates requests to authService calls and shapes the common envelope.
// Business rules live in the service; errors propagate via next(err).

const authService = require("../services/authService");
const { sign } = require("../utils/jwt");

async function register(req, res, next) {
  try {
    const { email, username, password } = req.body;
    const user = await authService.register({ email, username, password });
    res.status(201).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await authService.verifyCredentials({ email, password });
    const token = sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });
    res.json({ success: true, data: { token, user } });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getMe(req.user.sub);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
