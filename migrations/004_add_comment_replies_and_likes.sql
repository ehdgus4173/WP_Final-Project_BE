-- =====================================================================
-- 004_add_comment_replies_and_likes.sql
-- What's Today — Comment replies (depth-1) + comment likes (좋아요)
--
-- NOTE: 003 번호는 003_add_user_role.sql (admin role, ERD v3.1)이 사용.
--       댓글 기능은 004로 적용한다.
--
-- Adds TWO things:
--   (1) Structural depth-1 replies on comments
--       (comments.parent_id + comments.depth). 대댓글까지만, 대대댓글 금지.
--       @username mention은 본문 텍스트 컨벤션 (별도 컬럼 없음).
--   (2) comment_likes  — like-only toggle (no downvote) on comments & replies.
--
-- Policies  : hard delete + ON DELETE CASCADE (D-04)
-- Target    : PostgreSQL 16 (Supabase or local)
-- Apply     : `npm run db:migrate`  OR  Supabase SQL Editor
-- =====================================================================


-- =====================================================================
-- (1) comments — add depth-1 reply support
-- =====================================================================
-- parent_id : 부모 댓글 (NULL = 최상위 댓글, NOT NULL = 대댓글)
-- depth     : 0 = 댓글, 1 = 대댓글  (대대댓글 금지)
ALTER TABLE comments
    ADD COLUMN parent_id BIGINT   NULL REFERENCES comments(id) ON DELETE CASCADE,
    ADD COLUMN depth      SMALLINT NOT NULL DEFAULT 0 CHECK (depth IN (0, 1));

-- 일관성 보장: 댓글(depth 0)은 부모 없음, 대댓글(depth 1)은 부모 있어야 함.
ALTER TABLE comments
    ADD CONSTRAINT comments_depth_parent_chk
    CHECK ((depth = 0 AND parent_id IS NULL)
        OR (depth = 1 AND parent_id IS NOT NULL));

-- 부모 댓글의 대댓글 목록 조회용.
CREATE INDEX comments_parent ON comments (parent_id);

-- NOTE (앱 레벨 강제):
--   대댓글의 부모는 반드시 depth 0 (최상위 댓글)이어야 함.
--   => 대댓글에 또 대댓글 다는 것(depth 2) 방지. 서비스 레이어에서 검증:
--      "parent.depth === 0 아니면 400 CANNOT_REPLY_TO_REPLY".


-- =====================================================================
-- (2) comment_likes — one like per (comment, user); single-direction
-- =====================================================================
CREATE TABLE comment_likes (
    id         BIGSERIAL    PRIMARY KEY,
    comment_id BIGINT       NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id    BIGINT       NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (comment_id, user_id)          -- 한 사용자가 한 댓글에 좋아요 1번
);

-- Like-count aggregation per comment (COUNT(*)).
CREATE INDEX comment_likes_comment ON comment_likes (comment_id);


-- =====================================================================
-- Sanity check (uncomment to verify after apply):
-- =====================================================================
-- SELECT table_name FROM information_schema.tables
--  WHERE table_schema = 'public' AND table_name NOT LIKE '\_%'
--  ORDER BY table_name;
-- Expected: comment_likes, comments, issues, posts, users, votes
--
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'comments';
-- Expected: id, post_id, user_id, content, created_at, parent_id, depth
