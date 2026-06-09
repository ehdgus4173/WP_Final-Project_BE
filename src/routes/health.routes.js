// /api/health 라우트 (헬스 체크)
//
//   GET  /     프로세스 liveness (앱 살아있으면 200)
//   GET  /db   Postgres에 SELECT 1 ping; 실패 시 503

const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, data: { status: 'up', uptime: process.uptime() } });
});

router.get('/db', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT 1 AS ok');
    res.json({ success: true, data: { db: rows[0].ok === 1 ? 'up' : 'unknown' } });
  } catch (err) {
    err.status = 503;
    err.code = 'DB_UNAVAILABLE';
    next(err);
  }
});

module.exports = router;
