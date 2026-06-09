// JWT 발급/검증 (DB 없음). NODE_ENV=test에서 env.js가 쓰는 테스트용 JWT_SECRET 사용

const jwtUtil = require("../../src/utils/jwt");
const jwt = require("jsonwebtoken");

const TEST_SECRET = "test-secret-not-for-prod"; // 테스트에서 env.js 폴백값

describe("utils/jwt", () => {
  test("sign/verify round-trip preserves claims including role", () => {
    const token = jwtUtil.sign({ sub: "42", username: "alex", role: "admin" });
    const decoded = jwtUtil.verify(token);
    expect(decoded.sub).toBe("42");
    expect(decoded.username).toBe("alex");
    expect(decoded.role).toBe("admin");
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
  });

  test("verify rejects a tampered token", () => {
    const token = jwtUtil.sign({ sub: "1", username: "u", role: "user" });
    expect(() => jwtUtil.verify(`${token}x`)).toThrow();
  });

  test("verify rejects a token signed with a different secret", () => {
    const foreign = jwt.sign({ sub: "1" }, "some-other-secret", {
      algorithm: "HS256",
    });
    expect(() => jwtUtil.verify(foreign)).toThrow();
  });

  test("verify rejects an expired token", () => {
    const expired = jwt.sign({ sub: "1" }, TEST_SECRET, {
      algorithm: "HS256",
      expiresIn: -10,
    });
    expect(() => jwtUtil.verify(expired)).toThrow();
  });
});
