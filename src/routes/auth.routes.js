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
  body("email").isEmail().withMessage("유효한 이메일이 아닙니다."),
  body("username")
    .matches(/^[A-Za-z0-9_]{3,20}$/)
    .withMessage("사용자명은 3~20자의 영문·숫자·_ 만 허용됩니다."),
  body("password")
    .isLength({ min: 8 })
    .withMessage("비밀번호는 최소 8자입니다.")
    .matches(/[A-Za-z]/)
    .withMessage("비밀번호에 영문이 포함되어야 합니다.")
    .matches(/\d/)
    .withMessage("비밀번호에 숫자가 포함되어야 합니다."),
  //  role must never be supplied via the API.
  body("role").not().exists().withMessage("role은 지정할 수 없습니다."),
];

const loginValidators = [
  body("email").isEmail().withMessage("유효한 이메일이 아닙니다."),
  body("password").notEmpty().withMessage("비밀번호를 입력하세요."),
];

const oauthValidators = [
  body("access_token").notEmpty().withMessage("access_token이 필요합니다."),
];

// Profile update (PATCH /me): username/description optional; email is read-only.
const updateMeValidators = [
  body("username")
    .optional()
    .matches(/^[A-Za-z0-9_]{3,20}$/)
    .withMessage("사용자명은 3~20자의 영문·숫자·_ 만 허용됩니다."),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("자기소개는 최대 500자입니다."),
  // email/role must never be changed via this endpoint.
  body("email").not().exists().withMessage("이메일은 변경할 수 없습니다."),
  body("role").not().exists().withMessage("role은 변경할 수 없습니다."),
];

// Step 2 reuses the same username rule as register.
const oauthRegisterValidators = [
  body("access_token").notEmpty().withMessage("access_token이 필요합니다."),
  body("username")
    .matches(/^[A-Za-z0-9_]{3,20}$/)
    .withMessage("사용자명은 3~20자의 영문·숫자·_ 만 허용됩니다."),
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
router.patch("/me", auth, updateMeValidators, validate, authController.updateMe);
router.get("/me/posts", auth, authController.myPosts);

// Social login (OAuth) — 2-step. See flow in 작업계획서 v2.0.
router.post("/oauth", oauthValidators, validate, authController.oauthIdentify);
router.post(
  "/oauth/register",
  oauthRegisterValidators,
  validate,
  authController.oauthRegister,
);

module.exports = router;
