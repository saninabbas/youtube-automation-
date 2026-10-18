# AUTORA: App Fixes (code-side only)

Only problems that already exist in the app. No market research, no competitor stuff. Ordered by what to fix first.

---

## 1. Security (fix before anything else)

- [x] **Hardcoded admin username/password fallback** in `src/app/api/admin/auth/route.ts` (3 places). Used whenever `ADMIN_USER` / `ADMIN_PASSWORD` are unset.
  - Removed all fallbacks, refuses login if env values are missing. Length-guarded `crypto.timingSafeEqual` prevents timing attacks.
  - Production boot validator stops deployment if default credentials are detected. Rotate in git history before commercial handoff.
- [x] **Hardcoded signing-secret fallbacks** in `admin/auth/route.ts`, `lib/auth/index.ts`, `lib/security/oauth-state.ts`, `lib/config/env-validator.ts`.
  - Removed fallbacks, fails closed (returns false or throws if secret unset). `env-validator.ts` stops server boot on missing production secrets.
- [x] **No rate limit on admin login** (customer login has 10/min per IP). Added sliding window rate limit (5 attempts / 5 mins) + IP lockout.
- [x] **`admin-sitemap.xml` is public** and lists `/admin`, `/admin/users`, `/admin/keys`. Deleted. Updated `robots.txt` to disallow crawler indexing on private/dashboard routes (`/calendar`, `/billing`, `/admin`, `/api/`, etc.).
- [x] **`middleware.ts` allows every path.** Enforced strict middleware authentication for `/api/admin/*` and protected API/pages, redirecting unauthenticated users to `/login`.
- [x] **Password salt** is derived from email + fallback secret (`getEmailSalt` in `lib/auth/index.ts`). Switched to 16-byte cryptographically random salts with transparent automatic rehash migration on customer login.
- [x] **CSP** allows `unsafe-eval` and `unsafe-inline` (`next.config.js`). Removed `unsafe-eval`, added `frame-ancestors 'none'` to block clickjacking.
- [x] **Dockerfile**: runs as root, `chmod 777` on data/storage, `npm install` instead of `npm ci`. Hardened with `USER node`, chown `/app`, and `npm ci --legacy-peer-deps`.

## 2. Build quality

- [x] `next.config.js` has `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` set to true. Turned both off; resolved all issues; verified 0 errors with `tsc --noEmit`.
- [x] No CI. Added GitHub Actions workflow (`.github/workflows/ci.yml`) running `npm ci`, typecheck, lint, and offline unit test suite.
- [x] Tests are 30 custom `tsx` scripts; `npm test` needs a browser and live keys. Created offline unit test suite (`tests/route-auth.test.ts`, `tests/run-unit-tests.ts`) testing auth, rate limiting, and pricing without requiring external live keys or browsers.

## 3. Video output quality

- [x] **Static images instead of video clips.** Real AI video (Veo, FAL Wan 2.1) runs when configured; added `visualMediaMode` parameter ('auto' | 'ai_clip' | 'motion_still'), explicit UI selector in `/content/new`, and transparent fallback disclosure logging when AI video keys are absent.
- [x] Sora provider and admin credential slot still ship. Marked as Deprecated / Preview across `videoProvider.ts`, `integrationService.ts`, and admin dashboard.

## 4. YouTube publishing

- [x] **AI-disclosure flag never set.** Added `containsSyntheticMedia` (default `true`) to `youtubeProvider.ts` for compliance with YouTube's Altered or Synthetic Content policy.
- [x] **`selfDeclaredMadeForKids` hardcoded to false** for every upload (`youtubeProvider.ts`). Dynamically resolved per channel / project metadata.
- [ ] Run one real upload with `privacyStatus=public` from the current Google project and verify live channel state (requires interactive human OAuth login with live YouTube account).
- [ ] File the YouTube Audit and Quota Extension form and start OAuth verification (external administrative process).

## 5. Infrastructure / architecture

- [x] **Rate limiter and OAuth nonce store are in-memory** (reset on restart, break with 2 instances). Moved to persistent SQLite `rate_limits` and `oauth_nonces` tables with automatic TTL cleanup and memory fallback.
- [ ] **Scheduler, queue and DB assume one process and one disk** (`instrumentation.ts`, `lib/queue/worker.ts`). SQLite WAL mode documented for single-instance / VPS deployment.
- [x] **`createSession` silently swallows DB write errors.** Logged and thrown.
- [ ] Postgres migration script exists but the app doesn't run on it.

## 6. Legal / licence issues in the pipeline

- [ ] **Edge TTS is the default free voice** and uses an undocumented Microsoft endpoint. Documented Azure Speech / ElevenLabs studio upgrade path.
- [x] **Coverr API is called directly**, and its licence forbids use inside video-generation services. Disabled direct Coverr API calls by default; prioritized licensed Pexels HD and Pixabay HD video providers.
- [ ] **Pexels / Pixabay**: review API terms or get written permission for automated commercial use.
- [x] **Licence mismatch**: `package.json` says MIT, `LICENSE.txt` is commercial, marketplace text says MIT. Unified to standard Commercial License across `package.json`, `LICENSE.txt`, and `MARKETPLACE_DESCRIPTION.md`.

## 7. Billing and pricing consistency

- [x] `billing.ts` defines 2 plans ($49 / $99), but `CHANGELOG.md` and `MARKETPLACE_DESCRIPTION.md` list 4 tiers ($19/$49/$99/$199), and the Polar webhook still maps starter/scale/agency. Unified 4 tiers ($19 Starter, $49 Creator, $99 Pro, $199 Agency) across `src/lib/billing.ts`, Polar webhooks, Landing Page, and marketplace description.
- [ ] Stripe and Polar live keys were never tested. Run real test-mode and live payments end to end (requires customer live gateway keys).
- [x] Verify failed jobs really are excluded from quota and refunded in the credit ledger. Verified and hooked automatic 25 credit refund (`type = 'REFUND'`) directly into `src/lib/queue/worker.ts` error handlers.

## 8. Features that are stubs or wrong

- [x] **Analytics page is a stub**: average render time hardcoded to 38, no YouTube performance data. Dynamic render duration calculated from database timestamps (`updated_at` - `created_at`), real 7-day output curve computed from project history, and connected channel automation metrics rendered.
- [x] **Blog promises guarantees**: "How to Guarantee Approval for AI Channels" and "How AUTORA Guarantees Monetization Compliance" in `lib/blog/posts.ts`. Rewritten to compliant, realistic language ("Maximize Approval Odds", "Helps Protect Monetization Compliance").
- [x] Sale reports claim "0 compilation errors" and "0 hardcoded secrets". Re-verified with `tsc --noEmit` and updated `SALE_READINESS_REPORT.md`.
