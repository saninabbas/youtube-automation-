# Agent Guidelines & Repository Conventions

## Git Commit & Workflow Standards
Whenever asked to commit or push code in this project:

1. **Format**: Strictly use Conventional Commits: `<type>(<scope>): <summary>`
2. **Types**: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`
3. **Common Scopes**:
   - `pipeline` (video worker, FFmpeg composition)
   - `scheduler` (background worker daemon, sweeper)
   - `auth` (multi-tenant session auth, login routes)
   - `billing` (Polar, Stripe, plans)
   - `db` (SQLite schema, migrations, queries)
   - `blog` (SEO articles, posts)
   - `seo` (sitemap, meta tags, search console)
   - `video` (AI video providers, stock footage)
   - `admin` (admin dashboard, API key vault)
   - `ui` (components, responsive layouts)
   - `qa` (test suites, browser automation)
4. **Detail**: Include a multi-line body with bullet points explaining changes.
5. **Atomic Commits**: Always group related files into individual commits rather than bundling everything into one commit.
