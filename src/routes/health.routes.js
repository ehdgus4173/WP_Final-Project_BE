// src/routes/health.routes.js — Lightweight health probes.
//
// GET /api/health      — process liveness (200 if the app is up)
// GET /api/health/db   — pings Postgres with `SELECT 1`; 503 on failure

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
