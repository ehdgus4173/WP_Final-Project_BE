// src/db.js — pg connection pool singleton.
//
// Use `db.query(...)` for one-shot queries. For multi-statement transactions,
// `db.getClient()` checks out a dedicated client — caller MUST release().

const { Pool } = require('pg');
const env = require('./config/env');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (err) => {
  // Fired on idle clients — log so we notice if Supabase drops connections.
  console.error('[db] idle client error:', err);
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  if (env.isDev) {
    const ms = Date.now() - start;
    const preview = text.replace(/\s+/g, ' ').slice(0, 80);
    console.log(`[db] ${ms}ms rows=${res.rowCount ?? 0} :: ${preview}`);
  }
  return res;
}

async function getClient() {
  return pool.connect();
}

async function close() {
  await pool.end();
}

module.exports = { pool, query, getClient, close };
