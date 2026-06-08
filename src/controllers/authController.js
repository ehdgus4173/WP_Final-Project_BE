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

// --- Social login (OAuth), step 1: identify -------------------------------
// Existing account → issue our JWT (same shape as login). Brand-new account →
// { needs_username: true } so the client collects a username and calls
// /oauth/register. Nothing is created here.
async function oauthIdentify(req, res, next) {
  try {
    const { access_token } = req.body;
    const result = await authService.oauthIdentify({ accessToken: access_token });
    if (result.needsUsername) {
      return res.json({ success: true, data: { needs_username: true } });
    }
    const { user } = result;
    const token = sign({ sub: user.id, username: user.username, role: user.role });
    res.json({ success: true, data: { token, user } });
  } catch (err) {
    next(err);
  }
}

// --- Social login (OAuth), step 2: register -------------------------------
// Re-verifies the token and creates the account with the chosen username, then
// issues our JWT (same shape as login).
async function oauthRegister(req, res, next) {
  try {
    const { access_token, username } = req.body;
    const { user } = await authService.oauthRegister({
      accessToken: access_token,
      username,
    });
    const token = sign({ sub: user.id, username: user.username, role: user.role });
    res.json({ success: true, data: { token, user } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, oauthIdentify, oauthRegister };
