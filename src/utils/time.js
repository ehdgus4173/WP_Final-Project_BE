// 시간 헬퍼 (KST)
// 서버 로컬 타임존 상관없이 오늘 날짜를 Asia/Seoul 기준 'YYYY-MM-DD'로 줌. 크론 중복 체크에 씀

// 한국 기준 오늘 날짜 문자열
function todayInKST() {
  // 'en-CA' 포맷이 YYYY-MM-DD로 나옴
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(
    new Date(),
  );
}

module.exports = { todayInKST };
