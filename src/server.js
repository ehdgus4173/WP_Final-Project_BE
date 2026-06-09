// 프로세스 진입점. env 검증(require 시점) → HTTP 서버 시작 → graceful shutdown 연결
// 종료 시 처리 중인 요청 끝나고 풀 닫게 함

const env = require("./config/env");
const app = require("./app");
const db = require("./db");

const server = app.listen(env.PORT, () => {
  console.log(
    `[server] What's Today BE swagger docs : http://localhost:${env.PORT}/api/docs (${env.NODE_ENV})`,
  );
});

// 종료 시그널 받으면 서버 닫고 DB 풀 정리 후 프로세스 종료
async function shutdown(signal) {
  console.log(`[server] ${signal} received — shutting down`);
  server.close(async () => {
    try {
      await db.close();
      console.log("[server] closed cleanly");
      process.exit(0);
    } catch (err) {
      console.error("[server] shutdown error:", err);
      process.exit(1);
    }
  });

  // 정리 안 끝나고 멈춰있으면 10초 뒤 강제 종료
  setTimeout(() => {
    console.error("[server] forced exit after 10s");
    process.exit(1);
  }, 10_000).unref();
}

// 종료 시그널 + 안 잡힌 Promise 거부 핸들러
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("[server] unhandledRejection:", reason);
});
