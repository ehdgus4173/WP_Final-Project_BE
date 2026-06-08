// src/repositories/userRepo.js — users table access (raw parameterized SQL).
//
// All SELECTs include `role` (Tech-Spec §5.3). password_hash is returned only
// by findByEmail (used for login verification) and never exposed elsewhere.

const db = require("../db");

const PUBLIC_COLS = "id, email, username, role, description, created_at";

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

// Update editable profile fields (username, description). Email is read-only.
// Only provided fields change; the rest keep their current value via COALESCE.
async function updateProfile(id, { username, description }) {
  const { rows } = await db.query(
    `UPDATE users
        SET username    = COALESCE($2, username),
            description = COALESCE($3, description)
      WHERE id = $1
      RETURNING ${PUBLIC_COLS}`,
    [id, username ?? null, description ?? null],
  );
  return rows[0] || null;
}

// --- Social login (OAuth) ---------------------------------------------------

// Look up an account by its provider identity (provider + Supabase user.id).
async function findByProviderId(provider, providerId) {
  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLS} FROM users WHERE provider = $1 AND provider_id = $2`,
    [provider, providerId],
  );
  return rows[0] || null;
}

// Create an OAuth account: no password_hash (NULL), role omitted (DB DEFAULT
// 'user' — same escalation defense as create()).
async function createOAuth({ email, username, provider, provider_id }) {
  const { rows } = await db.query(
    `INSERT INTO users (email, username, provider, provider_id)
     VALUES ($1, $2, $3, $4)
     RETURNING ${PUBLIC_COLS}`,
    [email, username, provider, provider_id],
  );
  return rows[0];
}

// Link a provider identity onto an existing (email-matched) account so the same
// person doesn't get a duplicate row. Returns the updated public row.
async function linkProvider(userId, provider, provider_id) {
  const { rows } = await db.query(
    `UPDATE users SET provider = $2, provider_id = $3
     WHERE id = $1
     RETURNING ${PUBLIC_COLS}`,
    [userId, provider, provider_id],
  );
  return rows[0] || null;
}

module.exports = {
  findByEmail,
  findByUsername,
  findById,
  create,
  updateProfile,
  findByProviderId,
  createOAuth,
  linkProvider,
};
