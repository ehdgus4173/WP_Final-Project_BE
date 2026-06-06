// src/routes/index.js — Mounts all domain routers under /api.
//
// Domain routers are added incrementally as endpoints land.

const express = require("express");
const healthRoutes = require("./health.routes");
const { postRouter, issuePostRouter } = require("./post.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/auth", require("./auth.routes"));
router.use("/home", require("./home.routes"));
router.use("/posts", postRouter);
router.use("/issues", issuePostRouter); // POST /api/issues/:id/posts (게시물 작성)

// TODO: mount as implemented —
// router.use('/issues', require('./issue.routes'));   // 이슈 상세 (이슈 담당) — /issues에 함께 마운트 가능
// router.use('/comments', require('./comment.routes'));
// router.use('/cron', require('./cron.routes'));

module.exports = router;
