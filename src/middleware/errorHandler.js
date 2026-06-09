// 에러 응답 포맷 중앙화
// 컨트롤러가 next(err)/throw 하면 여기서 공통 봉투로 변환
//   { success: false, error: { code, message, details? } }

const env = require('../config/env');

// 인자 4개라 Express가 에러 핸들링 미들웨어로 인식함
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || (status === 500 ? 'INTERNAL_ERROR' : 'ERROR');
  const message = err.message || 'Unexpected error';

  // 5xx만 서버 로그에 찍음
  if (status >= 500) {
    console.error('[error]', err);
  }

  const body = {
    success: false,
    error: { code, message },
  };

  if (err.details) body.error.details = err.details;
  // 개발 환경 5xx면 디버깅용으로 스택 같이 내려줌
  if (env.isDev && status >= 500) body.error.stack = err.stack;

  res.status(status).json(body);
}

// 컨트롤러 편의용: throw createError(400, 'BAD_INPUT', 'msg')
function createError(status, code, message, details) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  if (details) err.details = details;
  return err;
}

module.exports = { errorHandler, createError };
