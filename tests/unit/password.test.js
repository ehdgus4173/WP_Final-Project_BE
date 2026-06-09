// bcrypt 헬퍼 동작 (DB 없음)

const password = require("../../src/utils/password");

describe("utils/password", () => {
  test("hash produces a different hash each call (salted) and hides plaintext", async () => {
    const [a, b] = await Promise.all([
      password.hash("abc12345"),
      password.hash("abc12345"),
    ]);
    expect(a).not.toBe(b);
    expect(a).not.toContain("abc12345");
  });

  test("compare returns true for the correct password", async () => {
    const h = await password.hash("abc12345");
    expect(await password.compare("abc12345", h)).toBe(true);
  });

  test("compare returns false for a wrong password", async () => {
    const h = await password.hash("abc12345");
    expect(await password.compare("wrong9999", h)).toBe(false);
  });
});
