// isOwner(수정) + canMutate(삭제) 권한 헬퍼, DB 없음

const { isOwner, canMutate } = require("../../src/utils/permission");

describe("utils/permission.isOwner (edit-branch helper)", () => {
  test("owner can edit own resource", () => {
    expect(isOwner({ sub: "7", role: "user" }, "7")).toBe(true);
  });

  test("admin canNOT edit others' resource (edit is author-only)", () => {
    expect(isOwner({ sub: "99", role: "admin" }, "7")).toBe(false);
  });

  test("non-owner cannot edit", () => {
    expect(isOwner({ sub: "8", role: "user" }, "7")).toBe(false);
  });

  test("missing reqUser cannot edit", () => {
    expect(isOwner(null, "7")).toBe(false);
    expect(isOwner(undefined, "7")).toBe(false);
  });
});

describe("utils/permission.canMutate", () => {
  test("owner can mutate own resource", () => {
    expect(canMutate({ sub: "7", role: "user" }, "7")).toBe(true);
  });

  test("admin can mutate any resource", () => {
    expect(canMutate({ sub: "99", role: "admin" }, "7")).toBe(true);
  });

  test("non-owner non-admin cannot mutate", () => {
    expect(canMutate({ sub: "8", role: "user" }, "7")).toBe(false);
  });

  test("missing reqUser cannot mutate", () => {
    expect(canMutate(null, "7")).toBe(false);
    expect(canMutate(undefined, "7")).toBe(false);
  });
});
