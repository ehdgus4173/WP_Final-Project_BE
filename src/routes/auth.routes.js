// src/routes/auth.routes.js — /api/auth routes.
//
//   POST /register        (validate)              회원가입 (role 입력 차단)
//   POST /login           (rateLimit + validate)  로그인 → { token, user }
//   GET  /me              (auth)                   내 정보
//   POST /oauth           (validate)  소셜 로그인 1단계: 신원확인 → { token } | { needs_username }
//   POST /oauth/register  (validate)  소셜 로그인 2단계: username 입력 후 가입 → { token, user }

const express = require("express");
const { body } = require("express-validator");

const authController = require("../controllers/authController");
const { validate } = require("../middleware/validate");
const { auth } = require("../middleware/auth");
const { loginLimiter } = require("../middleware/rateLimit");

const router = express.Router();

const registerValidators = [
  body("email").isEmail().withMessage("Invalid email address."),
  body("username")
    .matches(/^[A-Za-z0-9_]{3,20}$/)
    .withMessage("Username must be 3-20 characters: letters, digits, or underscore."),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters.")
    .matches(/[A-Za-z]/)
    .withMessage("Password must contain a letter.")
    .matches(/\d/)
    .withMessage("Password must contain a digit."),
  //  role must never be supplied via the API.
  body("role").not().exists().withMessage("role cannot be specified."),
];

const loginValidators = [
  body("email").isEmail().withMessage("Invalid email address."),
  body("password").notEmpty().withMessage("Password is required."),
];

const oauthValidators = [
  body("access_token").notEmpty().withMessage("access_token is required."),
];

// Step 2 reuses the same username rule as register.
const oauthRegisterValidators = [
  body("access_token").notEmpty().withMessage("access_token is required."),
  body("username")
    .matches(/^[A-Za-z0-9_]{3,20}$/)
    .withMessage("Username must be 3-20 characters: letters, digits, or underscore."),
];

router.post("/register", registerValidators, validate, authController.register);
router.post(
  "/login",
  loginLimiter,
  loginValidators,
  validate,
  authController.login,
);
router.get("/me", auth, authController.me);

// Social login (OAuth) — 2-step. See flow in 작업계획서 v2.0.
router.post("/oauth", oauthValidators, validate, authController.oauthIdentify);
router.post(
  "/oauth/register",
  oauthRegisterValidators,
  validate,
  authController.oauthRegister,
);

module.exports = router;
