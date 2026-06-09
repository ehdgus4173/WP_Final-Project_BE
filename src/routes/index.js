// 모든 도메인 라우터를 /api 하위에 mount
// 엔드포인트 추가될 때마다 도메인 라우터 점진적으로 등록

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const healthRoutes = require("./health.routes");
const { postRouter, issuePostRouter } = require("./post.routes");
const { postCommentRouter, commentRouter } = require("./comment.routes");
const { swaggerDocument } = require("../config/swagger");

const router = express.Router();

// API 문서(OpenAPI 3.0) /api/docs
router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

router.use("/health", healthRoutes);
router.use("/auth", require("./auth.routes"));
router.use("/users", require("./user.routes")); // GET /api/users/:id (공개 프로필)
router.use("/home", require("./home.routes"));
router.use("/posts", postRouter);
router.use("/posts", postCommentRouter); // POST /api/posts/:id/comments (댓글/대댓글 작성)
router.use("/issues", issuePostRouter); // POST /api/issues/:id/posts (글 작성)
router.use("/issues", require("./issue.routes")); // GET /api/issues/:id (이슈 상세)
router.use("/comments", commentRouter); // DELETE /api/comments/:id (댓글 삭제)
router.use("/cron", require("./cron.routes"));
router.use("/admin", require("./admin.routes"));

module.exports = router;
