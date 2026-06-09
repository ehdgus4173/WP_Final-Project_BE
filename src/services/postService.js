// 글 도메인 로직
// 소유권 규칙(ERD v4.1): 수정은 작성자만(reqUser.sub === post.user_id), 삭제는 canMutate(작성자/어드민)

const postRepo = require('../repositories/postRepo');
const voteRepo = require('../repositories/voteRepo');
const commentRepo = require('../repositories/commentRepo');
const { createError } = require('../middleware/errorHandler');
const { canMutate } = require('../utils/permission');

// 이슈 아래에 글 작성. 작성자는 로그인 유저(JWT sub)
// 없는 issue_id면 FK 위반(pg 23503) → 404로 변환
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

// GET /posts/:id 합본 → { post (+author/score/user_vote), comments[] }
// userId는 요청자 id(optionalAuth) 또는 익명이면 undefined. user_vote와 각 댓글 liked_by_me 개인화에 씀
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
  const comments = await commentRepo.findByPost(id, userId ?? null);
  return { post: { ...post, user_vote }, comments };
}

// 제목/내용 수정 — 작성자만. 어드민도 남의 글 수정 불가(ERD v4.1)라 canMutate 말고 sub===owner 직접 비교
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

// 삭제 — 작성자 OR 어드민(canMutate). 하드 삭제라 댓글/투표 CASCADE
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
