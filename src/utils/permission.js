// 소유권/권한 체크 (ERD v4.1에서 수정/삭제 분리됨)
// isOwner   — 수정(글 편집 등): 작성자만. 어드민도 수정 불가
// canMutate — 삭제(글/댓글/대댓글): 작성자 OR 어드민
// 비교 키는 JWT sub claim(= user.id), reqUser.id 아님

// 작성자 본인인지
function isOwner(reqUser, resourceOwnerId) {
  return !!reqUser && reqUser.sub === resourceOwnerId;
}

// 삭제 권한 있는지 (작성자거나 어드민)
function canMutate(reqUser, resourceOwnerId) {
  if (!reqUser) return false;
  return reqUser.role === "admin" || reqUser.sub === resourceOwnerId;
}

module.exports = { isOwner, canMutate };
