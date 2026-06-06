// src/app.js — Express application assembly.
//
// Exported without `listen` so tests can mount it with Supertest. server.js
// is what actually binds a port.

const express = require('express');
const cors = require('cors');

const env = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// Trust the first proxy hop — needed for correct req.ip behind Render.
app.set('trust proxy', 1);

// --- Core middleware ---
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// JWT travels in `Authorization: Bearer <token>` — no cookies, so no
// cookie-parser and no `credentials: true`.
app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / curl / Postman (no Origin header).
      if (!origin) return cb(null, true);
      if (env.FE_ORIGIN.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin not allowed — ${origin}`));
    },
  }),
);

// --- Routes ---
app.use('/api', routes);

// --- 404 fallback ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `No route: ${req.method} ${req.path}` },
  });
});

// --- Error handler (must be last) ---
app.use(errorHandler);

module.exports = app;
