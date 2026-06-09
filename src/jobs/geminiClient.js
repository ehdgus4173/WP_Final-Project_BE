// Gemini (2.5 Flash) + Grounding(Google 검색)
// generateIssue()는 오늘 가장 중요한 뉴스 이슈 1건을 { title, summary, source_url }로 반환
// 프롬프트는 코드 수정 없이 튜닝하려고 fetchTopic.md에 분리해둠
// source_url은 모델이 실제 쓴 출처의 RAW grounding 리다이렉트 URI(구글 호스팅)
// 서버에서 일부러 안 풀음: 데이터센터 IP로 풀면 구글 /sorry 안티봇 페이지에 걸려서 그게 저장됨
// 유저 브라우저에서 클릭하면 리다이렉트가 진짜 기사로 열림. 트레이드오프: 못생긴 URL + 링크 ~30일 만료 (일일 뉴스 앱엔 허용)
// 참고: gemini-1.5-flash는 폐기(404), 2.0-flash는 우리 키에 무료 쿼터 없음 → 2.5-flash가 동작함
//       grounding 툴은 googleSearch (1.5는 googleSearchRetrieval 썼음)

const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const env = require("../config/env");

// 프롬프트는 fetchTopic.md로 외부화 (시작 때 한 번 읽음)
const PROMPT = fs.readFileSync(
  path.resolve(__dirname, "fetchTopic.md"),
  "utf8",
);

// Gemini 응답 텍스트에서 JSON 뽑아 title/summary 파싱. 형식 안 맞으면 throw
function parseIssueJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("No JSON object found in the Gemini response");
  }
  const obj = JSON.parse(text.slice(start, end + 1));
  if (!obj.title || !obj.summary) {
    throw new Error("Gemini JSON is missing title/summary");
  }
  return {
    title: String(obj.title).trim(),
    summary: String(obj.summary).trim(),
  };
}

// 첫 grounding chunk의 web.uri = 모델이 근거로 쓴 출처. 일부러 RAW(안 푼 상태)로 반환 — 헤더 설명 참고
function extractSourceUrl(response) {
  const chunks =
    response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  for (const c of chunks) {
    if (c?.web?.uri) return c.web.uri;
  }
  return null;
}

// 오늘 이슈 1건 생성. API 키 없으면 throw
async function generateIssue() {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [{ googleSearch: {} }],
  });

  const result = await model.generateContent(PROMPT);
  const { title, summary } = parseIssueJson(result.response.text());
  const source_url = extractSourceUrl(result.response);
  return { title, summary, source_url };
}

module.exports = { generateIssue };
