// 공개 유저 프로필 (읽기 전용)
// 마이페이지에서 남 볼 때 씀. authService 재사용(getMe는 description 포함 공개 row, getMyPosts는 최근 글)

const authService = require("../services/authService");

// GET /users/:id — 아무 유저의 공개 프로필
async function getProfile(req, res, next) {
  try {
    const user = await authService.getMe(req.params.id);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

// GET /users/:id/posts — 그 유저의 최근 글
async function getUserPosts(req, res, next) {
  try {
    const posts = await authService.getMyPosts(req.params.id, req.query.limit);
    res.json({ success: true, data: { posts } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, getUserPosts };
