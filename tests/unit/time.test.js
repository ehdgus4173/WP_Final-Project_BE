// todayInKST (DB/네트워크 없음)

const { todayInKST } = require("../../src/utils/time");

describe("utils/time.todayInKST", () => {
  test("returns YYYY-MM-DD format", () => {
    expect(todayInKST()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("matches today's date computed in Asia/Seoul", () => {
    const expected = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
    }).format(new Date());
    expect(todayInKST()).toBe(expected);
  });
});
