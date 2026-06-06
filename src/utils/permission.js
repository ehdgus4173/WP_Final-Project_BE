// src/utils/permission.js — ownership/role checks (ERD v4.1 splits edit vs delete).
//
// isOwner   — UPDATE actions (e.g. post edit): author only. Admins may NOT edit.
// canMutate — DELETE actions (post delete, comment/reply delete): author OR admin.
//
// Comparison key is the JWT `sub` claim (= user.id), not reqUser.id.

function isOwner(reqUser, resourceOwnerId) {
  return !!reqUser && reqUser.sub === resourceOwnerId;
}

function canMutate(reqUser, resourceOwnerId) {
  if (!reqUser) return false;
  return reqUser.role === "admin" || reqUser.sub === resourceOwnerId;
}

module.exports = { isOwner, canMutate };
