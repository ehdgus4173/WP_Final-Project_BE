// express-validator 결과 처리기
// 라우트의 검증 체인 뒤에 둠. 실패 모으면 400 BAD_INPUT(필드별 상세) 응답, 통과면 next

const { validationResult } = require("express-validator");
const { createError } = require("./errorHandler");

// 검증 에러 있으면 필드별로 정리해서 400, 없으면 통과
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result
    .array()
    .map((e) => ({ field: e.path, message: e.msg }));
  next(createError(400, "BAD_INPUT", "Invalid input.", details));
}

module.exports = { validate };
