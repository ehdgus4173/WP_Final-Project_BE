// 어드민 전용 게이트
// auth 뒤에 써야 함(req.user 세팅됨). 어드민 아니면 403
// /api/admin/*에 router.use(auth, requireAdmin)로 붙음

const { createError } = require("./errorHandler");

// role이 admin인지 확인
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return next(createError(403, "FORBIDDEN", "Admin privileges required."));
  }
  next();
}

module.exports = { requireAdmin };
