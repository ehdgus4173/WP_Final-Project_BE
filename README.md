# What's Today — Backend

Backend repository for **What's Today**, a web discussion forum where users gather around a **single news issue** that AI curates every day at 06:00 KST, sharing posts, comments, and votes.

Seoultech ITM519 Web Programming Final Project (2026).

[![CI](https://github.com/ehdgus4173/WP_Final-Project_BE/actions/workflows/ci.yaml/badge.svg)](https://github.com/ehdgus4173/WP_Final-Project_BE/actions/workflows/ci.yaml)

## Tech Stack

| Area | Technology |
|------|------------|
| Runtime | Node.js |
| Framework | Express |
| Database | PostgreSQL 16 (hosted on Supabase) |
| DB driver | `pg` (raw SQL, no ORM) |
| Auth | JWT (HS256) + bcrypt |
| Testing | Jest + Supertest |
| CI | GitHub Actions |
| CD | Render |

## Project Structure

The app follows a one-directional layered architecture. A request flows
**routes → controllers → services → repositories → db**

- **routes** — declare endpoints + request validation
- **controllers** — HTTP I/O only (parse request, shape the response envelope)
- **services** — domain rules and transactions
- **repositories** — raw parameterized SQL (`pg`, no ORM)

```text
WP_Final-Project_BE/
├── src/
│   ├── server.js              # HTTP server entrypoint
│   ├── app.js                 # Express app: middleware + route mounting
│   ├── db.js                  # pg connection pool
│   ├── config/
│   │   ├── env.js             # load + validate environment variables
│   │   ├── supabase.js        # Supabase client (OAuth token verification only)
│   │   └── swagger.js         # OpenAPI spec loader for /api/docs
│   ├── routes/                # endpoint + validator definitions
│   │   ├── index.js           # mounts all domain routers under /api
│   │   ├── auth.routes.js     # register / login / me / oauth
│   │   ├── home.routes.js
│   │   ├── issue.routes.js
│   │   ├── post.routes.js
│   │   ├── comment.routes.js
│   │   ├── admin.routes.js
│   │   ├── cron.routes.js
│   │   └── health.routes.js
│   ├── controllers/           # HTTP I/O layer
│   │   ├── authController.js
│   │   ├── homeController.js
│   │   ├── issueController.js
│   │   ├── postController.js
│   │   ├── commentController.js
│   │   ├── voteController.js
│   │   ├── adminController.js
│   │   └── cronController.js
│   ├── services/              # domain rules + transactions
│   │   ├── authService.js
│   │   ├── issueService.js
│   │   ├── postService.js
│   │   ├── commentService.js
│   │   └── voteService.js
│   ├── repositories/          # raw parameterized SQL
│   │   ├── userRepo.js
│   │   ├── issueRepo.js
│   │   ├── postRepo.js
│   │   ├── commentRepo.js
│   │   ├── commentLikeRepo.js
│   │   └── voteRepo.js
│   ├── middleware/            # auth, validation, rate limiting, errors
│   │   ├── auth.js            # required JWT
│   │   ├── optionalAuth.js    # JWT if present (public routes)
│   │   ├── requireAdmin.js    # admin-only gate
│   │   ├── cronSecret.js      # shared-secret gate for cron
│   │   ├── validate.js        # express-validator result handler
│   │   ├── rateLimit.js       # login brute-force limiter
│   │   └── errorHandler.js    # common error envelope
│   ├── jobs/                  # AI daily issue generation
│   │   ├── geminiClient.js    # Gemini + Google Search grounding
│   │   └── fetchTopic.md      # externalized prompt
│   └── utils/                 # pure helpers
│       ├── jwt.js
│       ├── password.js        # bcrypt hashing
│       ├── permission.js      # isOwner / canMutate
│       └── time.js            # KST date helpers
├── migrations/                # ordered SQL schema migrations
├── tests/                     # Jest (unit) + Supertest (integration)
│   └── unit/
├── scripts/                   # one-off dev scripts (DB connection check)
├── supabase/                  # pg_cron setup SQL
├── docs/
│   └── openapi.yaml           # API contract (served at /api/docs)
└── package.json
```

## Getting Started

```bash
npm install      # install dependencies
npm test         # run tests
```


## Testing

```bash
npm test
```

Unit tests use Jest and API integration tests use Supertest. GitHub Actions runs the test suite automatically on every push and pull request targeting `main` and `develop`.

## AI Usage Disclosure

- **Daily issue curation**: Google Gemini (Grounding with Google Search) will automatically generate one news issue each day at 06:00 KST.
- **Development**: AI assistant tools were used for code design, debugging, and documentation drafting.
