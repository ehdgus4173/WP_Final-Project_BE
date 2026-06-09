// 필수 JWT 인증
// Authorization: Bearer <token> 뽑아 검증하고 디코딩된 payload를 req.user에 넣음
//   req.user = { sub, username, role, iat, exp }
// 헤더 없거나 토큰 잘못/만료면 401

const { verify } = require("../utils/jwt");
const { createError } = require("./errorHandler");

// 토큰 검증 후 req.user 주입. 실패하면 401
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(createError(401, "UNAUTHORIZED", "Authentication required."));
  }
  try {
    req.user = verify(header.slice(7)); // 'Bearer ' 떼고
    next();
  } catch (err) {
    next(createError(401, "INVALID_TOKEN", "Invalid token."));
  }
}

module.exports = { auth };
