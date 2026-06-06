// tests/unit/permission.test.js — canMutate (delete-branch helper), no DB.

const { canMutate } = require("../../src/utils/permission");

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
