// /api/users 공개 읽기 전용 프로필 라우트
//
//   GET  /:id        공개 프로필 (id, username, email, description, …)
//   GET  /:id/posts  해당 유저의 최근 게시물
//
// 인증 불필(공개): 누구나 유저 마이페이지 조회 가능. id는 숫자로 제한해
// 비숫자 경로는 DB 타입 에러 대신 404로 빠짐.

const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

router.get("/:id(\\d+)", userController.getProfile);
router.get("/:id(\\d+)/posts", userController.getUserPosts);

module.exports = router;
