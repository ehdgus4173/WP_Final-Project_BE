// src/middleware/errorHandler.js — Centralized error response formatter.
//
// Controllers `next(err)` or throw; this middleware translates the error into
// the project's common envelope (Tech-Spec v3.3 §4.2):
//   { success: false, error: { code, message, details? } }

const env = require('../config/env');

// 4-arg signature — Express recognises this as error-handling middleware.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || (status === 500 ? 'INTERNAL_ERROR' : 'ERROR');
  const message = err.message || 'Unexpected error';

  if (status >= 500) {
    console.error('[error]', err);
  }

  const body = {
    success: false,
    error: { code, message },
  };

  if (err.details) body.error.details = err.details;
  if (env.isDev && status >= 500) body.error.stack = err.stack;

  res.status(status).json(body);
}

// Convenience for controllers: throw createError(400, 'BAD_INPUT', 'msg').
function createError(status, code, message, details) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  if (details) err.details = details;
  return err;
}

module.exports = { errorHandler, createError };
