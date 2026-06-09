// bcrypt 해싱 헬퍼. cost 10
// 평문 비번은 이 모듈 밖으로 안 나가고 로그도 안 남김. 길이/형식 검증은 register 밸리데이터가 함

const bcrypt = require("bcrypt");

const COST = 10;

// 평문 → 해시
function hash(plain) {
  return bcrypt.hash(plain, COST);
}

// 평문 vs 저장된 해시 비교
function compare(plain, passwordHash) {
  return bcrypt.compare(plain, passwordHash);
}

module.exports = { hash, compare };
