// JWT 발급/검증
// payload: { sub, username, role } + iat/exp. sub은 user id이고 canMutate() 비교 키로 씀

const jwt = require("jsonwebtoken");
const env = require("../config/env");

// claims로 토큰 발급. HS256, 만료는 env.JWT_EXPIRES_IN
function sign(claims) {
  return jwt.sign(claims, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

// 디코딩된 payload 반환. 만료/위변조/시크릿 불일치면 throw
function verify(token) {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
}

module.exports = { sign, verify };
