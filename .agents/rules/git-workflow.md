# Git Commit & Push Workflow Standards

Whenever the user asks to commit, push, or save progress (even with simple prompts like "commit this", "push", or "save"):

## 1. Strictly Follow Conventional Commits
All commits MUST follow the Conventional Commits specification:

```text
<type>(<scope>): <concise description in imperative mood>

- <Bullet point explaining WHY and WHAT changed>
- <Additional detail if applicable>
```

### Approved Types:
- `feat`: New feature, endpoint, or enhancement
- `fix`: Bug fix, error resolution, crash fix
- `refactor`: Code refactoring without behavioral changes
- `perf`: Performance optimization
- `test`: Adding or modifying tests, QA audit suites
- `docs`: Documentation, README, or CHANGELOG updates
- `chore`: Dependency updates, tooling, config tweaks

### Standard Project Scopes:
- `pipeline`: Video generation lifecycle, worker queues, FFmpeg composition
- `scheduler`: Autonomous background publisher, cron jobs, Sweeper
- `auth`: Sessions, cookies, logins, JWT/tokens, RBAC
- `billing`: Stripe, Polar.sh, plans, credit ledgers
- `db`: SQLite migrations, schemas, queries, encryption
- `blog`: Dynamic blog posts, SEO articles, markdown content
- `seo`: Sitemap.xml, robots.txt, metadata, search console tags
- `video`: Providers (Veo, Sora, Wan, Pollinations, Cloudflare Flux, Stock)
- `voice`: Neural TTS, EdgeTTS, ElevenLabs, audio compositing
- `admin`: Admin dashboard, API key vault, gateways manager
- `ui`: AppShell, responsive styling, components, layouts
- `qa`: Playwright, Puppeteer, Selenium, browser QA audits

## 2. Commit Execution Rules
1. **Atomic Commits**: Never lump unrelated files into a single generic commit. Split changes into logical, cohesive commits by scope.
2. **Present-Tense Imperative**: Start the summary with a lowercase verb (`implement`, `fix`, `add`, `optimize`, `prevent`), never past tense (`fixed`, `added`).
3. **Always Clean Working Tree**: Verify with `git status` that no unwanted untracked files or leftover conflicts remain.
4. **Pull Before Starting & Before Pushing**: Always synchronize with `git fetch origin` and `git pull --rebase origin <branch>` before starting work and before pushing.
5. **Feature Branches Required**: In collaborative workspaces, create dedicated branches (`feature/*`, `fix/*`) and rebase against `origin/main` rather than working directly on `main`.
6. **Post-Pull Dependency Sync**: Immediately run `npm install` if incoming changes updated `package.json` or lockfiles.
7. **Push Seamlessly**: When requested to push, ensure the branch is aligned with the remote and execute `git push origin <branch>`.
