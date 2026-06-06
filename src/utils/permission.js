// src/utils/permission.js — ownership/role check for DELETE actions.
//
// canMutate is used by the DELETE branches (post delete, comment/reply delete):
// the author OR an admin may delete. NOTE (ERD v4.1): EDIT is author-only —
// admins cannot edit others' content — so update paths must NOT use this; they
// compare reqUser.sub === ownerId directly.
//
// Comparison key is the JWT `sub` claim (= user.id), not reqUser.id.

function canMutate(reqUser, resourceOwnerId) {
  if (!reqUser) return false;
  return reqUser.role === "admin" || reqUser.sub === resourceOwnerId;
}

module.exports = { canMutate };
