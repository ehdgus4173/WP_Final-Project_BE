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
router.use("/issues", issuePostRouter); // POST /api/issues/:id/posts (create post)

// TODO: mount as implemented —
// router.use('/issues', require('./issue.routes'));   // issue detail (issues domain) — can also mount at /issues
// router.use('/comments', require('./comment.routes'));
// router.use('/cron', require('./cron.routes'));

module.exports = router;
