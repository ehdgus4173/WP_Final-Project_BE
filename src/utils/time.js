// src/utils/time.js — time helpers (KST).
//
// todayInKST returns today's calendar date in Asia/Seoul as 'YYYY-MM-DD',
// independent of the server's local timezone. Used by the cron dedup check.

function todayInKST() {
  // 'en-CA' formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(
    new Date(),
  );
}

module.exports = { todayInKST };
