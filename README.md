# goodie-goods

A quiet Georgian-language news reader. Filters [ambebi.ge](https://www.ambebi.ge) down to wholesome, uplifting, or simply useful stories.

![Bun](https://img.shields.io/badge/Bun-1.3-fbf0df?logo=bun&logoColor=000)
![Next.js 16](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=fff)
![React 19.2](https://img.shields.io/badge/React-19.2-149eca?logo=react&logoColor=fff)
![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss&logoColor=fff)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-c5f74f?logo=drizzle&logoColor=000)
![Neon](https://img.shields.io/badge/Neon-Postgres-00e699?logo=postgresql&logoColor=fff)
![Vitest](https://img.shields.io/badge/Vitest-6e9f18?logo=vitest&logoColor=fff)
![Playwright](https://img.shields.io/badge/Playwright-E2E-2ead33?logo=playwright&logoColor=fff)
![License Apache 2.0](https://img.shields.io/badge/license-Apache--2.0-blue)

## How it works

A scheduled GitHub Actions job hits the ambebi.ge homepage every 30 minutes, parses the article list, fetches each new article, drops anything that hits a hard list of bad-news keywords, then sends the survivors through a Gemini 2.5 Flash classifier. Articles that score 75 and above go live. Borderline ones queue up in an admin page for manual review.

The site reads from a Neon Postgres branch over Drizzle. Vercel hosts the Next.js app. The cron scraper runs entirely inside the Actions runner so the Vercel Hobby function limits never get in the way.

## Stack

- Next.js 16 App Router on Vercel
- Bun for installs, dev, tests, and the scraper runtime
- Neon Postgres via Drizzle ORM with the HTTP driver
- iron-session for the single-password admin gate
- cheerio for HTML parsing
- Gemini 2.5 Flash for tone classification
- Tailwind v4 for styling
- Vitest plus Playwright for tests
- ESLint with sonarjs, import, security, promise, unicorn rule packs
- jscpd for duplication detection at 5 lines and 30 tokens
- knip for dead-code detection
- Husky and commitlint for Conventional Commits
- GitHub Actions for the cron scraper and CI

## Quick start

```bash
bun install
cp .env.example .env.local
# fill in DATABASE_URL, GEMINI_API_KEY, ADMIN_PASSWORD, IRON_SESSION_PASSWORD
bun run db:push
bun run dev
# open http://localhost:3000
```

## Scripts

| script               | what it does                              |
| -------------------- | ----------------------------------------- |
| `bun run dev`        | Next.js dev server with Turbopack         |
| `bun run build`      | Production build                          |
| `bun run start`      | Run the production build                  |
| `bun run ingest`     | Run the scraper one time locally          |
| `bun run test`       | Vitest unit tests across workspaces       |
| `bun run test:e2e`   | Playwright smoke test for the homepage    |
| `bun run typecheck`  | TypeScript across all workspaces          |
| `bun run lint`       | ESLint across all workspaces              |
| `bun run format`     | Prettier write                            |
| `bun run dupes`      | jscpd duplication scan                    |
| `bun run deadcode`   | knip unused-code scan                     |
| `bun run check:i18n` | Verify Georgian copy reads naturally      |
| `bun run check`      | The full chain. Same as the pre-push hook |

## Layout

```
apps/web/           Next.js 16 site (public read, admin queue)
packages/ingest/    Scraper, keyword filter, Gemini classifier
packages/shared/    Drizzle schema, zod types, constants
.github/workflows/  CI on pull request, scraper on cron
scripts/            One-off helper scripts (Georgian copy check)
```

## Quality gates

Every commit runs `lint-staged` (ESLint plus Prettier on the changed files) and `commitlint` for the Conventional Commits format. Every push runs the full `bun run check`. The same chain runs on every pull request in CI.

The TypeScript config is strict and turns on `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, and `noImplicitOverride`. ESLint enforces a 300-line file cap, a 50-line function cap, cyclomatic complexity ceiling of 10, cognitive complexity ceiling of 15, max nesting depth of 4, max 4 parameters per function, and a long list of TypeScript safety rules.

## License

Apache 2.0. See `LICENSE.md`.
