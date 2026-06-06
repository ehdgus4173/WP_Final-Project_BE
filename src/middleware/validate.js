// src/middleware/validate.js — express-validator result handler.
//
// Place after a route's validation chain. Collects any failures into a 400
// BAD_INPUT response with field-level details; passes through otherwise.

const { validationResult } = require("express-validator");
const { createError } = require("./errorHandler");

function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result
    .array()
    .map((e) => ({ field: e.path, message: e.msg }));
  next(createError(400, "BAD_INPUT", "입력값이 올바르지 않습니다.", details));
}

module.exports = { validate };
