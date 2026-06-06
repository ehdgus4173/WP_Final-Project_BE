// tests/unit/commentService.test.js — comment create (depth rules) + like toggle
// with mocked repos (no DB).

jest.mock('../../src/repositories/commentRepo');
jest.mock('../../src/repositories/commentLikeRepo');
jest.mock('../../src/repositories/postRepo');

const commentRepo = require('../../src/repositories/commentRepo');
const commentLikeRepo = require('../../src/repositories/commentLikeRepo');
const postRepo = require('../../src/repositories/postRepo');
const commentService = require('../../src/services/commentService');

beforeEach(() => {
  jest.clearAllMocks();
  postRepo.findById.mockResolvedValue({ id: '5', user_id: '42' }); // post exists
  commentRepo.insert.mockImplementation(async (row) => ({ id: '900', created_at: 'now', ...row }));
});

describe('commentService.create', () => {
  test('no parent_id → depth 0 comment', async () => {
    await commentService.create('5', '7', { content: 'hello there' });
    expect(commentRepo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ post_id: '5', user_id: '7', parent_id: null, depth: 0 }),
    );
  });

  test('parent is a depth-0 comment → depth 1 reply', async () => {
    commentRepo.findById.mockResolvedValue({ id: '10', post_id: '5', depth: 0 });
    await commentService.create('5', '7', { content: 'a reply', parent_id: 10 });
    expect(commentRepo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ parent_id: '10', depth: 1 }),
    );
  });

  test('parent is a reply (depth 1) → 400 CANNOT_REPLY_TO_REPLY', async () => {
    commentRepo.findById.mockResolvedValue({ id: '10', post_id: '5', depth: 1 });
    await expect(
      commentService.create('5', '7', { content: 'nope', parent_id: 10 }),
    ).rejects.toMatchObject({ status: 400, code: 'CANNOT_REPLY_TO_REPLY' });
  });

  test('parent missing / different post → 404 PARENT_NOT_FOUND', async () => {
    commentRepo.findById.mockResolvedValue(null);
    await expect(
      commentService.create('5', '7', { content: 'x', parent_id: 999 }),
    ).rejects.toMatchObject({ status: 404, code: 'PARENT_NOT_FOUND' });
  });

  test('post not found → 404 POST_NOT_FOUND', async () => {
    postRepo.findById.mockResolvedValue(null);
    await expect(
      commentService.create('999', '7', { content: 'x' }),
    ).rejects.toMatchObject({ status: 404, code: 'POST_NOT_FOUND' });
  });
});

describe('commentService.toggleLike', () => {
  beforeEach(() => {
    commentRepo.findById.mockResolvedValue({ id: '10', post_id: '5', depth: 0 });
  });

  test('no existing like → created, returns like_count', async () => {
    commentLikeRepo.find.mockResolvedValue(null);
    commentLikeRepo.countByComment.mockResolvedValue(1);
    const r = await commentService.toggleLike('10', '7');
    expect(commentLikeRepo.insert).toHaveBeenCalledWith('10', '7');
    expect(r).toEqual({ liked: true, like_count: 1, action: 'created' });
  });

  test('existing like → deleted', async () => {
    commentLikeRepo.find.mockResolvedValue({ exists: 1 });
    commentLikeRepo.countByComment.mockResolvedValue(0);
    const r = await commentService.toggleLike('10', '7');
    expect(commentLikeRepo.remove).toHaveBeenCalledWith('10', '7');
    expect(r).toEqual({ liked: false, like_count: 0, action: 'deleted' });
  });

  test('comment not found → 404 COMMENT_NOT_FOUND', async () => {
    commentRepo.findById.mockResolvedValue(null);
    await expect(commentService.toggleLike('999', '7')).rejects.toMatchObject({
      status: 404,
      code: 'COMMENT_NOT_FOUND',
    });
  });
});
