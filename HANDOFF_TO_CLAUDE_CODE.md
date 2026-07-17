# Handoff to Claude Code

This document tells the next Claude Code agent (or human dev) exactly how to pick up **The Trading Diary V2** from a cold start. Everything the agent needs to know about credentials, secrets, deploy paths, and the current state is here.

Read `CLAUDE.md` first (context on the product, stack, and design principles). Then this file for the operational side.

---

## 1. What you're inheriting

- A production-ready React/Vite/Supabase app at `https://www.thetradingdiary.com`
- ~330 TypeScript/TSX files, 5 languages, 9 blog articles, 3 programmatic SEO pages live
- 6 Supabase edge functions (5 for SnapTrade + 1 webhook + others for AI extraction)
- 3 DB migrations pending user deploy (blog CMS, aggregator connections, 4 new articles)
- 12+ markdown living docs in the repo (SEO plans, setup guides, audit)
- Zero TypeScript errors as of last commit
- SnapTrade 1-click exchange integration wired end-to-end but **not deployed** — needs env vars + `supabase functions deploy`
- SEO Master Plan with 12-week execution — **week 1 not started yet**

## 2. Your identity and access model

**You (Claude Code) act as the user, with the user's credentials.** You do not have a separate identity in any service. Everything you do is authorized by:

1. **The Mac's shell environment** — anything set as an env var in `~/.zshrc`, `~/.bashrc`, or `.env.local` in the repo
2. **The Mac's SSH keys / OS keychain** — for git push, `gh` CLI, `supabase login` cookies
3. **The current working directory** — you can only read/write files inside the directory Claude Code was launched from (or paths the user explicitly grants)

You cannot log into any service on your own. If a service needs OAuth (Google, Twitter, etc), you must ask the user to do it in a browser and paste back what's needed (or better: use a headless CLI like `gh auth login` with device flow).

## 3. First-run setup checklist (do this before any code changes)

Run these commands in order. Stop at the first failure and report to the user.

```bash
# 1. You should be in the repo root. Confirm.
pwd
# Expected: something ending in /the-trading-diary-V2

# 2. Confirm the repo is git-clean and pointed at main
git status
git branch --show-current    # should be `main`
git remote -v                # should point to a github.com URL

# 3. Confirm Node version (repo uses Node 20+)
node -v                      # should be v20.x or v22.x

# 4. Install deps if needed
ls node_modules 2>/dev/null || npm install

# 5. Confirm .env.local exists and has the 3 required vars
cat .env.local 2>/dev/null | grep -E "^(VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY|VITE_APP_ENV)="
# If missing any: ASK THE USER for values before proceeding.

# 6. Confirm TypeScript is clean
npx tsc --noEmit
# Expected: no output. If errors: STOP and report.

# 7. Boot the dev server as a smoke test
npm run dev &
sleep 6
curl -sI http://localhost:8080 | head -1
# Expected: HTTP/1.1 200 OK
kill %1

# 8. Confirm Supabase CLI is installed and logged in
supabase --version
supabase projects list
# If either fails: `brew install supabase/tap/supabase && supabase login`

# 9. Confirm GitHub CLI is installed and logged in
gh --version
gh auth status
# If not logged in: `gh auth login` (device flow)
```

If everything passes, you're ready. Report back: "Setup verified. Ready for the first task."

## 4. Credential map (where every secret lives)

| Secret | Where it lives | How you use it | Rotation |
|---|---|---|---|
| **GitHub SSH / PAT** | Mac keychain (`gh` CLI or `~/.ssh/id_ed25519`) | `git push` runs as user | User rotates via GitHub → Settings → SSH keys |
| **Supabase project URL** | `.env.local` → `VITE_SUPABASE_URL` (public) | Frontend fetches | Doesn't rotate (it's a URL) |
| **Supabase anon key** | `.env.local` → `VITE_SUPABASE_ANON_KEY` (public) | Frontend fetches with user JWT layered on | User → Supabase Dashboard → Settings → API |
| **Supabase service role key** | Supabase Cloud secrets, auto-injected into edge functions as `SUPABASE_SERVICE_ROLE_KEY` | Server-side only; bypasses RLS. NEVER expose to frontend. | User → Supabase Dashboard → Settings → API → rotate |
| **SnapTrade Client ID** | `supabase secrets set SNAPTRADE_CLIENT_ID=...` | Injected into edge functions only | User → https://dashboard.snaptrade.com |
| **SnapTrade Consumer Key** | Same (Supabase secrets) | Signs HMAC on every request | Same dashboard |
| **OpenAI API key** | `supabase secrets set OPENAI_API_KEY=...` | AI trade extraction edge function | User → https://platform.openai.com/api-keys |
| **Anthropic API key** (for you) | `ANTHROPIC_API_KEY` env var OR `claude login` (subscription) | You use it to think | User → https://console.anthropic.com |
| **Vercel deploy token** | User's Vercel account, connected to GitHub | Auto-deploys on push to main | User → Vercel dashboard |
| **Cloudflare** | User's Cloudflare account | DNS + CDN | User → Cloudflare dashboard |

**You never need to see any of these values in plain text.** You reference them by env var name or by `supabase secrets set KEY=<...user pastes...>`. If you find one in the repo, that's a leak — flag immediately.

## 5. The three "not yet deployed" things

The prior session finished code but didn't push these to production. Ask the user which they want to deploy first.

### A. SnapTrade 1-click exchange integration

**Status:** Code complete. Migrations written. Not deployed.

**To deploy (30 min):**
```bash
# 1. Apply the migration
supabase db push
# (Applies 20260424130000_create_aggregator_connections.sql among others)

# 2. Get credentials from https://dashboard.snaptrade.com/signup
#    Free tier: 10 users connected

# 3. Set secrets
supabase secrets set SNAPTRADE_CLIENT_ID=<Client ID from SnapTrade>
supabase secrets set SNAPTRADE_CONSUMER_KEY=<Consumer Key from SnapTrade>

# 4. Deploy the 5 auth-required functions + 1 webhook
for f in snaptrade-register-user snaptrade-login-link snaptrade-list-connections snaptrade-sync-trades snaptrade-disconnect; do
  supabase functions deploy $f
done
supabase functions deploy snaptrade-webhook --no-verify-jwt

# 5. Configure webhook in SnapTrade dashboard:
#    URL: https://<project>.supabase.co/functions/v1/snaptrade-webhook
#    Events: select all (CONNECTION_ADDED, CONNECTION_DELETED, CONNECTION_BROKEN, ACCOUNT_HOLDINGS_UPDATED, etc)
```

**Full guide:** `SNAPTRADE_SETUP.md` in the repo root.

**Verify:** `npm run dev` → log in → `/exchanges` → 1-Click tab → click any broker logo → SnapTrade popup should open. If it errors "Missing env var SNAPTRADE_CLIENT_ID", secrets are missing.

### B. Blog CMS + 4 new articles

**Status:** Migrations written. Table not created in Supabase. Articles are in-code fallback only.

**To deploy (10 min):**
```bash
# Apply migrations (creates blog_posts table + inserts 4 new articles)
supabase db push
# Also applies 20260424120000_create_blog_posts_cms.sql and 20260424_add_4_articles.sql
```

Once the table exists, the blog reads from Supabase first, falls back to in-code articles. You can add new posts via a future `/blog-admin` UI (route exists but is stubbed).

### C. First SEO wave (week 1 of the SEO Master Plan)

**Status:** Plan documented in `SEO_MASTER_PLAN.md`, not executed.

**Week 1 action items:**
1. Verify GSC ownership + submit sitemap (`https://www.thetradingdiary.com/sitemap.xml`)
2. Verify Bing Webmaster + enable IndexNow
3. Baseline Lighthouse (top 5 pages)
4. Install `web-vitals` npm package + wire to GA4
5. Convert `hero-mockup.png` to WebP (image optimization)
6. Publish first article (`binance-trade-history-export-complete-guide` — draft in `SEO_EDITORIAL_CALENDAR.md`)
7. Submit product to AlternativeTo.net + Crunchbase
8. Outreach: 30 podcast pitches + 30 blog pitches (list to be built)

Full week-by-week plan in `SEO_MASTER_PLAN.md` § 13.

## 6. Deploy pipeline

**Frontend (Vercel — auto):**
- Push to `main` → Vercel builds → live at `https://www.thetradingdiary.com` in ~90s
- Preview deploys for every PR
- If build fails, check Vercel dashboard OR `vercel logs <deployment>`
- Env vars for Vercel are in Vercel dashboard → Project → Settings → Environment Variables (mirror `.env.local` + any prod-only)

**Backend (Supabase — manual):**
- Edge functions deploy with `supabase functions deploy <name>` — NOT via git
- DB migrations deploy with `supabase db push` — from `supabase/migrations/`
- Secrets set with `supabase secrets set` — one-time per new secret

**DNS/CDN (Cloudflare):**
- `www.thetradingdiary.com` → Vercel (CNAME)
- `thetradingdiary.com` → 301 → `www.thetradingdiary.com`
- Cache purge: user does it in Cloudflare dashboard when needed

## 7. First-prompt guidance for Claude Code

When the user opens Claude Code in this repo for the first time and types a request, your first response should:

1. Confirm you've read `CLAUDE.md` (mention 1-2 principles to prove it)
2. Confirm you've read `HANDOFF_TO_CLAUDE_CODE.md` (this file)
3. Run the setup checklist in § 3
4. Report the result
5. Ask what to work on

Example:
```
I've read CLAUDE.md and HANDOFF_TO_CLAUDE_CODE.md. Two ground rules I'll follow:
- Apple Premium Glass design system, never terminal/CRT
- .maybeSingle() on user_settings queries, never .single()

Running setup checklist:
✓ Repo clean, on main
✓ Node v22.5.1
✓ deps installed
⚠  .env.local missing VITE_APP_ENV — will use default 'development'
✓ tsc --noEmit clean
✓ dev server responds 200
✓ supabase CLI logged in, gh CLI logged in

Ready. Three "not yet deployed" items are:
1. SnapTrade integration (needs 2 secrets + `supabase functions deploy`)
2. Blog CMS migration (needs `supabase db push`)
3. Week 1 of SEO plan (GSC, Lighthouse, first article)

Which do you want first — or something else?
```

## 8. Common pitfalls (things that already broke once)

- **Terminal aesthetic sneaking back** — if you see `.chromatic`, `.scanlines`, `.glitch`, `.term-header` in new code, that's a regression. Only the SHIM classes (`.term-card` → aliases to `.card-premium`) are allowed to exist.
- **UPPERCASE headline** — always sentence case. If a UI review flags it, blame yourself.
- **`.single()` on user_settings** — always `.maybeSingle()`. `.single()` throws on 0 rows.
- **Missing `.catch/.finally` in auth flows** — every `await supabase.auth.getSession()` needs `.catch(() => {}).finally(() => setLoading(false))`.
- **Rendering `$0.00` for missing data** — use `—` (em-dash) in `text-space-400`.
- **Rewriting the whole `CommandCenterContent.tsx`** — resist the urge. The overview layout is deliberately hardcoded. Add rows, don't reshape.
- **Adding widgets to the customizable grid** — that grid is currently unused on the overview. Adding a widget there won't make it appear. Edit `CommandCenterContent.tsx` directly for overview widgets.
- **Forgetting sitemap** — every new public URL must go in `public/sitemap.xml` with `<lastmod>` today, or Google won't find it.
- **Forgetting hreflang** — actually don't touch it manually anymore. `<SEO>` auto-derives from canonical since the last fix.
- **`supabase secrets set` locally** — that command sets secrets in the Supabase cloud project, not your local `.env`. Don't confuse them.
- **Vercel env vars** — Vercel doesn't read `.env.local` automatically. You mirror them in the Vercel dashboard.

## 9. If something breaks in production

1. Check Vercel deploys → last successful vs first failed
2. Check Supabase Function logs (`supabase functions logs <name>`)
3. Check Sentry (if wired) or browser console via user
4. If it's a data issue: check Supabase DB → run a targeted query with `supabase db psql` (never edit prod data without the user's explicit OK)
5. If it's a routing issue: check `App.tsx` + `TopNavigation.tsx` — 90% of routing bugs are here

## 10. Your responsibility to keep this doc current

Every time you make a change that would confuse a future agent, update `CLAUDE.md` or this file (whichever is more relevant). Docs rot faster than code — the discipline of updating them is what makes this handoff work.

If you find something in these docs that's wrong, fix it as part of your PR. Don't just work around it.

## 11. What to tell the user right now

If they just opened Claude Code for the first time, they probably want to hear:

> "I'm ready. I read the two handoff docs. The setup is clean. There are 3 things ready to deploy (SnapTrade, blog migration, SEO week 1) and the SEO plan has 12 weeks of editorial + programmatic pages queued. What do you want to tackle first?"

Don't recite this file back at them — they wrote it (or their AI did). Just prove you read it by naming the principles you'll follow.

---

*Written: 2026-04-24. This is the operational handoff. For product context, read CLAUDE.md. For the Telegram bot spec, read AI_TRADING_MENTOR_BOT_SPEC.md.*
