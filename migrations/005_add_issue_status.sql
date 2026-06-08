-- =====================================================================
-- 005_add_issue_status.sql
-- What's Today — Issue review workflow (admin page)
-- ERD v3.3 / PRD v3.5 / Tech-Spec v3.5 정합
--
-- AI cron이 이슈를 'pending'(검수 대기)으로 생성 → 관리자 페이지에서
-- 검수 후 'published'로 승인하면 웹(홈/이슈 상세)에 노출.
--
-- Policies : hard delete + ON DELETE CASCADE (D-04)
-- Target   : PostgreSQL 16 (Supabase or local)
-- Apply    : `npm run db:migrate`  OR  Supabase SQL Editor
-- =====================================================================

-- 이슈 상태 ENUM
CREATE TYPE issue_status AS ENUM ('pending', 'published');

ALTER TABLE issues
    ADD COLUMN status       issue_status NOT NULL DEFAULT 'pending',
    ADD COLUMN published_at TIMESTAMPTZ  NULL;          -- 승인(게시) 시각. pending이면 NULL

-- 기존 이슈는 이미 노출 중이었으므로 published로 백필.
UPDATE issues
   SET status = 'published',
       published_at = created_at
 WHERE status = 'pending';

-- 홈/이슈 목록: published 이슈만 날짜 내림차순 조회.
CREATE INDEX issues_status_created ON issues (status, created_at DESC);

-- NOTE:
--   - cron INSERT는 DEFAULT 'pending'에 의해 검수 대기 상태로 생성된다.
--   - GET /api/home, GET /api/issues/:id 는 status='published'만 반환
--     (pending은 관리자 페이지 GET /api/admin/issues 에서만 조회).
--   - seed(002_seed_dev.sql)로 넣는 데모 이슈는 status='published'로 INSERT해야
--     홈에 바로 보인다.

-- =====================================================================
-- Sanity check (uncomment to verify after apply):
-- =====================================================================
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'issues';
-- Expected: id, title, summary, source_url, created_at, status, published_at
-- SELECT status, COUNT(*) FROM issues GROUP BY status;
