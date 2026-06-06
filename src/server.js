// src/server.js — Process entry point.
//
// Validates env (via require), starts the HTTP server, and wires graceful
// shutdown so in-flight requests can finish before the pool closes.

const env = require('./config/env');
const app = require('./app');
const db = require('./db');

const server = app.listen(env.PORT, () => {
  console.log(`[server] What's Today BE listening on :${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown(signal) {
  console.log(`[server] ${signal} received — shutting down`);
  server.close(async () => {
    try {
      await db.close();
      console.log('[server] closed cleanly');
      process.exit(0);
    } catch (err) {
      console.error('[server] shutdown error:', err);
      process.exit(1);
    }
  });

  // Hard exit if cleanup hangs.
  setTimeout(() => {
    console.error('[server] forced exit after 10s');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('[server] unhandledRejection:', reason);
});
