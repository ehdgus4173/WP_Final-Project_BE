// src/services/postService.js — post domain logic.
//
// This step covers create + read. Update/delete land in the next step.
// Ownership rule (ERD v4.1): EDIT is author-only (reqUser.sub === post.user_id);
// DELETE uses canMutate (author or admin).

const postRepo = require('../repositories/postRepo');
const { createError } = require('../middleware/errorHandler');

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

module.exports = { create, getDetail };
