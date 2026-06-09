// 내부 크론 호출용 공유 시크릿 게이트
// Supabase pg_cron이 Authorization: Bearer <CRON_SECRET>로 POST /api/cron/generate-issues 호출
// 헤더 없거나 안 맞거나, 서버에 CRON_SECRET 설정 안 됐으면 401 (fail closed)

const env = require("../config/env");
const { createError } = require("./errorHandler");

// 시크릿 일치하는지 확인. 안 맞으면 401
function cronSecret(req, res, next) {
  const header = req.headers.authorization;
  const expected = env.CRON_SECRET;
  if (!expected || !header || header !== `Bearer ${expected}`) {
    return next(createError(401, "UNAUTHORIZED", "Cron authentication failed."));
  }
  next();
}

module.exports = { cronSecret };
