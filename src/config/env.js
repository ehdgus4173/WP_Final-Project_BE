// src/config/env.js — Loads and validates environment variables once at startup.
//
// Required vars throw at boot so misconfiguration fails loud instead of
// silently 500-ing later. Only what the current code actually uses is listed;
// JWT / Gemini / cron vars are added when those features land.

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(name) {
  const v = process.env[name];
  if (v === undefined || v === '') {
    throw new Error(`[env] Missing required environment variable: ${name}`);
  }
  return v;
}

function optional(name, fallback) {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : v;
}

const NODE_ENV = optional('NODE_ENV', 'development');
const isTest = NODE_ENV === 'test';

const env = {
  NODE_ENV,
  PORT: Number(optional('PORT', '3000')),

  // Under test (Jest sets NODE_ENV=test) the DB is optional so the app can
  // boot in CI without a database — liveness checks don't touch Postgres.
  DATABASE_URL: isTest ? optional('DATABASE_URL', '') : required('DATABASE_URL'),

  FE_ORIGIN: optional('FE_ORIGIN', 'http://localhost:5500')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

env.isProd = NODE_ENV === 'production';
env.isDev = NODE_ENV === 'development';
env.isTest = isTest;

module.exports = env;
