# Contributing to Study Buddy AI

First off, thanks for taking the time to contribute! This project is
maintained in the open and every PR, issue, and suggestion helps. This guide
covers everything you need to go from "cloned the repo" to "PR merged."

## Code of Conduct

This project follows a [Code of Conduct](CODE_OF_CONDUCT.md). By
participating, you're expected to uphold it.

## Ways to contribute

- 🐛 **Report bugs** — [open a bug report](../../issues/new/choose)
- 💡 **Suggest features** — [open a feature request](../../issues/new/choose)
- 📝 **Improve docs** — READMEs, code comments, setup instructions
- 🔧 **Fix issues** — check issues labeled [`good first issue`](../../labels/good%20first%20issue)
  or [`help wanted`](../../labels/help%20wanted)
- 🎨 **UI/UX polish** — the landing page and dashboard are always evolving

If you plan to work on something non-trivial, **open an issue first** (or
comment on an existing one) so we can align before you invest time. For
typos/small doc fixes, a PR is fine without an issue.

## Project structure

```
src/                  React + Vite frontend (TypeScript, Tailwind, shadcn/ui)
  components/         UI components, landing page sections, study modules
  pages/              Route-level pages (Dashboard, Stats, Admin, ...)
  lib/                API client, auth helpers, shared utils
server/               Express API (local dev)
api/                  Vercel serverless functions (production)
prisma/               Database schema & migrations (PostgreSQL via Neon)
scripts/              One-off maintenance/utility scripts
```

## Getting set up

**Prerequisites:** Node.js 20+ (see `.node-version`), npm, and free accounts
for [Neon](https://neon.tech), [Clerk](https://clerk.com), and
[Groq](https://console.groq.com) (or [Gemini](https://makersuite.google.com/app/apikey)).

```bash
git clone https://github.com/<your-username>/study-buddy-ai.git
cd study-buddy-ai
npm install
cp .env.example .env      # fill in your own keys — see .env.example
npm run db:generate
npm run db:push           # push the Prisma schema to your database
npm run dev:all           # runs the Vite frontend + Express API together
```

The app runs at `http://localhost:5173` (frontend) with the API on the port
set in `.env` (`PORT`, default `5000`).

Other useful scripts:

| Command | What it does |
|---|---|
| `npm run dev` | Frontend only (Vite) |
| `npm run server` | API only (Express, once) |
| `npm run lint` | ESLint over the whole repo |
| `npm run build` | Production build (`prisma generate` + `vite build`) |
| `npm run db:studio` | Open Prisma Studio to inspect your DB |

## Making a change

1. **Fork** the repo and create a branch off `main`:
   `git checkout -b feat/short-description` (or `fix/`, `docs/`, `chore/`).
2. Make your changes. Keep PRs focused — one feature or fix per PR is much
   easier to review than a bundle of unrelated changes.
3. Run `npm run lint` and make sure `npm run build` succeeds before opening
   the PR.
4. If you touched the UI, include a before/after screenshot or short clip in
   the PR description.
5. Write a clear commit message. We loosely follow
   [Conventional Commits](https://www.conventionalcommits.org/):
   `feat: add spaced-repetition scheduling to flashcards`,
   `fix: favorite toggle key mismatch`, `docs: update setup instructions`.
6. Open the PR against `main` and fill in the PR template — it links the
   issue you're closing (if any) and gives reviewers the context they need.

## Review process

- A maintainer (auto-requested via `CODEOWNERS`) will review and may ask for
  changes — this is normal, not a rejection.
- CI (lint/build) must pass before merge.
- Once approved, a maintainer will merge — please don't force-push after
  review has started unless asked to, since it can hide what changed.

## Reporting bugs / requesting features

Please use the issue templates — they make sure we get the info needed
(repro steps, environment, expected vs. actual behavior) without back-and-forth.
Search existing issues first to avoid duplicates.

## Questions?

Open a [question issue](../../issues/new/choose) or start a
[Discussion](../../discussions) if enabled. For anything sensitive (security,
conduct concerns), email **pandeysatyam1802@gmail.com** directly.
