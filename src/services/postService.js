// src/services/postService.js — post domain logic.
//
// This step covers create + read. Update/delete land in the next step.
// Ownership rule (ERD v4.1): EDIT is author-only (reqUser.sub === post.user_id);
// DELETE uses canMutate (author or admin).

const postRepo = require('../repositories/postRepo');
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
      throw createError(404, 'ISSUE_NOT_FOUND', '존재하지 않는 이슈입니다.');
    }
    throw err;
  }
}

// Post detail for GET /posts/:id (post + author + score). 404 if missing.
async function getDetail(id) {
  const post = await postRepo.findDetailById(id);
  if (!post) {
    throw createError(404, 'POST_NOT_FOUND', '게시물을 찾을 수 없습니다.');
  }
  return post;
}

// Update title/content — AUTHOR ONLY. Admins cannot edit others' posts
// (ERD v4.1), so compare reqUser.sub === owner directly (not canMutate).
async function update(postId, reqUser, { title, content }) {
  const post = await postRepo.findById(postId);
  if (!post) {
    throw createError(404, 'POST_NOT_FOUND', '게시물을 찾을 수 없습니다.');
  }
  if (post.user_id !== reqUser.sub) {
    throw createError(403, 'NOT_OWNER', '본인 게시물만 수정할 수 있습니다.');
  }
  return postRepo.update(postId, { title, content });
}

// Delete — author OR admin (canMutate). Hard delete cascades comments/votes.
async function remove(postId, reqUser) {
  const post = await postRepo.findById(postId);
  if (!post) {
    throw createError(404, 'POST_NOT_FOUND', '게시물을 찾을 수 없습니다.');
  }
  if (!canMutate(reqUser, post.user_id)) {
    throw createError(403, 'FORBIDDEN', '삭제 권한이 없습니다.');
  }
  await postRepo.remove(postId);
}

module.exports = { create, getDetail, update, remove };
