// src/routes/home.routes.js — /api/home route.
//
//   GET /   오늘 이슈 1건 + 과거 이슈 최근 10건 (비로그인 가능)

const express = require('express');
const homeController = require('../controllers/homeController');

const router = express.Router();

router.get('/', homeController.getHome);

module.exports = router;
