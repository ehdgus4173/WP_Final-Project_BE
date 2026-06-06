// src/config/env.js — Loads and validates environment variables once at startup.
//
// Required vars throw at boot so misconfiguration fails loud instead of
// silently 500-ing later. Only what the current code actually uses is listed;
// Gemini / cron vars are added when those features land.

const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function required(name) {
  const v = process.env[name];
  if (v === undefined || v === "") {
    throw new Error(`[env] Missing required environment variable: ${name}`);
  }
  return v;
}

function optional(name, fallback) {
  const v = process.env[name];
  return v === undefined || v === "" ? fallback : v;
}

const NODE_ENV = optional("NODE_ENV", "development");
const isTest = NODE_ENV === "test";

const env = {
  NODE_ENV,
  PORT: Number(optional("PORT", "3000")),

  // Under test (Jest sets NODE_ENV=test) DB/secret are optional so the app and
  // util unit tests can run in CI without a database — only what's exercised.
  DATABASE_URL: isTest
    ? optional("DATABASE_URL", "")
    : required("DATABASE_URL"),

  JWT_SECRET: isTest
    ? optional("JWT_SECRET", "test-secret-not-for-prod")
    : required("JWT_SECRET"),
  JWT_EXPIRES_IN: optional("JWT_EXPIRES_IN", "24h"), // Tech-Spec §5.1 TTL 24h

  FE_ORIGIN: optional("FE_ORIGIN", "http://localhost:5500")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

env.isProd = NODE_ENV === "production";
env.isDev = NODE_ENV === "development";
env.isTest = isTest;

module.exports = env;
