// src/repositories/userRepo.js — users table access (raw parameterized SQL).
//
// All SELECTs include `role` (Tech-Spec §5.3). password_hash is returned only
// by findByEmail (used for login verification) and never exposed elsewhere.

const db = require("../db");

const PUBLIC_COLS = "id, email, username, role, created_at";

async function findByEmail(email) {
  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLS}, password_hash FROM users WHERE email = $1`,
    [email],
  );
  return rows[0] || null;
}

async function findByUsername(username) {
  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLS} FROM users WHERE username = $1`,
    [username],
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLS} FROM users WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

// role is intentionally omitted → DB DEFAULT 'user' (no escalation via API).
async function create({ email, username, password_hash }) {
  const { rows } = await db.query(
    `INSERT INTO users (email, username, password_hash)
     VALUES ($1, $2, $3)
     RETURNING ${PUBLIC_COLS}`,
    [email, username, password_hash],
  );
  return rows[0];
}

module.exports = { findByEmail, findByUsername, findById, create };
