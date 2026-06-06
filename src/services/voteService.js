// src/services/voteService.js — upvote/downvote toggle logic.
//
//   no existing vote        → INSERT  (201, action 'created')
//   same value re-clicked   → DELETE  (200, action 'deleted', value null)
//   opposite value clicked  → UPDATE  (200, action 'updated')
// UNIQUE (post_id, user_id) guarantees one vote per user per post.

const voteRepo = require('../repositories/voteRepo');
const postRepo = require('../repositories/postRepo');
const { createError } = require('../middleware/errorHandler');

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
