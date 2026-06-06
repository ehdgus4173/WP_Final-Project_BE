// src/middleware/rateLimit.js — login brute-force limiter.
//
// 5 requests / 15 min per IP on POST /api/auth/login (Tech-Spec §5.4).
// Emits the project's common error envelope on 429.

const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요.",
      },
    });
  },
});

module.exports = { loginLimiter };
