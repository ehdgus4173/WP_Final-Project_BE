// vote 토글 로직 — repo 모킹 (DB 없음)
// 토글 3분기 + value 검증 + 글 없음 커버

jest.mock('../../src/repositories/voteRepo');
jest.mock('../../src/repositories/postRepo');

const voteRepo = require('../../src/repositories/voteRepo');
const postRepo = require('../../src/repositories/postRepo');
const voteService = require('../../src/services/voteService');

beforeEach(() => {
  jest.clearAllMocks();
  postRepo.findById.mockResolvedValue({ id: 5, user_id: 42 }); // 기본적으로 글 존재
});

describe('voteService.toggle', () => {
  test('no existing vote → insert, action "created"', async () => {
    voteRepo.find.mockResolvedValue(null);
    const result = await voteService.toggle(5, 7, 1);
    expect(voteRepo.insert).toHaveBeenCalledWith(5, 7, 1);
    expect(result).toEqual({ value: 1, action: 'created' });
  });

  test('same value re-clicked → delete, action "deleted", value null', async () => {
    voteRepo.find.mockResolvedValue({ value: 1 });
    const result = await voteService.toggle(5, 7, 1);
    expect(voteRepo.remove).toHaveBeenCalledWith(5, 7);
    expect(result).toEqual({ value: null, action: 'deleted' });
  });

  test('opposite value → update, action "updated"', async () => {
    voteRepo.find.mockResolvedValue({ value: 1 });
    const result = await voteService.toggle(5, 7, -1);
    expect(voteRepo.update).toHaveBeenCalledWith(5, 7, -1);
    expect(result).toEqual({ value: -1, action: 'updated' });
  });

  test('invalid value → 400 before any repo lookup', async () => {
    await expect(voteService.toggle(5, 7, 2)).rejects.toMatchObject({ status: 400 });
    expect(postRepo.findById).not.toHaveBeenCalled();
  });

  test('post not found → 404 POST_NOT_FOUND', async () => {
    postRepo.findById.mockResolvedValue(null);
    voteRepo.find.mockResolvedValue(null);
    await expect(voteService.toggle(999, 7, 1)).rejects.toMatchObject({
      status: 404,
      code: 'POST_NOT_FOUND',
    });
  });
});
