// src/jobs/geminiClient.js — Gemini (2.5 Flash) + Grounding (Google Search).
//
// generateIssue() returns { title, summary, source_url } for today's single
// most important news issue. The prompt lives in fetchTopic.md so it can be
// tuned without code edits. source_url is the RAW grounding redirect URI of the
// source the model actually used (Google-hosted). We deliberately do NOT resolve
// it server-side: resolving from a datacenter IP trips Google's /sorry anti-bot
// page and would store that instead of the article. Clicked in a user's browser
// the redirect opens the real article. Trade-off: ugly URL + link expires
// ~30 days — acceptable for a daily-news app.
//
// NOTE: gemini-1.5-flash is retired (404) and gemini-2.0-flash has no free-tier
// quota on our key — gemini-2.5-flash is the working choice. Its grounding tool
// is `googleSearch` (1.5 used `googleSearchRetrieval`).

const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const env = require("../config/env");

// Prompt externalised to fetchTopic.md (read once at startup).
const PROMPT = fs.readFileSync(
  path.resolve(__dirname, "fetchTopic.md"),
  "utf8",
);

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

// First grounding chunk's web.uri = the source the model grounded on. Returned
// RAW (unresolved) on purpose — see the header note.
function extractSourceUrl(response) {
  const chunks =
    response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  for (const c of chunks) {
    if (c?.web?.uri) return c.web.uri;
  }
  return null;
}

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
