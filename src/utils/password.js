// src/utils/password.js — bcrypt hashing helpers.
//
// cost 10 (Tech-Spec §1). Plaintext passwords never leave this module and are
// never logged. App-level rule: password >= 8 chars with a letter + digit
// (enforced by the register validator, not here).

const bcrypt = require("bcrypt");

const COST = 10;

function hash(plain) {
  return bcrypt.hash(plain, COST);
}

function compare(plain, passwordHash) {
  return bcrypt.compare(plain, passwordHash);
}

module.exports = { hash, compare };
