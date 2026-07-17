# CLAUDE.md — Read this first

You are Claude Code, a coding agent. You've just been opened on **The Trading Diary V2** (`thetradingdiary.com`), a crypto-specific trading journal + AI analytics platform. This file is your onboarding brief. Read it entirely before touching code — every line is here because of a real decision or a real bug.

---

## 1. Product in one paragraph

The Trading Diary is a crypto-native trading journal for active perpetuals + spot traders. Users import trades (CSV, screenshot OCR, or 1-click via SnapTrade aggregator), then get a dashboard with real P&L, win rate, profit factor, drawdown, position-size analysis, capital projection with realistic caps, and behavioral insights. The primary user (and founder) is a Brazilian crypto perp trader named Gustavo Belfiore — product decisions optimize for that persona first. Live at `https://www.thetradingdiary.com`.

## 2. Stack

- **Frontend:** Vite + React 18 + TypeScript, Tailwind, shadcn/ui, react-router-dom v6, TanStack Query, recharts, react-helmet-async, framer-motion
- **Backend:** Supabase (Postgres + Auth + Edge Functions in Deno + Storage). RLS enforced on every user-facing table.
- **State:** React Context (AuthContext, DashboardProvider, DateRangeContext, SubAccountContext) + TanStack Query for server state
- **Design system:** Apple Premium Glass — Space Gray `#1C1C1E` + Electric Blue `#0A84FF` + Apple green/red/orange/purple/cyan. Fonts: Inter (SF Pro fallback) for body, JetBrains Mono only for numbers via `.font-num` + `tabular-nums`. Utilities in `src/index.css`, tokens in `tailwind.config.ts`.
- **i18n:** 5 languages — en/pt/es/ar/vi. Translations in `src/locales/*/translation.json`. Public routes use `<lang>` prefix; canonical is English (`/`).
- **Build:** Vite. `npm run build` for prod, `npm run dev` for local (port 8080).
- **Deploy:** Vercel (frontend), Supabase Cloud (backend), Cloudflare (CDN + DNS).

## 3. Non-negotiable design principles

These are hard rules. Breaking them = ticket bounced.

1. **No terminal / CRT / cyberpunk effects.** No scanlines, no chromatic aberration, no ASCII progress bars, no phosphor green, no `.chromatic` / `.glitch` / `.scanlines` classes. That aesthetic was tried in an earlier revision and rejected. Legacy shim classes exist as aliases to `.card-premium` — safe to leave, do not extend.
2. **Apple Premium Glass everywhere.** Use `.card-premium`, `.glass`, `.chip-electric`, `.btn-primary`, `.text-gradient-electric`. Real backdrop-blur, real shadows, real depth.
3. **Blue → cyan gradient is the signature.** `.text-gradient-electric` (135°, `--electric-blue` → `--apple-cyan`) on all hero numbers, section headings, primary CTAs. See landing Hero as reference — "Every trade. Every lesson. Every edge." uses this exact gradient.
4. **Sentence case, never UPPERCASE HEADLINES.** No `tracking-widest` on big text. No badges like "ELITE" or "EXCELLENT" (subjective). Use tier chips with actionable labels: `Strong edge / Profitable / Marginal — review setups / Losing system`.
5. **Real numbers or em-dash.** Never render `$0.00` when data is missing — render `—` in `text-space-400`. Same for `0m` on holding time, `N/A` on best/worst day. Empty state must feel intentional, not broken.
6. **Tabular nums on every number.** Use `.font-num` or `tabular-nums` class. Prevents column shift when digits change.
7. **Realism caps on projections.** `OneYearProjectionWidget` clamps daily growth to `[0.95, 1.02]` per trade and total multiplier to `[0.05, 50]`. This is a **feature**, not a bug. Small samples grossly overstate compounded returns — without caps you get "$7.95 billion in 1 year" from 23 trades. Do not remove.
8. **Profit Factor is `grossProfit / grossLoss`** — not `avgWin / avgLoss`. Fix applied in `src/hooks/useDashboardStats.ts`. Never regress. If someone asks why the number changed after your PR, it's because you broke it.
9. **All async Supabase queries against `user_settings` and similar single-row tables use `.maybeSingle()`, not `.single()`.** `.single()` throws on 0 rows, which happened for fresh users → infinite loading. Fixed everywhere. Keep it fixed.
10. **`AuthContext.getSession()` must have `.catch(() => {}).finally(() => setLoading(false))`** — was a critical hang bug. Do not remove.

## 4. Repository layout (only what you'll touch often)

```
src/
├── App.tsx                              # Route table (public + ProtectedRoute wrappers)
├── index.css                            # Design system foundation (Apple Premium)
├── main.tsx
├── pages/
│   ├── Index.tsx / IndexPt|Es|Ar|Vi.tsx # Landing pages (5 langs)
│   ├── Auth.tsx                         # Sign in / sign up (with .catch fix)
│   ├── Dashboard.tsx                    # Main app shell with tabs (Overview/TradeStation/History/Planning)
│   ├── Pricing.tsx / PricingPage.tsx    # Uses pricing.plans.basic.* (NOT starter.*)
│   ├── Blog.tsx / BlogPost.tsx          # Fed by Supabase `blog_posts` + static fallback
│   ├── ExchangeConnections.tsx          # 2 tabs: 1-Click (SnapTrade) + API Key (advanced)
│   ├── ExchangeTutorial.tsx             # Programmatic SEO — /exchanges/:slug/trade-history-export
│   ├── Forecast.tsx                     # Capital projection, scenarios with realism caps
│   ├── CapitalManagementPage.tsx
│   ├── Settings.tsx, About.tsx, Contact.tsx, FAQ.tsx, Author.tsx
│   └── ...
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   └── TopNavigation.tsx            # Header: Dashboard / Trades / Analytics / Planning / History
│   ├── dashboard/
│   │   ├── DashboardHeader.tsx
│   │   └── tabs/
│   │       ├── CommandCenterContent.tsx # Overview: TotalCapital + Projection + Highlights + Quality + Behavior
│   │       ├── TradeStationContent.tsx  # Risk Engine tab
│   │       ├── HistoryContent.tsx / CalendarContent.tsx
│   │       ├── GoalsContent.tsx / RollingTargetContent.tsx / DREContent.tsx
│   ├── widgets/
│   │   ├── TotalBalanceWidget.tsx / WinRateWidget.tsx / ProfitFactorWidget.tsx
│   │   ├── TotalCapitalWidget.tsx       # HERO — initial → current, drawdown shaded, timeframe tabs
│   │   ├── OneYearProjectionWidget.tsx  # Interactive slider 7d→5y, compound/linear, CAP APPLIED
│   │   ├── AvgROIPerTradeWidget.tsx     # DO NOT put a circle gauge here — mini bar chart, per user
│   │   └── TotalTradesWidget.tsx        # Dot matrix + streak chip
│   ├── insights/
│   │   ├── InsightsQuickSummary.tsx     # KPI strip (top of overview)
│   │   ├── PerformanceHighlights.tsx    # Best/Worst Trade + Streak + Best/Worst Day
│   │   ├── TradingQualityMetrics.tsx    # R:R + Win/Loss + Drawdown + Avg Win/Loss + Expectancy
│   │   └── BehaviorAnalytics.tsx        # Holding time distribution + Position size + LEVERAGE WARNING
│   ├── exchanges/
│   │   ├── QuickConnect.tsx             # SnapTrade 1-click UI
│   │   └── ConnectedAccountsList.tsx
│   └── SEO.tsx                          # Per-page meta with AUTO-DERIVED hreflang chain
├── services/
│   └── exchanges/aggregator/SnapTradeService.ts  # Wrapper for snaptrade-* edge functions
├── hooks/
│   ├── useDashboardStats.ts             # PF, gross profit/loss, drawdown, streak — TREAT AS CANONICAL
│   ├── useRiskCalculator.ts             # Trade Station calculator
│   └── useOnboarding.ts                 # Uses .maybeSingle()
├── providers/dashboard/DashboardProvider.tsx
├── contexts/
│   ├── AuthContext.tsx                  # Has .catch/.finally on getSession — DON'T regress
│   └── SubAccountContext.tsx            # user?.id guard on realtime effect
├── data/
│   ├── exchangeTutorials.ts             # Programmatic SEO data (Binance, Bybit, Coinbase — extend for more)
│   └── blogArticles/englishArticles.ts  # In-code fallback for blog posts (also in Supabase)
├── types/
│   ├── trade.ts / dashboard.ts / widget.ts / aggregator.ts / theme.ts
├── locales/{en,pt,es,ar,vi}/translation.json  # NEVER duplicate keys, KEEP synced across langs
├── lib/forecastCalculations.ts          # Scenarios with realism caps (Forecast page)
└── utils/
    ├── insightCalculations.ts           # calculateMaxDrawdown (peak-to-trough, not min trade)
    ├── tradingDays.ts
    └── formatNumber.ts / seoHelpers.ts

supabase/
├── functions/
│   ├── _shared/{snaptrade.ts,cors.ts}
│   ├── snaptrade-{register-user,login-link,list-connections,sync-trades,disconnect,webhook}/
│   ├── ai-pattern-recognition/
│   ├── extract-trade-info/
│   ├── process-multi-upload/
│   ├── monitor-performance-alerts/
│   └── disconnect-exchange/
└── migrations/
    ├── 20260424120000_create_blog_posts_cms.sql
    ├── 20260424130000_create_aggregator_connections.sql
    └── 20260424_add_4_articles.sql

public/
├── sitemap.xml                          # 35 base URLs + 3 programmatic (extend for new pages)
├── robots.txt                           # AI crawlers explicitly allowed, private routes blocked
├── llms.txt / llms-full.txt             # For LLM crawlers (GEO — Generative Engine Optimization)
├── manifest.json
├── og-image-{en,pt,es,ar,vi}.png
├── exchange-logos/*.svg                 # Binance, Bybit, Coinbase, Kraken, etc
└── image-sitemap.xml
```

## 5. Living docs (read these before big changes)

Every doc below is in the repo root:

- **SEO_MASTER_PLAN.md** — 12-week SEO strategy, KPIs, week-by-week execution plan
- **SEO_KEYWORDS.md** — 60+ verified keywords with volumes, difficulty, intent
- **SEO_EDITORIAL_CALENDAR.md** — 24 article briefs with outlines, internal linking targets, primary/secondary keywords
- **SEO_PROGRAMMATIC.md** — 5 page templates spawning 60+ pages, specs and data requirements
- **SEO_TECHNICAL_AUDIT.md** — Core Web Vitals opportunities, structured data coverage, CI/CD pipeline
- **SNAPTRADE_SETUP.md** — full setup guide for 1-click exchange integration (client ID, secrets, functions to deploy, webhook config)
- **ROADMAP_TRADING_DIARY.md** — older sprint backlog, some items done
- **UX_AUDIT_TRADING_DIARY.md** — UX review with prioritized fixes (some already applied)
- **HANDOFF_TO_CLAUDE_CODE.md** — sibling to this file, has env vars + commands + first-prompt guidance
- **AI_TRADING_MENTOR_BOT_SPEC.md** — spec for a planned Telegram bot MVP (see §12)
- **BACKLOG.md** — feature backlog (large, dated)

## 6. Recent big decisions (avoid re-relitigating)

- **Design pivoted from Cyberpunk/Terminal → Apple Premium Glass** (revision 3). Do not bring back CRT effects. Legacy CSS shims exist and can stay.
- **Blue → cyan gradient is the visual signature** — user-requested, spread across all hero numbers and CTAs.
- **SnapTrade is the exchange integration path** (not per-exchange OAuth). Manual API keys stay as advanced fallback. See SNAPTRADE_SETUP.md.
- **Profit Factor fix** was a real bug (`avgWin/avgLoss` → `grossProfit/grossLoss`). If you touch `useDashboardStats.ts`, keep it correct.
- **Projection widget has aggressive caps on purpose.** Small samples grossly overstate — the cap is a feature.
- **Top nav simplified** to 5 items: Dashboard, Trades (submenu: Fee Analysis, Risk Management, Exchanges), Analytics (submenu: Forecast, Market Data with Long/Short merged in), Planning (submenu: Goals, Capital Management), History. Blog is **public-only** (removed from internal nav; users log out to reach it). Removed Spot Wallet, Trading Plan, Psychology, Analytics dashboard tab, Tax Reports, Journal (hidden — files still exist).
- **Overview layout is hardcoded** in `CommandCenterContent.tsx`, NOT driven by widget catalog. To add a widget to the overview, edit `CommandCenterContent.tsx` directly. The widget catalog + drag-and-drop layout exists but only for the customizable grid (currently unused on Overview).
- **Hreflang chain auto-derived** from canonical in `SEO.tsx`. Do not hardcode per-page hreflang unless overriding.
- **3 new themes registered** in Theme Studio (Neon, Midnight Gold, Sunset Wave). Do not delete.
- **Auth bootstrap** has `.catch/.finally` in `AuthContext.tsx` — was a critical hang bug.
- **`.single()` → `.maybeSingle()`** everywhere `user_settings` is queried.
- **Total Capital widget is the hero of the Overview** — big number, blue gradient, drawdown shaded area, timeframe tabs (7D/1M/3M/6M/YTD/ALL).
- **Projection widget is interactive** — slider 7d → 5y, Compound/Linear toggle, milestone lines at $1K/$10K/$50K/$100K, "Capped for realism" chip appears when overflow triggered.
- **URL sync for tabs** — `Dashboard.tsx` uses `useLocation()` to keep `activeTab` in sync with `?tab=` query param (fixed a bug where clicking History from top nav didn't switch tab).
- **Logo is clickable** — wrapped in `<NavLink to="/dashboard">` in `TopNavigation.tsx`. Web convention.
- **Risk Calculator** in Trade Station stopped infinite-loading — `useRiskCalculator.ts` now calls `setLoading(false)` even when user is null.

## 7. Common commands

```bash
# Dev server
npm run dev                     # http://localhost:8080

# TypeScript check — MUST PASS BEFORE EVERY COMMIT
npx tsc --noEmit

# Lint
npm run lint

# Production build
npm run build
npm run preview                 # test the prod build locally

# Tests
npm run test                    # vitest
npm run test:ui                 # vitest UI

# Supabase — apply migrations
supabase db push

# Supabase — deploy an edge function
supabase functions deploy <function-name>
supabase functions deploy <function-name> --no-verify-jwt   # webhooks

# Supabase — set a secret (secrets are per-project, live on Supabase cloud)
supabase secrets set KEY=value

# Supabase — inspect logs of an edge function
supabase functions logs <function-name>

# Git — the flow this repo uses
git checkout -b feat/whatever
# ...edit...
npx tsc --noEmit                # gate
git add -A
git commit -m "feat: description"
git push -u origin feat/whatever
gh pr create --title "..." --body "..."
```

## 8. Environment variables

Frontend (`.env.local` at repo root — **NOT committed**, in `.gitignore`):

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APP_ENV=development
```

Backend (Supabase Secrets, set via `supabase secrets set KEY=value`):

```
# Supabase provides these automatically to every edge function:
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# You must set these manually:
SNAPTRADE_CLIENT_ID          # from https://dashboard.snaptrade.com
SNAPTRADE_CONSUMER_KEY       # from same dashboard
OPENAI_API_KEY               # for AI trade extraction / pattern recognition
TELEGRAM_BOT_TOKEN           # mentor bot — from @BotFather
TELEGRAM_WEBHOOK_SECRET      # mentor bot — random string, shared with setWebhook
TELEGRAM_BOT_USERNAME        # mentor bot — username without @, builds deep links
```

Never commit any of these. If you see one leaked, rotate immediately.

## 9. How to add a new feature (checklist)

1. Read this file. If your change affects any principle in §3, stop and check with Gustavo before writing code.
2. `git checkout -b feat/<name>` from `main`.
3. Write it.
4. `npx tsc --noEmit` — must pass with zero errors.
5. If UI: use Apple Premium tokens, sentence case, `.font-num` for numbers, em-dash for missing data.
6. If public page: use `<SEO>` component with title/description/canonical, add entry to `public/sitemap.xml` with `lastmod` today.
7. If Supabase function: shared code goes in `supabase/functions/_shared/`, document in a `SETUP.md` sibling, use `.maybeSingle()` never `.single()`, always `.catch()` async chains.
8. If new env var: mention in HANDOFF_TO_CLAUDE_CODE.md § "Environment variables" and here (§8).
9. If DB schema change: write a migration `supabase/migrations/YYYYMMDDHHMMSS_description.sql` with `IF NOT EXISTS` guards, RLS policies, and helpful `COMMENT ON TABLE`.
10. Commit with a message explaining the *why*, not just the *what*.
11. `gh pr create` — never push directly to main.

## 10. What NOT to do

- Don't add npm packages without asking (bundle size discipline — every dep costs LCP)
- Don't introduce `any` types just to make TS shut up — fix them properly
- Don't rewrite CSS globally — extend, don't replace
- Don't touch RLS policies without understanding what data leaks
- Don't remove `.catch/.finally` from any auth/loading flow — it's there because of a real bug
- Don't UPPERCASE headlines or use `tracking-widest` on big text
- Don't render `$0.00` for missing data (use em-dash)
- Don't disable ESLint rules globally
- Don't commit `.env`, `.env.local`, or any file with a secret
- Don't push to `main` — always PR
- Don't merge without `npx tsc --noEmit` passing
- Don't invent new colors — use the Apple palette in `tailwind.config.ts`
- Don't create new `.md` docs in the root for one-off notes — put them in `docs/` (create if missing)

## 11. Who to ask

- **Product / design decisions**: Gustavo Belfiore (founder, trader) — `gustavo.belfiore@gmail.com`
- **Anything in SNAPTRADE_SETUP.md**: read the doc first, then ask
- **Bug reports from users**: reproduce first, then ask for the affected trader's `sub_account_id` before touching data
- **SEO decisions**: follow SEO_MASTER_PLAN.md; if you need to deviate, flag it before shipping

## 12. Next planned feature — AI Trading Mentor Telegram Bot

Spec in `AI_TRADING_MENTOR_BOT_SPEC.md`. TL;DR:

- User connects Telegram in Settings → gets bot link → starts a chat
- Bot reads their trade history via Supabase (with their JWT, scoped to their user_id)
- Bot proactively surfaces insights: "You're on tilt — 3 losses in a row. Take a break." · "You broke your stop rule on trade #47." · "Your win rate on 15m timeframe is 62%, on 1h it's 41% — trade more of the former."
- User can ask questions: "Why did I lose money in April?" → bot pulls stats and answers with numbers
- Nightly digest: "Today's P&L: -$45. Best trade: BTCUSDT +$28. 2 rule violations."
- Stack: Telegram Bot API + Supabase Edge Function + OpenAI or Claude API + trade data

**Status (2026-07-17): P0 code complete on branch `feat/telegram-bot-p0`, not yet deployed.**
Migration + 3 edge functions (`telegram-webhook`, `telegram-notifier`, `telegram-generate-link`)
+ Settings card. Deploy checklist and deliberate spec deviations in `docs/TELEGRAM_BOT_SETUP.md`.
P2 (LLM Q&A) will port the socratic mentor brain prototyped in Gustavo's standalone
Python bot (chart vision, Mark Douglas risk audit, macro context).

---

*Last updated: 2026-04-24 by the previous agent handoff. When you make a big change, update the "Recent big decisions" section.*

*If you're reading this and something in it is wrong — fix the doc as part of your PR. Docs rot; keep them fresh.*
