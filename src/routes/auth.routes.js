// src/routes/auth.routes.js — /api/auth routes.
//
//   POST /register  (validate)              회원가입 (role 입력 차단)
//   POST /login     (rateLimit + validate)  로그인 → { token, user }
//   GET  /me        (auth)                   내 정보

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

router.post("/register", registerValidators, validate, authController.register);
router.post(
  "/login",
  loginLimiter,
  loginValidators,
  validate,
  authController.login,
);
router.get("/me", auth, authController.me);

module.exports = router;
