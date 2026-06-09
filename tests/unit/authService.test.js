// auth 서비스 규칙 — 의존성 모킹 (DB 없음)
// 초점: 소셜로그인 NULL 비번 회귀 가드 + OAuth identify/register 분기(기존/이메일연결/신규/username중복)
//       + register·로그인성공·프로필수정·getMyPosts

jest.mock('../../src/repositories/userRepo');
jest.mock('../../src/repositories/postRepo');
jest.mock('../../src/config/supabase');
jest.mock('../../src/utils/password');

const userRepo = require('../../src/repositories/userRepo');
const postRepo = require('../../src/repositories/postRepo');
const password = require('../../src/utils/password');
const { getSupabase } = require('../../src/config/supabase');
const authService = require('../../src/services/authService');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('verifyCredentials — NULL password_hash guard (OAuth accounts)', () => {
  test('OAuth account (password_hash NULL) → 401, not a thrown 500', async () => {
    // 회귀: bcrypt.compare(plain, null)은 throw 함 → 가드가 먼저 401 내야 함
    userRepo.findByEmail.mockResolvedValue({
      id: 1,
      email: 'oauth@example.com',
      username: 'oauth_user',
      role: 'user',
      password_hash: null,
    });
    await expect(
      authService.verifyCredentials({ email: 'oauth@example.com', password: 'whatever123' }),
    ).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
  });

  test('unknown email → same 401 (no enumeration)', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    await expect(
      authService.verifyCredentials({ email: 'nope@example.com', password: 'whatever123' }),
    ).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
  });
});

describe('OAuth identify / register', () => {
  // 헬퍼: supabase.auth.getUser가 검증된 신원 반환하도록 스텁
  function mockSupabaseUser(user) {
    getSupabase.mockReturnValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) },
    });
  }

  const verified = {
    id: 'sb-uuid-123',
    email: 'alice@example.com',
    app_metadata: { provider: 'google' },
  };

  test('identify: invalid token → 401 INVALID_OAUTH_TOKEN', async () => {
    getSupabase.mockReturnValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: null, error: { message: 'bad' } }) },
    });
    await expect(
      authService.oauthIdentify({ accessToken: 'bad' }),
    ).rejects.toMatchObject({ status: 401, code: 'INVALID_OAUTH_TOKEN' });
  });

  test('identify: no email (e.g. GitHub private) → 401 OAUTH_EMAIL_REQUIRED', async () => {
    mockSupabaseUser({ ...verified, email: null });
    await expect(
      authService.oauthIdentify({ accessToken: 'tok' }),
    ).rejects.toMatchObject({ status: 401, code: 'OAUTH_EMAIL_REQUIRED' });
  });

  test('identify: existing provider account → returns user', async () => {
    mockSupabaseUser(verified);
    const existing = { id: 7, email: 'alice@example.com', username: 'alice', role: 'user' };
    userRepo.findByProviderId.mockResolvedValue(existing);
    const result = await authService.oauthIdentify({ accessToken: 'tok' });
    expect(result).toEqual({ user: existing });
    expect(userRepo.findByEmail).not.toHaveBeenCalled();
  });

  test('identify: email matches local account → links provider, returns user', async () => {
    mockSupabaseUser(verified);
    userRepo.findByProviderId.mockResolvedValue(null);
    userRepo.findByEmail.mockResolvedValue({ id: 9, email: 'alice@example.com', password_hash: 'h' });
    userRepo.linkProvider.mockResolvedValue({
      id: 9, email: 'alice@example.com', username: 'alice', role: 'user', password_hash: 'h',
    });
    const result = await authService.oauthIdentify({ accessToken: 'tok' });
    expect(userRepo.linkProvider).toHaveBeenCalledWith(9, 'google', 'sb-uuid-123');
    expect(result.user.password_hash).toBeUndefined();
  });

  test('identify: brand-new account → needsUsername', async () => {
    mockSupabaseUser(verified);
    userRepo.findByProviderId.mockResolvedValue(null);
    userRepo.findByEmail.mockResolvedValue(null);
    const result = await authService.oauthIdentify({ accessToken: 'tok' });
    expect(result).toEqual({ needsUsername: true });
  });

  test('register: new account → createOAuth with chosen username', async () => {
    mockSupabaseUser(verified);
    userRepo.findByProviderId.mockResolvedValue(null);
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.findByUsername.mockResolvedValue(null);
    userRepo.createOAuth.mockResolvedValue({
      id: 11, email: 'alice@example.com', username: 'alice_g', role: 'user',
    });
    const result = await authService.oauthRegister({ accessToken: 'tok', username: 'alice_g' });
    expect(userRepo.createOAuth).toHaveBeenCalledWith({
      email: 'alice@example.com', username: 'alice_g', provider: 'google', provider_id: 'sb-uuid-123',
    });
    expect(result.user.username).toBe('alice_g');
  });

  test('register: username taken → 409 USERNAME_TAKEN', async () => {
    mockSupabaseUser(verified);
    userRepo.findByProviderId.mockResolvedValue(null);
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.findByUsername.mockResolvedValue({ id: 2, username: 'alice_g' });
    await expect(
      authService.oauthRegister({ accessToken: 'tok', username: 'alice_g' }),
    ).rejects.toMatchObject({ status: 409, code: 'USERNAME_TAKEN' });
    expect(userRepo.createOAuth).not.toHaveBeenCalled();
  });

  test('register: account already exists (replay) → returns existing, no create', async () => {
    mockSupabaseUser(verified);
    userRepo.findByProviderId.mockResolvedValue({ id: 7, username: 'alice', role: 'user' });
    const result = await authService.oauthRegister({ accessToken: 'tok', username: 'whatever' });
    expect(result.user.id).toBe(7);
    expect(userRepo.createOAuth).not.toHaveBeenCalled();
  });

  test('register: 이메일 매칭 로컬 계정 → linkProvider 후 반환', async () => {
    mockSupabaseUser(verified);
    userRepo.findByProviderId.mockResolvedValue(null);
    userRepo.findByEmail.mockResolvedValue({ id: 9, email: 'alice@example.com', password_hash: 'h' });
    userRepo.linkProvider.mockResolvedValue({ id: 9, username: 'alice', role: 'user', password_hash: 'h' });
    const result = await authService.oauthRegister({ accessToken: 'tok', username: 'whatever' });
    expect(userRepo.linkProvider).toHaveBeenCalledWith(9, 'google', 'sb-uuid-123');
    expect(result.user.password_hash).toBeUndefined();
    expect(userRepo.createOAuth).not.toHaveBeenCalled();
  });
});

describe('authService.register', () => {
  test('이메일 중복 → 409 EMAIL_TAKEN', async () => {
    userRepo.findByEmail.mockResolvedValue({ id: 1 });
    await expect(
      authService.register({ email: 'a@b.com', username: 'kim', password: 'pass1234' }),
    ).rejects.toMatchObject({ status: 409, code: 'EMAIL_TAKEN' });
  });

  test('username 중복 → 409 USERNAME_TAKEN', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.findByUsername.mockResolvedValue({ id: 2 });
    await expect(
      authService.register({ email: 'a@b.com', username: 'kim', password: 'pass1234' }),
    ).rejects.toMatchObject({ status: 409, code: 'USERNAME_TAKEN' });
  });

  test('정상 → 비번 해싱 후 create (role 안 넘김)', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.findByUsername.mockResolvedValue(null);
    password.hash.mockResolvedValue('hashed');
    userRepo.create.mockResolvedValue({ id: 3, email: 'a@b.com', username: 'kim', role: 'user' });
    const r = await authService.register({ email: 'a@b.com', username: 'kim', password: 'pass1234' });
    expect(password.hash).toHaveBeenCalledWith('pass1234');
    expect(userRepo.create).toHaveBeenCalledWith({ email: 'a@b.com', username: 'kim', password_hash: 'hashed' });
    expect(r).not.toHaveProperty('role', 'admin');
  });
});

describe('authService.verifyCredentials — 성공 경로', () => {
  test('비번 일치 → password_hash 뺀 user 반환', async () => {
    userRepo.findByEmail.mockResolvedValue({
      id: 1, email: 'a@b.com', username: 'kim', role: 'user', password_hash: 'stored',
    });
    password.compare.mockResolvedValue(true);
    const r = await authService.verifyCredentials({ email: 'a@b.com', password: 'pass1234' });
    expect(r.password_hash).toBeUndefined();
    expect(r.id).toBe(1);
  });
});

describe('authService.getMe', () => {
  test('없으면 404 USER_NOT_FOUND', async () => {
    userRepo.findById.mockResolvedValue(null);
    await expect(authService.getMe(999)).rejects.toMatchObject({ status: 404, code: 'USER_NOT_FOUND' });
  });

  test('있으면 user 반환', async () => {
    userRepo.findById.mockResolvedValue({ id: 1, username: 'kim' });
    const r = await authService.getMe(1);
    expect(r.username).toBe('kim');
  });
});

describe('authService.updateProfile', () => {
  test('username이 남이 쓰는 거면 409 USERNAME_TAKEN', async () => {
    userRepo.findByUsername.mockResolvedValue({ id: 99, username: 'taken' });
    await expect(
      authService.updateProfile(1, { username: 'taken' }),
    ).rejects.toMatchObject({ status: 409, code: 'USERNAME_TAKEN' });
  });

  test('본인이 이미 쓰던 username이면 통과', async () => {
    userRepo.findByUsername.mockResolvedValue({ id: 1, username: 'me' });
    userRepo.updateProfile.mockResolvedValue({ id: 1, username: 'me' });
    const r = await authService.updateProfile(1, { username: 'me' });
    expect(r.username).toBe('me');
  });

  test('수정 대상 없으면 404', async () => {
    userRepo.updateProfile.mockResolvedValue(null);
    await expect(
      authService.updateProfile(1, { description: 'hi' }),
    ).rejects.toMatchObject({ status: 404, code: 'USER_NOT_FOUND' });
  });
});

describe('authService.getMyPosts', () => {
  test('limit 기본 3, repo로 전달', async () => {
    postRepo.findRecentByUser.mockResolvedValue([{ id: 1 }]);
    await authService.getMyPosts(1, undefined);
    expect(postRepo.findRecentByUser).toHaveBeenCalledWith(1, 3);
  });

  test('limit은 1~20로 clamp (50 → 20)', async () => {
    postRepo.findRecentByUser.mockResolvedValue([]);
    await authService.getMyPosts(1, '50');
    expect(postRepo.findRecentByUser).toHaveBeenCalledWith(1, 20);
  });
});
