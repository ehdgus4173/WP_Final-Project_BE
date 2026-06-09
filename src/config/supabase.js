// OAuth 토큰 검증 전용 Supabase 클라이언트
// 소셜 로그인은 하이브리드: Supabase Auth는 OAuth 신원만 확인, 세션 토큰은 우리 JWT(utils/jwt)
// 여기선 오직 supabase.auth.getUser(accessToken)로 프론트가 받아온 단명 access_token만 검증. 세션 저장 안 함
// SUPABASE_URL/ANON_KEY는 부팅 땐 선택값(크론처럼). 없으면 OAuth 라우트에서 명확히 실패

const { createClient } = require("@supabase/supabase-js");
const env = require("../config/env");
const { createError } = require("../middleware/errorHandler");

let client = null; // lazy 싱글턴

// 클라이언트 lazy 생성. env 없으면 503 던짐
function getSupabase() {
  if (client) return client;
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw createError(
      503,
      "OAUTH_NOT_CONFIGURED",
      "Social login is not configured.",
    );
  }
  // 세션 유지 안 함 — getUser()에 토큰 직접 넘겨서만 씀
  client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

module.exports = { getSupabase };
