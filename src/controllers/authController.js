// 인증 HTTP 계층 (I/O만)
// 요청을 authService 호출로 넘기고 공통 봉투로 응답. 비즈니스 규칙은 서비스에, 에러는 next(err)로

const authService = require("../services/authService");
const { sign } = require("../utils/jwt");

// 회원가입. 성공 시 201 + user
async function register(req, res, next) {
  try {
    const { email, username, password } = req.body;
    const user = await authService.register({ email, username, password });
    res.status(201).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

// 로그인. 자격 검증 후 JWT 발급해서 token+user 반환
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await authService.verifyCredentials({ email, password });
    const token = sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });
    res.json({ success: true, data: { token, user } });
  } catch (err) {
    next(err);
  }
}

// 내 정보 조회 (토큰의 sub로)
async function me(req, res, next) {
  try {
    const user = await authService.getMe(req.user.sub);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

// PATCH /me — 내 프로필 중 수정 가능한 것(username, description) 업데이트
async function updateMe(req, res, next) {
  try {
    const { username, description } = req.body;
    const user = await authService.updateProfile(req.user.sub, {
      username,
      description,
    });
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

// GET /me/posts — 내가 쓴 최근 글 (마이페이지 "최근 게시물")
async function myPosts(req, res, next) {
  try {
    const posts = await authService.getMyPosts(req.user.sub, req.query.limit);
    res.json({ success: true, data: { posts } });
  } catch (err) {
    next(err);
  }
}

// 소셜 로그인(OAuth) 1단계: 신원 확인
// 기존 계정이면 JWT 발급(login과 동일 형태). 신규면 { needs_username: true } 줘서
// 클라가 username 받아 /oauth/register 호출하게 함. 여기선 아무것도 안 만듦
async function oauthIdentify(req, res, next) {
  try {
    const { access_token } = req.body;
    const result = await authService.oauthIdentify({ accessToken: access_token });
    if (result.needsUsername) {
      return res.json({ success: true, data: { needs_username: true } });
    }
    const { user } = result;
    const token = sign({ sub: user.id, username: user.username, role: user.role });
    res.json({ success: true, data: { token, user } });
  } catch (err) {
    next(err);
  }
}

// 소셜 로그인(OAuth) 2단계: 가입
// 토큰 재검증하고 고른 username으로 계정 생성 후 JWT 발급(login과 동일 형태)
async function oauthRegister(req, res, next) {
  try {
    const { access_token, username } = req.body;
    const { user } = await authService.oauthRegister({
      accessToken: access_token,
      username,
    });
    const token = sign({ sub: user.id, username: user.username, role: user.role });
    res.json({ success: true, data: { token, user } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, updateMe, myPosts, oauthIdentify, oauthRegister };
