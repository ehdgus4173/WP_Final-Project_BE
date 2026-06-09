// 선택 JWT 인증
// 유효한 Bearer 토큰 있으면 req.user 채우고, 없으면 에러 없이 익명으로 통과
// 로그인 시 개인화되는 공개 읽기에 씀 (예: GET /posts/:id의 user_vote / liked_by_me)

const { verify } = require('../utils/jwt');

// 토큰 있으면 디코딩, 없거나 깨졌으면 그냥 익명 처리
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = verify(header.slice(7)); // 'Bearer ' 떼고
    } catch (err) {
      // 토큰 잘못/만료 → 익명 취급 (throw 안 함)
    }
  }
  next();
}

module.exports = { optionalAuth };
