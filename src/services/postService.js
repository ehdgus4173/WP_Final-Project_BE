// src/services/postService.js — post domain logic.
//
// This step covers create + read. Update/delete land in the next step.
// Ownership rule (ERD v4.1): EDIT is author-only (reqUser.sub === post.user_id);
// DELETE uses canMutate (author or admin).

const postRepo = require('../repositories/postRepo');
const voteRepo = require('../repositories/voteRepo');
const { createError } = require('../middleware/errorHandler');
const { canMutate } = require('../utils/permission');

// Create a post under an issue. Author is the authenticated user (JWT sub).
// A non-existent issue_id trips the FK (pg error 23503) → surfaced as 404.
async function create(issueId, authorId, { title, content }) {
  try {
    return await postRepo.insert({
      issue_id: issueId,
      user_id: authorId,
      title,
      content,
    });
  } catch (err) {
    if (err.code === '23503') {
      throw createError(404, 'ISSUE_NOT_FOUND', 'Issue not found.');
    }
    throw err;
  }
}

// Post detail for GET /posts/:id (post + author + score + user_vote).
// userId is the requester's id (from optionalAuth) or undefined when anonymous.
async function getDetail(id, userId) {
  const post = await postRepo.findDetailById(id);
  if (!post) {
    throw createError(404, 'POST_NOT_FOUND', 'Post not found.');
  }
  let user_vote = null;
  if (userId) {
    const v = await voteRepo.find(id, userId);
    user_vote = v ? v.value : null;
  }
  return { ...post, user_vote };
}

// Update title/content — AUTHOR ONLY. Admins cannot edit others' posts
// (ERD v4.1), so compare reqUser.sub === owner directly (not canMutate).
async function update(postId, reqUser, { title, content }) {
  const post = await postRepo.findById(postId);
  if (!post) {
    throw createError(404, 'POST_NOT_FOUND', 'Post not found.');
  }
  if (post.user_id !== reqUser.sub) {
    throw createError(403, 'NOT_OWNER', 'You can only edit your own post.');
  }
  return postRepo.update(postId, { title, content });
}

// Delete — author OR admin (canMutate). Hard delete cascades comments/votes.
async function remove(postId, reqUser) {
  const post = await postRepo.findById(postId);
  if (!post) {
    throw createError(404, 'POST_NOT_FOUND', 'Post not found.');
  }
  if (!canMutate(reqUser, post.user_id)) {
    throw createError(403, 'FORBIDDEN', 'You do not have permission to delete this post.');
  }
  await postRepo.remove(postId);
}

module.exports = { create, getDetail, update, remove };
