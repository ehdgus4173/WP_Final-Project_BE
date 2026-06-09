<div align="center">

# 📰 What's Today — Backend

**One news issue a day, curated by AI — a place to read, post, and debate.**

Backend for **What's Today**: a discussion forum where everyone gathers around a
**single news issue** that AI curates every day at **06:00 KST**, then shares
posts, comments, and votes.

<br/>

[![CI](https://github.com/ehdgus4173/WP_Final-Projcet_BE/actions/workflows/ci.yaml/badge.svg)](https://github.com/ehdgus4173/WP_Final-Projcet_BE/actions/workflows/ci.yaml)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=white)

**🔗 [Live API](https://wp-final-projcet-be.onrender.com/api/health) · [API Docs (Swagger)](https://wp-final-projcet-be.onrender.com/api/docs) · [Web App](https://wp-final-project-fe.onrender.com)**

<sub>Seoultech ITM519 · Web Programming Final Project (2026)</sub>

</div>

---

##  Features

-  **AI-curated daily issue** — Google Gemini (Grounding with Google Search) generates one news issue every day at 06:00 KST.
-  **Admin review** — generated issues stay `pending` until an admin approves and publishes them.
-  **Posts & threaded comments** — write posts under an issue, comment, and reply (1-level deep) with likes & mentions.
-  **Voting** — upvote / downvote posts; one vote per user per post.
-  **Auth** — email/password (JWT) and social login (Google / GitHub via Supabase OAuth).
-  **Profiles (MyPage)** — edit your username & description, view your recent posts; public read-only profiles for others.

##  Tech Stack

| Area | Technology |
|------|------------|
| Runtime | Node.js |
| Framework | Express |
| Database | PostgreSQL 16 (hosted on Supabase) |
| DB driver | `pg` (raw SQL, no ORM) |
| Auth | JWT (HS256) + bcrypt · Supabase OAuth |
| AI | Google Gemini (Search grounding) |
| Testing | Jest + Supertest |
| CI / CD | GitHub Actions / Render |

##  Architecture

A one-directional, layered request flow:

```
routes → controllers → services → repositories → db
```

| Layer | Responsibility |
|-------|----------------|
| **routes** | declare endpoints + request validation |
| **controllers** | HTTP I/O only (parse request, shape the response envelope) |
| **services** | domain rules & transactions |
| **repositories** | raw parameterized SQL (`pg`, no ORM) |

Every response uses a common envelope:

```jsonc
// success
{ "success": true, "data": { /* ... */ } }
// failure
{ "success": false, "error": { "code": "BAD_INPUT", "message": "..." } }
```

##  Getting Started

```bash
# 1. Clone & install
git clone https://github.com/ehdgus4173/WP_Final-Projcet_BE.git
cd WP_Final-Projcet_BE
npm install

# 2. Configure environment
cp .env.example .env        # then fill in the values

# 3. Run
npm run dev                 # development (nodemon, auto-reload)
npm start                   # production
```

The server starts on `http://localhost:3000` and the API is served under `/api`.

### Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `3000`) |
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | JWT signing secret & TTL |
| `FE_ORIGIN` | Allowed frontend origin(s) for CORS (comma-separated) |
| `GEMINI_API_KEY` | Google Gemini key (AI cron) |
| `CRON_SECRET` | Bearer secret for the internal cron endpoint |

##  API

- **Interactive docs:** [`/api/docs`](https://wp-final-projcet-be.onrender.com/api/docs) (Swagger UI, generated from [`docs/openapi.yaml`](./docs/openapi.yaml))
- **Endpoint summary:** see [`docs/API.md`](./docs/API.md)

Quick health check:

```bash
curl https://wp-final-projcet-be.onrender.com/api/health
```

##  Testing

```bash
npm test
```

Unit tests (Jest) + API integration tests (Supertest). **GitHub Actions** runs the
full suite automatically on every push and pull request to `main` and `develop`,
and **Render** auto-deploys on merge.

## 📁 Project Structure

```text
WP_Final-Project_BE/
├── src/
│   ├── server.js              # HTTP server entrypoint
│   ├── app.js                 # Express app: middleware + route mounting
│   ├── db.js                  # pg connection pool
│   ├── config/                # env, supabase client, swagger loader
│   ├── routes/                # endpoint + validator definitions
│   ├── controllers/           # HTTP I/O layer
│   ├── services/              # domain rules + transactions
│   ├── repositories/          # raw parameterized SQL
│   ├── middleware/            # auth, validation, rate limiting, errors
│   ├── jobs/                  # AI daily issue generation (Gemini)
│   └── utils/                 # jwt, password, permission, time helpers
├── migrations/                # ordered SQL schema migrations
├── tests/                     # Jest (unit) + Supertest (integration)
│   └── unit/
├── scripts/                   # one-off dev scripts (DB connection check)
├── supabase/                  # pg_cron setup SQL
├── docs/                      # openapi.yaml (served at /api/docs) + API.md
└── package.json
```

##  Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for the
branching model, commit conventions, and pull request process. Both `main` and
`develop` are protected — all changes go in through a Pull Request.

##  AI Usage Disclosure

- **Daily issue curation:** Google Gemini (Grounding with Google Search) generates one news issue each day at 06:00 KST.
- **Development:** AI assistant tools were used for code design, debugging, and documentation drafting.

---

<div align="center">
<sub>Seoultech ITM519 · Web Programming · 2026</sub>
</div>
