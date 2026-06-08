// src/services/authService.js — auth domain rules (transactions/validation).
//
// register / verifyCredentials / getMe. Passwords are bcrypt-hashed; the role
// is never accepted from input (DB DEFAULT 'user') to prevent escalation.

const userRepo = require("../repositories/userRepo");
const password = require("../utils/password");
const { createError } = require("../middleware/errorHandler");
const { getSupabase } = require("../config/supabase");

async function register({ email, username, password: plain }) {
  if (await userRepo.findByEmail(email)) {
    throw createError(409, "EMAIL_TAKEN", "이미 사용 중인 이메일입니다.");
  }
  if (await userRepo.findByUsername(username)) {
    throw createError(409, "USERNAME_TAKEN", "이미 사용 중인 사용자명입니다.");
  }
  const password_hash = await password.hash(plain);
  // No role passed → DB DEFAULT 'user'.
  return userRepo.create({ email, username, password_hash });
}

async function verifyCredentials({ email, password: plain }) {
  const user = await userRepo.findByEmail(email);
  // `!user.password_hash` guard added for social login: OAuth accounts have a
  // NULL password_hash, and bcrypt.compare(plain, null) throws (→ 500). Treat
  // them as a normal credential failure (401) so OAuth users can't local-login.
  if (
    !user ||
    !user.password_hash ||
    !(await password.compare(plain, user.password_hash))
  ) {
    // Same error for unknown email and wrong password (no user enumeration).
    throw createError(
      401,
      "INVALID_CREDENTIALS",
      "이메일 또는 비밀번호가 올바르지 않습니다.",
    );
  }
  delete user.password_hash;
  return user;
}

async function getMe(userId) {
  const user = await userRepo.findById(userId);
  if (!user)
    throw createError(404, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다.");
  return user;
}

// --- Social login (OAuth) ---------------------------------------------------
//
// Hybrid flow: Supabase verifies the OAuth identity, we issue our own JWT.
// Two steps so new users can pick their own username (our app's rules), instead
// of auto-generating one:
//   1) oauthIdentify — verify token; return the existing user, or signal that a
//      username is needed for a brand-new account.
//   2) oauthRegister — verify token AGAIN, then create the account with the
//      user-chosen username.
// The frontend-sent email/name is never trusted; only the verified token's
// claims are used (in BOTH steps).

// Verify a Supabase access_token and extract the trusted identity claims.
async function resolveOAuthIdentity(accessToken) {
  const supabase = getSupabase(); // 503 if OAuth not configured
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data?.user) {
    throw createError(401, "INVALID_OAUTH_TOKEN", "유효하지 않은 OAuth 토큰입니다.");
  }
  const { user } = data;
  const email = user.email;
  // provider e.g. 'google' | 'github'; provider_id is the stable Supabase user id.
  const provider = user.app_metadata?.provider || "oauth";
  const provider_id = user.id;
  if (!email) {
    // e.g. GitHub account with a private/primary email hidden.
    throw createError(401, "OAUTH_EMAIL_REQUIRED", "이메일을 제공하지 않는 계정입니다.");
  }
  return { email, provider, provider_id };
}

// Step 1: identify. Returns { user } for an existing account, or
// { needsUsername: true } for a brand-new account (nothing created yet).
async function oauthIdentify({ accessToken }) {
  const { email, provider, provider_id } =
    await resolveOAuthIdentity(accessToken);

  const existing = await userRepo.findByProviderId(provider, provider_id);
  if (existing) return { user: existing };

  // No provider match → link by email if a (local) account already owns it.
  const byEmail = await userRepo.findByEmail(email);
  if (byEmail) {
    const linked = await userRepo.linkProvider(byEmail.id, provider, provider_id);
    delete linked.password_hash; // findByEmail carries password_hash
    return { user: linked };
  }

  return { needsUsername: true };
}

// Step 2: register. Re-verifies the token (don't trust step 1 / the client),
// then creates the account with the user-chosen username.
async function oauthRegister({ accessToken, username }) {
  const { email, provider, provider_id } =
    await resolveOAuthIdentity(accessToken);

  // Race/replay guard: if the account already exists (provider or email), return
  // it instead of creating a duplicate.
  const existing = await userRepo.findByProviderId(provider, provider_id);
  if (existing) return { user: existing };
  const byEmail = await userRepo.findByEmail(email);
  if (byEmail) {
    const linked = await userRepo.linkProvider(byEmail.id, provider, provider_id);
    delete linked.password_hash;
    return { user: linked };
  }

  if (await userRepo.findByUsername(username)) {
    throw createError(409, "USERNAME_TAKEN", "이미 사용 중인 사용자명입니다.");
  }

  const user = await userRepo.createOAuth({ email, username, provider, provider_id });
  return { user };
}

module.exports = {
  register,
  verifyCredentials,
  getMe,
  oauthIdentify,
  oauthRegister,
};
