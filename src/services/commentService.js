// 댓글/대댓글 도메인 로직
// 대댓글은 1단계만(ERD v4.1): 최상위 댓글(depth 0)엔 답글 가능, 답글(depth 1)엔 불가
// @username은 FE가 렌더하는 본문 표기 관례라 여기서 파싱 안 함. 삭제는 canMutate(작성자/어드민)

const commentRepo = require('../repositories/commentRepo');
const commentLikeRepo = require('../repositories/commentLikeRepo');
const postRepo = require('../repositories/postRepo');
const { createError } = require('../middleware/errorHandler');
const { canMutate } = require('../utils/permission');

// 댓글(parent_id 없음) 또는 대댓글(parent_id → depth-0 댓글) 작성
async function create(postId, authorId, { content, parent_id }) {
  const post = await postRepo.findById(postId);
  if (!post) {
    throw createError(404, 'POST_NOT_FOUND', 'Post not found.');
  }

  let depth = 0;
  let parentId = null;
  if (parent_id !== undefined && parent_id !== null) {
    const parent = await commentRepo.findById(parent_id);
    // 부모 없거나 다른 글 소속이면 404
    if (!parent || String(parent.post_id) !== String(postId)) {
      throw createError(404, 'PARENT_NOT_FOUND', 'Parent comment not found.');
    }
    // 답글에 답글 달기 금지
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

// 댓글/대댓글 삭제 — 작성자 OR 어드민. 부모 댓글의 답글/좋아요는 ON DELETE CASCADE로 같이 삭제됨
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

// 댓글 좋아요 토글. 없으면 추가(created), 있으면 제거(deleted). 갱신된 like_count 반환
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
