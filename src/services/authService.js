// 인증 도메인 규칙 (트랜잭션/검증)
// register / verifyCredentials / getMe. 비번은 bcrypt 해싱. role은 입력으로 절대 안 받음(DB DEFAULT 'user') → 권한 상승 방지

const userRepo = require("../repositories/userRepo");
const postRepo = require("../repositories/postRepo");
const password = require("../utils/password");
const { createError } = require("../middleware/errorHandler");
const { getSupabase } = require("../config/supabase");

// 회원가입. 이메일/username 중복 체크 후 비번 해싱해서 생성
async function register({ email, username, password: plain }) {
  if (await userRepo.findByEmail(email)) {
    throw createError(409, "EMAIL_TAKEN", "Email is already in use.");
  }
  if (await userRepo.findByUsername(username)) {
    throw createError(409, "USERNAME_TAKEN", "Username is already taken.");
  }
  const password_hash = await password.hash(plain);
  // role 안 넘김 → DB DEFAULT 'user'
  return userRepo.create({ email, username, password_hash });
}

// 로그인 자격 검증. 통과하면 password_hash 뺀 user 반환
async function verifyCredentials({ email, password: plain }) {
  const user = await userRepo.findByEmail(email);
  // !user.password_hash 가드는 소셜 로그인용: OAuth 계정은 password_hash가 NULL이라
  // bcrypt.compare(plain, null)이 throw(→500) 함. 일반 자격 실패(401)로 처리해서 OAuth 유저가 로컬 로그인 못 하게
  if (
    !user ||
    !user.password_hash ||
    !(await password.compare(plain, user.password_hash))
  ) {
    // 없는 이메일이든 틀린 비번이든 같은 에러 (유저 존재 노출 방지)
    throw createError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid email or password.",
    );
  }
  delete user.password_hash;
  return user;
}

// 내 정보(또는 특정 유저) 조회
async function getMe(userId) {
  const user = await userRepo.findById(userId);
  if (!user)
    throw createError(404, "USER_NOT_FOUND", "User not found.");
  return user;
}

// 프로필 수정(username, description). 이메일은 읽기전용이라 안 바뀜. username 유니크 체크함
async function updateProfile(userId, { username, description }) {
  if (username !== undefined) {
    const existing = await userRepo.findByUsername(username);
    if (existing && String(existing.id) !== String(userId)) {
      throw createError(409, "USERNAME_TAKEN", "이미 사용 중인 사용자명입니다.");
    }
  }
  const user = await userRepo.updateProfile(userId, { username, description });
  if (!user)
    throw createError(404, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다.");
  return user;
}

// 그 유저가 쓴 최근 글 (마이페이지용). limit은 1~20로 제한
async function getMyPosts(userId, limit) {
  const n = Math.min(Math.max(parseInt(limit, 10) || 3, 1), 20);
  return postRepo.findRecentByUser(userId, n);
}

// 소셜 로그인(OAuth)
// 하이브리드 흐름: Supabase가 OAuth 신원 검증, JWT는 우리가 발급
// 2단계로 나눈 이유는 신규 유저가 username을 직접 고르게 하려고(자동 생성 안 함):
//   1) oauthIdentify — 토큰 검증; 기존 유저 반환 or 신규면 username 필요 신호
//   2) oauthRegister — 토큰 또 검증 후 유저가 고른 username으로 계정 생성
// 프론트가 보낸 email/name은 절대 안 믿고, 두 단계 모두 검증된 토큰의 claim만 씀

// Supabase access_token 검증하고 믿을 수 있는 신원 claim 추출
async function resolveOAuthIdentity(accessToken) {
  const supabase = getSupabase(); // OAuth 설정 안 됐으면 503
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data?.user) {
    throw createError(401, "INVALID_OAUTH_TOKEN", "Invalid OAuth token.");
  }
  const { user } = data;
  const email = user.email;
  // provider 예: 'google' | 'github'; provider_id는 안정적인 Supabase user id
  const provider = user.app_metadata?.provider || "oauth";
  const provider_id = user.id;
  if (!email) {
    // 예: GitHub 계정이 이메일 비공개일 때
    throw createError(401, "OAUTH_EMAIL_REQUIRED", "This account does not provide an email address.");
  }
  return { email, provider, provider_id };
}

// 1단계: 신원 확인. 기존 계정이면 { user }, 신규면 { needsUsername: true }(아직 생성 안 함)
async function oauthIdentify({ accessToken }) {
  const { email, provider, provider_id } =
    await resolveOAuthIdentity(accessToken);

  const existing = await userRepo.findByProviderId(provider, provider_id);
  if (existing) return { user: existing };

  // provider 매칭 없으면 → 같은 이메일의 (로컬)계정 있으면 연결
  const byEmail = await userRepo.findByEmail(email);
  if (byEmail) {
    const linked = await userRepo.linkProvider(byEmail.id, provider, provider_id);
    delete linked.password_hash; // findByEmail은 password_hash 들고 옴
    return { user: linked };
  }

  return { needsUsername: true };
}

// 2단계: 가입. 토큰 재검증(1단계/클라 안 믿음) 후 유저가 고른 username으로 계정 생성
async function oauthRegister({ accessToken, username }) {
  const { email, provider, provider_id } =
    await resolveOAuthIdentity(accessToken);

  // 경쟁/재전송 가드: 계정 이미 있으면(provider든 email이든) 중복 생성 대신 그거 반환
  const existing = await userRepo.findByProviderId(provider, provider_id);
  if (existing) return { user: existing };
  const byEmail = await userRepo.findByEmail(email);
  if (byEmail) {
    const linked = await userRepo.linkProvider(byEmail.id, provider, provider_id);
    delete linked.password_hash;
    return { user: linked };
  }

  if (await userRepo.findByUsername(username)) {
    throw createError(409, "USERNAME_TAKEN", "Username is already taken.");
  }

  const user = await userRepo.createOAuth({ email, username, provider, provider_id });
  return { user };
}

module.exports = {
  register,
  verifyCredentials,
  getMe,
  updateProfile,
  getMyPosts,
  oauthIdentify,
  oauthRegister,
};
