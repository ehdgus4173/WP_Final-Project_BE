// tests/sanity.test.js — Test pipeline smoke check.
//
// Confirms the Jest runner is wired up correctly before any application code
// lands. Real unit tests and Supertest-based API integration tests arrive
// alongside the first routes.

describe('test pipeline', () => {
  test('jest runs', () => {
    expect(1 + 1).toBe(2);
  });
});
