// 로그인 무차별 대입 제한기
// POST /api/auth/login에 IP당 15분에 5회. 초과 시 429를 공통 에러 봉투로 내려줌

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
        message: "Too many login attempts. Please try again later.",
      },
    });
  },
});

module.exports = { loginLimiter };
