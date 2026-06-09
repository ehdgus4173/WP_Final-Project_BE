// Express 앱 조립부. listen 없이 export → 테스트에서 Supertest로 마운트 가능
// 실제 포트 바인딩은 server.js가 함

const express = require('express');
const cors = require('cors');

const env = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// Render 프록시 뒤라 첫 홉 신뢰해야 req.ip 제대로 잡힘
app.set('trust proxy', 1);

// 핵심 미들웨어
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// JWT는 Authorization: Bearer로만 옴. 쿠키 안 써서 cookie-parser/credentials 불필요
app.use(
  cors({
    origin(origin, cb) {
      // Origin 없으면(curl/Postman/서버간) 통과
      if (!origin) return cb(null, true);
      if (env.FE_ORIGIN.includes(origin)) return cb(null, true);
      // 허용 안 된 origin이라도 throw 안 함 (동일출처 POST도 Origin 붙어서 500 남)
      // CORS 헤더만 빼면 동일출처는 동작, 교차출처는 브라우저가 알아서 막음
      return cb(null, false);
    },
  }),
);

// 라우트
app.use('/api', routes);

// 404 폴백
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `No route: ${req.method} ${req.path}` },
  });
});

// 에러 핸들러는 무조건 마지막
app.use(errorHandler);

module.exports = app;
