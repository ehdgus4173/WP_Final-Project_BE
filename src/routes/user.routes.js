// src/routes/user.routes.js — /api/users public read-only profile routes.
//
//   GET /users/:id        public profile (id, username, email, description, …)
//   GET /users/:id/posts  that user's recent posts
//
// Public (no auth): anyone can view a user's MyPage. The id is constrained to
// digits so non-numeric paths fall through to 404 instead of a DB type error.

const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

router.get("/:id(\\d+)", userController.getProfile);
router.get("/:id(\\d+)/posts", userController.getUserPosts);

module.exports = router;
