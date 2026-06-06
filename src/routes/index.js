// src/routes/index.js — Mounts all domain routers under /api.
//
// Domain routers are added incrementally as endpoints land.

const express = require('express');
const healthRoutes = require('./health.routes');

const router = express.Router();

router.use('/health', healthRoutes);

// TODO: mount as implemented —
// router.use('/auth', require('./auth.routes'));
// router.use('/home', require('./home.routes'));
// router.use('/issues', require('./issue.routes'));
// router.use('/posts', require('./post.routes'));
// router.use('/comments', require('./comment.routes'));
// router.use('/cron', require('./cron.routes'));

module.exports = router;
