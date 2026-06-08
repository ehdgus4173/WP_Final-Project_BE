-- 2026-06-08_add_users_description.sql
-- MyPage: 사용자 자기소개(description) 컬럼 추가.
--
-- 적용 방법: Supabase 콘솔 → SQL Editor 에 아래를 붙여넣고 Run.
-- 반드시 백엔드(새 PATCH /auth/me, GET /auth/me/posts 코드)를 배포하기 "전에"
-- 먼저 실행하세요. 컬럼이 없으면 사용자 조회 쿼리가 깨집니다.
--
-- 안전하게 재실행 가능(IF NOT EXISTS). 기존 행은 빈 문자열로 채워집니다.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
