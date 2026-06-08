// src/config/supabase.js — Supabase client for OAuth token verification ONLY.
//
// Social login is hybrid: Supabase Auth verifies the OAuth identity, but our
// own JWT (utils/jwt) remains the session token. This client is used solely for
// `supabase.auth.getUser(accessToken)` to validate the short-lived Supabase
// access_token the frontend obtained via OAuth — never for session storage.
//
// SUPABASE_URL / SUPABASE_ANON_KEY are optional at boot (like the cron vars);
// the OAuth routes fail clearly here if they're missing.

const { createClient } = require("@supabase/supabase-js");
const env = require("../config/env");
const { createError } = require("../middleware/errorHandler");

let client = null; // lazy singleton

function getSupabase() {
  if (client) return client;
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw createError(
      503,
      "OAUTH_NOT_CONFIGURED",
      "Social login is not configured.",
    );
  }
  // No session persistence — we only call getUser() with an explicit token.
  client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

module.exports = { getSupabase };
