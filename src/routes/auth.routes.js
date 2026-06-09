// /api/auth 라우트
//
//   POST  /register        (validate)              회원가입 (role 입력 차단)
//   POST  /login           (rateLimit + validate)  로그인 → { token, user }
//   GET   /me              (auth)                   내 정보
//   PATCH /me              (auth + validate)        프로필 수정 (username/description; email·role 불가)
//   GET   /me/posts        (auth)                   내가 쓴 게시물 목록
//   POST  /oauth           (validate)  소셜 로그인 1단계: 신원확인 → { token } | { needs_username }
//   POST  /oauth/register  (validate)  소셜 로그인 2단계: username 입력 후 가입 → { token, user }

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
  // role은 API로 절대 받으면 안 됨
  body("role").not().exists().withMessage("role cannot be specified."),
];

const loginValidators = [
  body("email").isEmail().withMessage("Invalid email address."),
  body("password").notEmpty().withMessage("Password is required."),
];

const oauthValidators = [
  body("access_token").notEmpty().withMessage("access_token is required."),
];

// 프로필 수정(PATCH /me): username/description 선택, 이메일은 읽기전용
const updateMeValidators = [
  body("username")
    .optional()
    .matches(/^[A-Za-z0-9_]{3,20}$/)
    .withMessage("사용자명은 3~20자의 영문·숫자·_ 만 허용됩니다."),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("자기소개는 최대 500자입니다."),
  // email/role은 이 엔드포인트로 절대 변경 불가
  body("email").not().exists().withMessage("이메일은 변경할 수 없습니다."),
  body("role").not().exists().withMessage("role은 변경할 수 없습니다."),
];

// 2단계는 register와 같은 username 규칙 재사용
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
router.patch("/me", auth, updateMeValidators, validate, authController.updateMe);
router.get("/me/posts", auth, authController.myPosts);

// 소셜 로그인(OAuth) — 2단계. 흐름은 작업계획서 v2.0 참고
router.post("/oauth", oauthValidators, validate, authController.oauthIdentify);
router.post(
  "/oauth/register",
  oauthRegisterValidators,
  validate,
  authController.oauthRegister,
);

module.exports = router;
