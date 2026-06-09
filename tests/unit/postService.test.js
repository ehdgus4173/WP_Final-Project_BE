// postService 로직 — repo 모킹 (DB 없음)
// create(FK 처리), getDetail(개인화), update(작성자만), remove(작성자/어드민) 분기 커버

jest.mock('../../src/repositories/postRepo');
jest.mock('../../src/repositories/voteRepo');
jest.mock('../../src/repositories/commentRepo');

const postRepo = require('../../src/repositories/postRepo');
const voteRepo = require('../../src/repositories/voteRepo');
const commentRepo = require('../../src/repositories/commentRepo');
const postService = require('../../src/services/postService');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('postService.create', () => {
  test('정상 생성 시 row 반환', async () => {
    postRepo.insert.mockResolvedValue({ id: 1, issue_id: 5, title: 't' });
    const r = await postService.create(5, 42, { title: 't', content: 'c'.repeat(20) });
    expect(postRepo.insert).toHaveBeenCalledWith({ issue_id: 5, user_id: 42, title: 't', content: 'c'.repeat(20) });
    expect(r.id).toBe(1);
  });

  test('없는 issue_id(FK 23503) → 404 ISSUE_NOT_FOUND', async () => {
    postRepo.insert.mockRejectedValue({ code: '23503' });
    await expect(
      postService.create(999, 42, { title: 't', content: 'c'.repeat(20) }),
    ).rejects.toMatchObject({ status: 404, code: 'ISSUE_NOT_FOUND' });
  });

  test('그 외 DB 에러는 그대로 전파', async () => {
    postRepo.insert.mockRejectedValue({ code: '08006' });
    await expect(
      postService.create(5, 42, { title: 't', content: 'c'.repeat(20) }),
    ).rejects.toMatchObject({ code: '08006' });
  });
});

describe('postService.getDetail', () => {
  test('없으면 404 POST_NOT_FOUND', async () => {
    postRepo.findDetailById.mockResolvedValue(null);
    await expect(postService.getDetail(999, 42)).rejects.toMatchObject({
      status: 404, code: 'POST_NOT_FOUND',
    });
  });

  test('익명(userId 없음) → user_vote null, votes 조회 안 함', async () => {
    postRepo.findDetailById.mockResolvedValue({ id: 1, title: 't' });
    commentRepo.findByPost.mockResolvedValue([{ id: 9 }]);
    const r = await postService.getDetail(1, undefined);
    expect(voteRepo.find).not.toHaveBeenCalled();
    expect(r.post.user_vote).toBeNull();
    expect(commentRepo.findByPost).toHaveBeenCalledWith(1, null);
    expect(r.comments).toEqual([{ id: 9 }]);
  });

  test('로그인 유저 → user_vote 채움', async () => {
    postRepo.findDetailById.mockResolvedValue({ id: 1, title: 't' });
    voteRepo.find.mockResolvedValue({ value: 1 });
    commentRepo.findByPost.mockResolvedValue([]);
    const r = await postService.getDetail(1, 42);
    expect(r.post.user_vote).toBe(1);
    expect(commentRepo.findByPost).toHaveBeenCalledWith(1, 42);
  });
});

describe('postService.update', () => {
  test('없으면 404', async () => {
    postRepo.findById.mockResolvedValue(null);
    await expect(
      postService.update(1, { sub: 42 }, { title: 't', content: 'c' }),
    ).rejects.toMatchObject({ status: 404, code: 'POST_NOT_FOUND' });
  });

  test('작성자 아니면 403 NOT_OWNER (어드민도 수정 불가)', async () => {
    postRepo.findById.mockResolvedValue({ id: 1, user_id: 99 });
    await expect(
      postService.update(1, { sub: 42, role: 'admin' }, { title: 't', content: 'c' }),
    ).rejects.toMatchObject({ status: 403, code: 'NOT_OWNER' });
    expect(postRepo.update).not.toHaveBeenCalled();
  });

  test('작성자면 수정', async () => {
    postRepo.findById.mockResolvedValue({ id: 1, user_id: 42 });
    postRepo.update.mockResolvedValue({ id: 1, title: 'new' });
    const r = await postService.update(1, { sub: 42 }, { title: 'new', content: 'c' });
    expect(postRepo.update).toHaveBeenCalledWith(1, { title: 'new', content: 'c' });
    expect(r.title).toBe('new');
  });
});

describe('postService.remove', () => {
  test('없으면 404', async () => {
    postRepo.findById.mockResolvedValue(null);
    await expect(postService.remove(1, { sub: 42 })).rejects.toMatchObject({
      status: 404, code: 'POST_NOT_FOUND',
    });
  });

  test('남이고 어드민도 아니면 403 FORBIDDEN', async () => {
    postRepo.findById.mockResolvedValue({ id: 1, user_id: 99 });
    await expect(
      postService.remove(1, { sub: 42, role: 'user' }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    expect(postRepo.remove).not.toHaveBeenCalled();
  });

  test('작성자면 삭제', async () => {
    postRepo.findById.mockResolvedValue({ id: 1, user_id: 42 });
    await postService.remove(1, { sub: 42, role: 'user' });
    expect(postRepo.remove).toHaveBeenCalledWith(1);
  });

  test('어드민이면 남의 글도 삭제', async () => {
    postRepo.findById.mockResolvedValue({ id: 1, user_id: 99 });
    await postService.remove(1, { sub: 42, role: 'admin' });
    expect(postRepo.remove).toHaveBeenCalledWith(1);
  });
});
