// src/services/commentService.js — comment/reply domain logic.
//
// Replies are 1-depth only (ERD v4.1): you may reply to a top-level comment
// (depth 0) but not to a reply (depth 1). `@username` is a body-text convention
// rendered by the FE, not parsed here. DELETE uses canMutate (author or admin).

const commentRepo = require('../repositories/commentRepo');
const commentLikeRepo = require('../repositories/commentLikeRepo');
const postRepo = require('../repositories/postRepo');
const { createError } = require('../middleware/errorHandler');
const { canMutate } = require('../utils/permission');

// Create a comment (no parent_id) or a reply (parent_id → a depth-0 comment).
async function create(postId, authorId, { content, parent_id }) {
  const post = await postRepo.findById(postId);
  if (!post) {
    throw createError(404, 'POST_NOT_FOUND', 'Post not found.');
  }

  let depth = 0;
  let parentId = null;
  if (parent_id !== undefined && parent_id !== null) {
    const parent = await commentRepo.findById(parent_id);
    if (!parent || String(parent.post_id) !== String(postId)) {
      throw createError(404, 'PARENT_NOT_FOUND', 'Parent comment not found.');
    }
    if (parent.depth !== 0) {
      throw createError(400, 'CANNOT_REPLY_TO_REPLY', 'You cannot reply to a reply.');
    }
    depth = 1;
    parentId = parent.id;
  }

  return commentRepo.insert({
    post_id: postId,
    user_id: authorId,
    parent_id: parentId,
    depth,
    content,
  });
}

// Delete a comment/reply — author OR admin. Replies & likes of a parent
// comment are removed by ON DELETE CASCADE.
async function remove(commentId, reqUser) {
  const comment = await commentRepo.findById(commentId);
  if (!comment) {
    throw createError(404, 'COMMENT_NOT_FOUND', 'Comment not found.');
  }
  if (!canMutate(reqUser, comment.user_id)) {
    throw createError(
      403,
      'FORBIDDEN',
      'You do not have permission to delete this comment.',
    );
  }
  await commentRepo.remove(commentId);
}

// Toggle a like on a comment/reply (single-direction). No existing like → add
// (created); existing → remove (deleted). Returns the refreshed like_count.
async function toggleLike(commentId, userId) {
  const comment = await commentRepo.findById(commentId);
  if (!comment) {
    throw createError(404, 'COMMENT_NOT_FOUND', 'Comment not found.');
  }

  const existing = await commentLikeRepo.find(commentId, userId);
  let liked;
  if (!existing) {
    await commentLikeRepo.insert(commentId, userId);
    liked = true;
  } else {
    await commentLikeRepo.remove(commentId, userId);
    liked = false;
  }

  const like_count = await commentLikeRepo.countByComment(commentId);
  return { liked, like_count, action: liked ? 'created' : 'deleted' };
}

module.exports = { create, remove, toggleLike };
