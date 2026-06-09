// 시작 시 환경변수 한 번 로드+검증
// 필수값 없으면 부팅 때 throw → 나중에 조용히 500 나는 거 방지. 지금 코드가 실제 쓰는 것만 둠

const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// 필수 env. 없거나 빈 값이면 throw
function required(name) {
  const v = process.env[name];
  if (v === undefined || v === "") {
    throw new Error(`[env] Missing required environment variable: ${name}`);
  }
  return v;
}

// 선택 env. 없으면 fallback
function optional(name, fallback) {
  const v = process.env[name];
  return v === undefined || v === "" ? fallback : v;
}

const NODE_ENV = optional("NODE_ENV", "development");
const isTest = NODE_ENV === "test";

const env = {
  NODE_ENV,
  PORT: Number(optional("PORT", "3000")),

  // 테스트(NODE_ENV=test)에선 DB/시크릿 선택값 처리 → DB 없이 CI에서 app/util 단위테스트 돌게
  DATABASE_URL: isTest
    ? optional("DATABASE_URL", "")
    : required("DATABASE_URL"),

  JWT_SECRET: isTest
    ? optional("JWT_SECRET", "test-secret-not-for-prod")
    : required("JWT_SECRET"),
  JWT_EXPIRES_IN: optional("JWT_EXPIRES_IN", "24h"), // Tech-Spec §5.1 TTL 24h

  FE_ORIGIN: optional("FE_ORIGIN", "http://localhost:5500")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  // AI 크론용. /api/cron/generate-issues 돌 때만 필요. 부팅 땐 선택값, 없으면 크론 경로에서 명확히 실패
  GEMINI_API_KEY: optional("GEMINI_API_KEY", ""),
  CRON_SECRET: optional("CRON_SECRET", ""),

  // 소셜 로그인(OAuth)용. /api/auth/oauth*에서만 필요. 없으면 config/supabase.js가 503으로 막음
  SUPABASE_URL: optional("SUPABASE_URL", ""),
  SUPABASE_ANON_KEY: optional("SUPABASE_ANON_KEY", ""),
};

env.isProd = NODE_ENV === "production";
env.isDev = NODE_ENV === "development";
env.isTest = isTest;

module.exports = env;
