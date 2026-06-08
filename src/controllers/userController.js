// src/controllers/userController.js — public user profile (read-only).
//
// Used by MyPage when viewing someone else. Reuses authService (getMe returns
// the public row incl. description; getMyPosts fetches recent posts by user id).

const authService = require("../services/authService");

// GET /users/:id — public profile of any user.
async function getProfile(req, res, next) {
  try {
    const user = await authService.getMe(req.params.id);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

// GET /users/:id/posts — that user's recent posts.
async function getUserPosts(req, res, next) {
  try {
    const posts = await authService.getMyPosts(req.params.id, req.query.limit);
    res.json({ success: true, data: { posts } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, getUserPosts };
