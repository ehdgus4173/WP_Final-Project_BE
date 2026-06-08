// src/jobs/geminiClient.js — Gemini (2.5 Flash) + Grounding (Google Search).
//
// generateIssue() returns { title, summary, source_url } for today's single
// most important news issue. The prompt lives in fetchTopic.md so it can be
// tuned without code edits. source_url comes from grounding metadata, so it's a
// real, verifiable link rather than a hallucination.
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

// AI STRONGLY USED
// Fix A: grounding chunk URIs are short-lived vertexaisearch redirect links —
// they expire (~30 days) and appear inaccessible when opened directly in a
// browser. Resolve each to its final destination so we store a stable URL.
// AbortSignal.timeout(5000) prevents hanging on slow/unresponsive targets.
async function resolveRedirect(uri) {
  try {
    const res = await fetch(uri, {
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });
    return res.url || uri;
  } catch {
    return uri; // network failure → keep the redirect as a fallback
  }
}

// Fix B: score a resolved URL by path depth; penalise aggregators (daum,
// naver) that ground to a section/homepage instead of an article deep-link.
function urlScore(url) {
  const AGGREGATORS = ["daum.net", "naver.com"];
  try {
    const { hostname, pathname } = new URL(url);
    if (AGGREGATORS.some((d) => hostname === d || hostname.endsWith("." + d)))
      return -1;
    return pathname.split("/").filter(Boolean).length; // deeper path = more likely an article
  } catch {
    return 0;
  }
}

async function extractSourceUrl(response) {
  const chunks =
    response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const uris = chunks.map((c) => c?.web?.uri).filter(Boolean);
  if (uris.length === 0) return null;

  // Resolve all redirect URIs in parallel, then pick the best article URL
  const resolved = await Promise.all(uris.map(resolveRedirect));
  resolved.sort((a, b) => urlScore(b) - urlScore(a));
  return resolved[0];
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
  const source_url = await extractSourceUrl(result.response);
  return { title, summary, source_url };
}

module.exports = { generateIssue };
