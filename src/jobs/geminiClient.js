// src/jobs/geminiClient.js — Gemini 1.5 Flash + Grounding (Google Search).
//
// generateIssue() returns { title, summary, source_url } for today's single
// most important news issue. source_url comes from grounding metadata so it's a
// real, verifiable link rather than a hallucination.

const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');

const PROMPT = [
  '오늘 대한민국과 세계에서 가장 중요한 시사 이슈 1건을 선정하세요.',
  '아래 JSON 형식 하나만, 코드펜스나 부연설명 없이 그대로 출력하세요:',
  '{"title":"이슈 제목 (80자 이내)","summary":"핵심을 2~3문장으로 요약"}',
].join('\n');

function parseIssueJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Gemini 응답에서 JSON 객체를 찾지 못함');
  }
  const obj = JSON.parse(text.slice(start, end + 1));
  if (!obj.title || !obj.summary) {
    throw new Error('Gemini JSON에 title/summary 누락');
  }
  return { title: String(obj.title).trim(), summary: String(obj.summary).trim() };
}

function extractSourceUrl(response) {
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  for (const c of chunks) {
    if (c?.web?.uri) return c.web.uri;
  }
  return null;
}

async function generateIssue() {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY가 설정되지 않음');
  }
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    tools: [{ googleSearchRetrieval: {} }],
  });

  const result = await model.generateContent(PROMPT);
  const { title, summary } = parseIssueJson(result.response.text());
  const source_url = extractSourceUrl(result.response);
  return { title, summary, source_url };
}

module.exports = { generateIssue };
