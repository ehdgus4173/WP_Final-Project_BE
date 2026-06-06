# What's Today — Backend

Backend repository for **What's Today**, a web discussion forum where users gather around a **single news issue** that AI curates every day at 06:00 KST, sharing posts, comments, and votes.

Seoultech ITM519 Web Programming Final Project (2026).

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
