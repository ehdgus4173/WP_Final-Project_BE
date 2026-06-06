// src/services/authService.js — auth domain rules (transactions/validation).
//
// register / verifyCredentials / getMe. Passwords are bcrypt-hashed; the role
// is never accepted from input (DB DEFAULT 'user') to prevent escalation.

const userRepo = require("../repositories/userRepo");
const password = require("../utils/password");
const { createError } = require("../middleware/errorHandler");

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
  // Same error for unknown email and wrong password (no user enumeration).
  if (!user || !(await password.compare(plain, user.password_hash))) {
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

module.exports = { register, verifyCredentials, getMe };
