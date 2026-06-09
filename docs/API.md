# What's Today — API Reference

All paths are prefixed with `/api` (e.g. `/api/auth/me`).
Auth column: `—` none · `✅` JWT required · `optional` works with or without login · `🔑` CRON_SECRET.
🆕 = added with the MyPage feature.

## Auth

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 1 | POST | `/auth/register` | — | Register (role input ignored — always 'user') |
| 2 | POST | `/auth/login` | — | Login → returns `{ token, user }` |
| 3 | GET | `/auth/me` | ✅ | Current user info (includes `role`, `description`) |
| 4 | PATCH | `/auth/me` | ✅ | 🆕 Update my profile (username / description) |
| 5 | GET | `/auth/me/posts` | ✅ | 🆕 My recent posts (MyPage) |
| 6 | POST | `/auth/oauth` | — | Social login step 1 — identify (Google/GitHub) |
| 7 | POST | `/auth/oauth/register` | — | Social login step 2 — sign up with username |

## Users 🆕

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 8 | GET | `/users/:id` | — | Public profile (read-only) |
| 9 | GET | `/users/:id/posts` | — | A user's recent posts |

## Home

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 10 | GET | `/home` | — | Today's published issue + 10 recent past issues |

## Issues

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 11 | GET | `/issues/:id` | — | Issue (published only) + posts list (`?sort=top\|latest`) |

## Posts

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 12 | GET | `/posts/:id` | optional | Post + score + your vote + comments tree |
| 13 | POST | `/issues/:id/posts` | ✅ | Create post |
| 14 | PUT | `/posts/:id` | ✅ owner only | Edit post (author only — admin cannot edit) |
| 15 | DELETE | `/posts/:id` | ✅ owner or admin | Delete post (hard, CASCADE) |
| 16 | POST | `/posts/:id/votes` | ✅ | Vote toggle (`{ value: 1 \| -1 }`) |

## Comments

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 17 | POST | `/posts/:id/comments` | ✅ | Create comment/reply (`parent_id` present → reply) |
| 18 | DELETE | `/comments/:id` | ✅ owner or admin | Delete comment/reply |
| 19 | POST | `/comments/:id/likes` | ✅ | Like toggle |

## Admin

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 20 | GET | `/admin/issues` | ✅ admin | Issue review list (`?status=pending\|published`) |
| 21 | PATCH | `/admin/issues/:id` | ✅ admin | Approve issue (pending → published) |
| 22 | DELETE | `/admin/issues/:id` | ✅ admin | Reject issue (hard delete) |
| 23 | POST | `/admin/regenerate-issues` | ✅ admin | Manual issue generation |

## Cron

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 24 | POST | `/cron/generate-issues` | 🔑 CRON_SECRET | Generate today's issue (Gemini → pending) |

## Health

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 25 | GET | `/health` | — | Process liveness |
| 26 | GET | `/health/db` | — | DB connection check |
