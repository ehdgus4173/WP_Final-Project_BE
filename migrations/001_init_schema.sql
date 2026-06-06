-- 001_init_schema.sql — What's Today initial schema (docs v4.0 + ERD v4.1)
-- 6 entities: users / issues / posts / comments / votes / comment_likes

-- Case-insensitive email comparison.
CREATE EXTENSION IF NOT EXISTS citext;

-- Admin superuser role. DB-direct grant only; register API never sets this.
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Issue review state (ERD v4.1). cron inserts 'pending'; admin approves to
-- 'published'. Home / issue detail expose 'published' only.
CREATE TYPE issue_status AS ENUM ('pending', 'published');


-- 1. users
CREATE TABLE users (
    id            BIGSERIAL    PRIMARY KEY,
    email         CITEXT       NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    username      VARCHAR(20)  NOT NULL UNIQUE,
    role          user_role    NOT NULL DEFAULT 'user',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
-- App-level validation: username ^[A-Za-z0-9_]{3,20}$, password >= 8 (letter+digit).


-- 2. issues  (one AI-curated issue per day, no category)
CREATE TABLE issues (
    id           BIGSERIAL    PRIMARY KEY,
    title        VARCHAR(200) NOT NULL,
    summary      TEXT         NULL,
    source_url   TEXT         NULL,                -- Gemini Grounding web.uri
    status       issue_status NOT NULL DEFAULT 'pending',  -- ERD v4.1 review state
    published_at TIMESTAMPTZ  NULL,                -- set when admin approves; NULL while pending
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX issues_created_desc   ON issues (created_at DESC);
CREATE INDEX issues_status_created ON issues (status, created_at DESC);  -- published-list lookups
-- One issue per KST date is enforced by cron logic (status-agnostic), not a DB constraint.


-- 3. posts
CREATE TABLE posts (
    id         BIGSERIAL    PRIMARY KEY,
    issue_id   BIGINT       NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id    BIGINT       NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    title      VARCHAR(120) NOT NULL CHECK (char_length(title) >= 1),
    content    TEXT         NOT NULL CHECK (char_length(content) BETWEEN 20 AND 10000),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NULL                  -- NULL = never edited; set = "(수정됨)"
);
CREATE INDEX posts_issue_created_desc ON posts (issue_id, created_at DESC);
CREATE INDEX posts_user               ON posts (user_id);


-- 4. comments  (1-depth replies: depth 0 = comment, depth 1 = reply)
CREATE TABLE comments (
    id         BIGSERIAL    PRIMARY KEY,
    post_id    BIGINT       NOT NULL REFERENCES posts(id)    ON DELETE CASCADE,
    user_id    BIGINT       NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    parent_id  BIGINT       NULL     REFERENCES comments(id) ON DELETE CASCADE,
    depth      SMALLINT     NOT NULL DEFAULT 0 CHECK (depth IN (0, 1)),
    content    TEXT         NOT NULL CHECK (char_length(content) BETWEEN 2 AND 1000),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    -- depth 0 must be top-level; depth 1 must have a parent. depth 2 is blocked
    -- here (DB) and in the service layer (parent.depth === 0 check).
    CONSTRAINT comments_depth_parent_chk
        CHECK ((depth = 0 AND parent_id IS NULL)
            OR (depth = 1 AND parent_id IS NOT NULL))
);
CREATE INDEX comments_post_created ON comments (post_id, created_at);
CREATE INDEX comments_parent       ON comments (parent_id);   -- reply lookups


-- 5. votes  (up/down on posts; one vote per (post, user))
CREATE TABLE votes (
    id         BIGSERIAL    PRIMARY KEY,
    post_id    BIGINT       NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value      SMALLINT     NOT NULL CHECK (value IN (-1, 1)),  -- -1 down, +1 up
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (post_id, user_id)
);
CREATE INDEX votes_post ON votes (post_id);


-- 6. comment_likes  (one-directional like on comments/replies)
CREATE TABLE comment_likes (
    id         BIGSERIAL    PRIMARY KEY,
    comment_id BIGINT       NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id    BIGINT       NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (comment_id, user_id)
);
-- No `value` column — a row's existence IS the like. Toggle: insert / delete.
CREATE INDEX comment_likes_comment ON comment_likes (comment_id);
