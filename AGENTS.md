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

## Multi-Collaborator Synchronization & Branching Standards
When collaborating with partners on this repository:

1. **Always Pull Before Starting Work**:
   - Before executing code changes or implementing new features, always run:
     ```bash
     git fetch origin
     git pull --rebase origin <current-branch>
     ```
   - If incoming changes update `package.json` or lockfiles, immediately run `npm install`.

2. **Feature Branch Mandate**:
   - Do NOT develop directly on `main` when collaborating.
   - Always create a dedicated branch for features or bugfixes:
     ```bash
     git checkout -b feature/<feature-name>
     # or
     git checkout -b fix/<bug-description>
     ```
   - Before merging or pushing, rebase against the latest `origin/main`:
     ```bash
     git fetch origin main
     git rebase origin/main
     ```

3. **Safe Pull Routine (Option 1 Workflow)**:
   - When local work is in progress and remote changes arrive:
     1. Stage and commit local progress: `git add <files>` && `git commit -m "..."`
     2. Pull remote changes with rebase: `git pull --rebase origin <branch>`
     3. Resolve any conflicts cleanly if prompted.
     4. Push cleanly: `git push origin <branch>`

