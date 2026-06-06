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
      // No Origin header (curl/Postman/server-to-server) → allow.
      if (!origin) return cb(null, true);
      if (env.FE_ORIGIN.includes(origin)) return cb(null, true);
      // Disallowed origin: don't throw (that 500s same-origin POSTs, which the
      // browser still tags with an Origin header). Just omit the CORS headers —
      // same-origin requests still work; cross-origin ones the browser blocks.
      return cb(null, false);
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
