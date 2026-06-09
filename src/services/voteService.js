// 추천/비추천 토글 로직
//   기존 투표 없음    → INSERT (201, 'created')
//   같은 값 또 누름    → DELETE (200, 'deleted', value null)
//   반대 값 누름       → UPDATE (200, 'updated')
// UNIQUE (post_id, user_id)로 글당 유저 1표 보장

const voteRepo = require('../repositories/voteRepo');
const postRepo = require('../repositories/postRepo');
const { createError } = require('../middleware/errorHandler');

// 투표 토글. value는 1 또는 -1만
async function toggle(postId, userId, newValue) {
  if (newValue !== 1 && newValue !== -1) {
    throw createError(400, 'VALIDATION_ERROR', 'value must be 1 or -1.');
  }

  const post = await postRepo.findById(postId);
  if (!post) {
    throw createError(404, 'POST_NOT_FOUND', 'Post not found.');
  }

  const existing = await voteRepo.find(postId, userId);
  if (!existing) {
    await voteRepo.insert(postId, userId, newValue);
    return { value: newValue, action: 'created' };
  }
  if (existing.value === newValue) {
    await voteRepo.remove(postId, userId);
    return { value: null, action: 'deleted' };
  }
  await voteRepo.update(postId, userId, newValue);
  return { value: newValue, action: 'updated' };
}

module.exports = { toggle };
