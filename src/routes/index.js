// src/routes/index.js — Mounts all domain routers under /api.
//
// Domain routers are added incrementally as endpoints land.

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const healthRoutes = require("./health.routes");
const { postRouter, issuePostRouter } = require("./post.routes");
const { swaggerDocument } = require("../config/swagger");

const router = express.Router();

// API docs (OpenAPI 3.0) at /api/docs
router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

router.use("/health", healthRoutes);
router.use("/auth", require("./auth.routes"));
router.use("/home", require("./home.routes"));
router.use("/posts", postRouter);
router.use("/issues", issuePostRouter); // POST /api/issues/:id/posts (create post)
router.use("/cron", require("./cron.routes"));
router.use("/admin", require("./admin.routes"));

// TODO: mount as implemented —
// router.use('/issues', require('./issue.routes'));   // issue detail (issues domain) — can also mount at /issues
// router.use('/comments', require('./comment.routes'));

module.exports = router;
