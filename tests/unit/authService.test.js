// tests/unit/authService.test.js — auth service rules with mocked deps (no DB).
//
// Focus: the social-login NULL-password regression guard, plus the OAuth
// identify/register branches (existing / email-link / new-user / username dup).

jest.mock('../../src/repositories/userRepo');
jest.mock('../../src/config/supabase');

const userRepo = require('../../src/repositories/userRepo');
const { getSupabase } = require('../../src/config/supabase');
const authService = require('../../src/services/authService');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('verifyCredentials — NULL password_hash guard (OAuth accounts)', () => {
  test('OAuth account (password_hash NULL) → 401, not a thrown 500', async () => {
    // Regression: bcrypt.compare(plain, null) throws; the guard must 401 first.
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
  // Helper: stub supabase.auth.getUser to return a verified identity.
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
});
