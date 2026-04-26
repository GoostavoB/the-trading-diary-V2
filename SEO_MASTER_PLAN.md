# The Trading Diary — SEO Master Plan

**Version 1.0 · 2026-04-24**
**Owner:** Gustavo Belfiore
**Goal:** Move from current ~0 organic traffic to **5,000+ monthly organic visits** within 12 weeks, and establish a content moat that compounds for 12+ months.

---

## 1. Executive summary

The Trading Diary has a clean technical foundation (Apple Premium UI, fast Vite/React build, RLS-protected Supabase backend) and the SEO basics are already in place: structured data (SoftwareApplication + Organization + WebSite + FAQ schemas), llms.txt for AI crawlers, multilingual hreflang (en/pt/es/ar/vi), 9 starter blog articles, sitemap with 35 URLs.

**What we're missing to ship organic growth:**

1. **Keyword targeting** — articles exist but aren't aimed at *specific* high-intent queries with verified search demand.
2. **Topical authority** — 9 articles is a thin layer. Search engines need to see we've covered the cluster end-to-end.
3. **Programmatic surface area** — we have one product page, no comparison pages, no exchange-specific landing pages, no calculator landing pages. Missing 100+ rankable pages.
4. **Backlinks** — 0 external authority signals. The product is good; the world doesn't know.
5. **Technical edges** — Core Web Vitals not measured, image optimization not enforced, no internal-linking matrix, no schema beyond the homepage.

**12-week target:**
- Publish **24 new articles** (2/week) hitting verified keywords
- Ship **5 programmatic page templates** producing 60+ landing pages
- Build **20 quality backlinks** via outreach, guest posts, founder-led content
- Achieve **80+ Lighthouse score** mobile, all CWV in green
- **Index 200+ URLs** in Google + Bing Webmaster Tools
- Be **cited in ≥3 AI engine answers** (Perplexity, ChatGPT search, Gemini) for crypto trading journal queries

---

## 2. Current state audit (what's already done)

### ✅ Solid
- **Structured data**: SoftwareApplication, Organization (with founders, knowsAbout, contactPoint, sameAs), WebSite + SearchAction, FAQ (18 Q&As), BreadcrumbList in BlogPost, Article schema per blog post, Person schema for author
- **Crawler access**: robots.txt allowlists Googlebot, Bingbot, Slurp, DuckDuckBot, GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot, anthropic-ai, Claude-Web, Google-Extended, CCBot, Applebot, Bytespider, Amazonbot, Meta-ExternalAgent, MistralAI-User, YouBot, etc — and disallows private routes (/dashboard, /settings, /auth, etc).
- **Sitemap**: 35 URLs with hreflang, lastmod current (2026-04-24), Sitemap declared in robots.txt.
- **GEO files**: `llms.txt` (spec-compliant) + `llms-full.txt` (~2000 words) for AI crawlers.
- **Multilingual**: 5 languages with proper hreflang reciprocation, x-default fallback.
- **Per-page SEO helper**: `src/components/SEO.tsx` + `src/utils/seoHelpers.ts` enforce title/description/canonical/OG/Twitter on every public page.
- **OG images**: localized PNGs for all 5 languages.

### ⚠️ Half-built
- **Content depth**: 9 articles, mostly evergreen. Not enough for topical authority.
- **Author page**: real bio for Gustavo exists but lacks credibility signals (Twitter follower count, podcast appearances, articles cited elsewhere, headshot).
- **Internal linking**: ad-hoc. No matrix, no anchor-text strategy, no hub-and-spoke design.

### ❌ Missing
- **Keyword research with verified volumes** (we wrote articles based on the ROADMAP guess list, not data)
- **Programmatic pages** (vs-competitor, exchange tutorials, calculator pages, "best X for Y" lists)
- **Backlinks** — 0 external referrals tracked
- **Core Web Vitals dashboard** — never measured
- **GSC + Bing Webmaster** properly configured and monitored
- **GA4 events** for funnel tracking (signup from organic, blog → app conversion)
- **AI search citation tracking** (we don't know if Perplexity/ChatGPT/Gemini cite us)
- **Wikipedia / Wikidata entity** — high-leverage authority signal we don't have
- **Schema coverage** beyond homepage (specific schemas for calculators, tutorials, comparison pages)
- **404 monitoring**, **redirect strategy**, **canonical drift checks**

---

## 3. Strategic goals (12 weeks)

| Metric | Now | Week 4 | Week 8 | Week 12 |
|---|---|---|---|---|
| Indexed URLs (Google) | ~30 | 80 | 150 | 250+ |
| Monthly organic sessions | ~0 | 500 | 1,800 | 5,000+ |
| Ranking keywords (top 10) | 0 | 5 | 25 | 80+ |
| Referring domains | 0 | 5 | 12 | 25+ |
| Avg LCP (mobile) | unknown | <2.5s | <2.0s | <1.8s |
| AI citation appearances | unknown | 1+ | 3+ | 8+ |
| Blog → signup conversion | n/a | 0.5% | 1.5% | 2.5% |

These targets assume aggressive but realistic execution. If we miss the content cadence (2 articles/week), all downstream targets shift.

---

## 4. Keyword universe overview

See `SEO_KEYWORDS.md` for the full 60+ keyword research with intent, difficulty, volume estimates, and SERP analysis.

**Cluster summary:**

1. **Crypto trading journal** (head terms — high comp, slow burn) — chase via topical authority over 12+ weeks
2. **Position sizing / risk management** (high-intent informational — fastest wins)
3. **Trading psychology** (long-tail — easy wins, weak SERPs)
4. **Comparisons / alternatives** (BOFU — highest conversion intent)
5. **Exchange-specific** (programmatic, low-comp)
6. **AI / new tech**
7. **Tax / reporting** (seasonal, high intent)
8. **Educational head terms** (TOFU, internal linking targets)

**Decision rule for prioritization:** start with clusters 3 (psychology long-tail), 5 (exchange tutorials), and 4 (comparisons) — fastest to rank, highest LTV when they convert. Cluster 1 is a 6-month play.

---

## 5. Editorial calendar (12 weeks)

See `SEO_EDITORIAL_CALENDAR.md` for the full 24 article briefs with outlines, internal linking, and schema specs.

**High-level rhythm:**

| Weeks | Theme | Articles |
|---|---|---|
| 1-3 | Foundation | What makes a journal useful · Profit Factor explained · How to start in 30 min · Win rate vs R:R · 3 numbers every trader tracks · Trade tagging strategy |
| 4-6 | Risk management | Position sizing for perps · Drawdown thresholds · Stop-loss placement methods · Funding fees explained · Daily loss locks · Anti-martingale |
| 7-9 | Psychology + behavior | Why you hold losers · FOMO systems · Building a routine · Detecting tilt early · Trade reviews that work · Discipline ≠ willpower |
| 10-12 | Conversion + comparisons | TradeZella alternative · Tradervue vs us · Best free journal · Edgewonk for crypto · Binance export tutorial · Bybit history guide |

**Production cadence:**
- Mon: write outline + research
- Tue: draft 1500-1800 words
- Wed: edit, add internal links, generate cover image
- Thu: publish + cross-promote (Twitter, Reddit, niche forums)
- Fri: 2nd article draft starts
- Sat-Sun: edit + schedule for Mon publish

**One person can sustain this. If hiring help: a freelance trading writer at $0.10-0.15/word = $200-300/article × 24 = $5-7k for the whole calendar.**

---

## 6. Programmatic SEO (5 templates → 60+ pages)

See `SEO_PROGRAMMATIC.md` for full templates, URL patterns, and implementation specs.

**Templates ranked by ROI:**

1. **Exchange tutorials** (`/exchanges/{slug}/trade-history-export`) — 11 pages × decent volume, near-zero competition, easy to build (we already have exchange logos and adapter docs)
2. **Calculator landing pages** (`/calculators/{slug}`) — 6 pages, embed live calculator + educational content. High dwell time, easy to rank because most competitors are just ad-stuffed pages
3. **Competitor comparisons** (`/vs/{competitor}`) — 5 pages (TradeZella, Edgewonk, Tradervue, TraderSync, Trademetria). BOFU, highest conversion intent
4. **"Best X for Y" listicles** (`/guides/best-{thing}-for-{persona}`) — 8 pages
5. **Strategy/setup pages** (`/strategies/{slug}`) — 10-15 pages long-tail

**Engineering effort:** ~1 sprint (1 week of focused dev). Templates 1+2 can ship Week 3, Template 3 Week 5, Templates 4+5 Weeks 7-9.

---

## 7. Authority building (backlinks + mentions)

We will not rank Cluster 1 head terms without backlinks. Plan:

### Tier 1 — Founder-led, week 1-12
- **Twitter/X presence** (currently sparse). Daily posts about real trades, lessons, with screenshots from The Trading Diary. Post-discovery → website. Goal: 1k followers in 12w.
- **Reddit** — r/cryptocurrency, r/trading, r/algotrading, r/cryptocurrencytrading. Don't spam links. Provide value, occasionally mention "I built a tool that does X". Goal: 5 useful threads/week, 2 link-worthy.
- **Hacker News** Show HN of a calculator (best one: position size calculator) — Week 6. ~10% chance of front page = ~50-200 high-quality referrals.
- **Indie Hackers** — write a post about building TTD (Week 4 + Week 10) with metrics.

### Tier 2 — Outreach (week 3-12)
- **Crypto blogs**: list of 30-50 sites that cover trading tools. Pitch a guest post (one of our editorial calendar pieces, originally + customized angle). Realistic conversion: 3-5 backlinks from this.
- **Podcast appearances**: list 20 crypto trading podcasts. Pitch with founder story. 2-3 should accept = 6+ links per podcast (show notes, transcript pages, social).
- **Trader Twitter** — DM 30 mid-tier accounts (5k-50k followers) offering free Pro for honest review. ~5-8 will accept = mentions + screenshots.
- **HARO / Help A Reporter** — answer crypto-trading queries daily. 1-2 quotes per month in big publications.

### Tier 3 — Foundational (one-time, weeks 1-4)
- **Wikipedia entity** — create a page for The Trading Diary. Threshold for notability is high; needs 3+ independent secondary sources first. Park this for week 8 after we have podcast mentions and a couple of guest posts.
- **Wikidata** — create entity (`P:?` for the company). Easier than Wikipedia. Do Week 3.
- **Crunchbase**, **Product Hunt** (Show HN-style launch — Week 8 ideally), **G2**, **Capterra**, **GetApp**, **Trustpilot** (start collecting reviews from existing users now).
- **Tool directories** — "alternative to TradeZella" directories, **AlternativeTo.net** is the biggest. Submit Week 2.

### Anchor-text strategy
- 60% branded ("The Trading Diary")
- 25% generic ("this tool", "an alternative", URL strings)
- 10% partial-match ("crypto trading journal app")
- 5% exact-match ("crypto trading journal") — used sparingly, only when natural

Don't pursue PBNs, paid links, or directory blasts. The product is real; pursue real signals.

---

## 8. Technical SEO checklist

### Already done (verify weekly)
- [x] sitemap.xml with hreflang, lastmod current
- [x] robots.txt with AI bots + private routes blocked
- [x] structured data on homepage (Organization, SoftwareApplication, WebSite, FAQ)
- [x] llms.txt + llms-full.txt
- [x] OG images per language
- [x] Per-page SEO component on every public page

### Week 1-2 priorities
- [ ] **Google Search Console** — submit sitemap, verify ownership, set preferred domain, monitor indexing
- [ ] **Bing Webmaster** — submit sitemap, verify, enable IndexNow
- [ ] **GA4** — verify events fire, configure custom event for "blog_to_signup" funnel
- [ ] **Lighthouse audit** — run on homepage, blog, blog post, pricing. Capture baseline. Target ≥85 mobile.
- [ ] **Core Web Vitals** — install web-vitals.js, report to GA4. Set alerts when LCP > 2.5s on any URL.
- [ ] **Image optimization** — convert PNG → WebP/AVIF; add `srcset` + `sizes`; lazy-load below-fold; ensure all `<img>` has `width`/`height` to prevent CLS.

### Week 3-6 priorities
- [ ] **Internal linking matrix** — every published article must have ≥4 inbound + ≥4 outbound internal links. Build a `linkingMap.ts` file enforced in PR review.
- [ ] **Schema for new page types** — `Calculator` schema (HowTo + SoftwareApplication for calculator pages), `ComparisonReview` (Review + ItemList) for vs pages, `HowTo` for exchange tutorials.
- [ ] **404 monitoring** — Sentry breadcrumb on `<NotFound>` with the requested URL. Look at top broken paths weekly.
- [ ] **Canonical drift audit** — script that crawls our own sitemap, checks every page renders the canonical correctly, no www/non-www drift, no trailing slash inconsistency.
- [ ] **Mobile UX** — re-test all programmatic templates on iPhone. CLS especially.

### Week 7-12 priorities
- [ ] **Structured data testing tool** monthly check (Google Rich Results Test) — every page type should validate
- [ ] **JS-rendering audit** — confirm Googlebot sees the SEO meta and main content (use Google's URL Inspection tool). React + Vite renders client-side; we must verify Googlebot waits for paint.
- [ ] **Mobile-first indexing** confirmed in GSC for every URL
- [ ] **Page experience signals** stable across cohort

### Tracking dashboard (monthly review)
| Source | What to read |
|---|---|
| GSC Performance | Impressions / clicks / position trend per query, per page |
| GSC Coverage | Indexed vs Excluded — investigate any "Crawled — currently not indexed" |
| GSC Core Web Vitals | URLs with poor LCP/CLS/INP |
| Bing Webmaster | Same as GSC, smaller scale but Bing → Copilot citations |
| Lighthouse | Score per page type, trend |
| GA4 | Organic sessions, organic → signup conversion, organic blog dwell time |
| Backlink monitor (Ahrefs/Moz/free Ubersuggest) | New referring domains, lost links |

---

## 9. International / hreflang strategy

We have 5 languages but the **English version drives the strategy**. PT/ES come second (sizeable Brazilian and LATAM crypto trader bases), AR/VI are nice-to-have but lower priority.

**Per-language priority for the next 12 weeks:**
- EN: 100% effort — full editorial calendar
- PT: translate top 10 articles (highest converting) — outsource $50/article
- ES: translate top 5 articles — outsource
- AR: leave as is, ensure hreflang correct
- VI: leave as is

**Caveat:** machine-translated content is now penalized by Google. Use a real human editor for at least the first paragraph of each translation.

---

## 10. GEO (Generative Engine Optimization)

We've already shipped llms.txt + llms-full.txt + AI crawler allowlists + expanded Organization/Author schemas. To compound:

- **Use the AI engines as research tools weekly** — query "best crypto trading journal 2026", "crypto trading journal with AI", "Tradervue alternative" on Perplexity, ChatGPT search, Gemini. Track if/where we appear. Note who DOES appear and study their pages.
- **Wikipedia + Wikidata** entity creation (week 8 onwards) is the highest-leverage GEO play — LLMs heavily weight Wikipedia.
- **Explicit Q&A in articles**. Each new article ends with 5+ Q&As written as natural prose with FAQPage schema. LLMs love quoting these.
- **Author E-E-A-T**: Gustavo's bio with verifiable credentials. Get him quoted in 2+ industry pieces in 12 weeks (HARO).
- **Avoid LLM-spam patterns**: don't keyword-stuff, don't open every article with "In today's fast-paced crypto market...". Write like a real person who knows the topic.

---

## 11. KPIs and review cadence

**Weekly review (Monday morning, 30 min):**
- New articles published last week — against plan
- GSC: top 10 queries by impressions, top 10 by position
- New backlinks (manual check via Google Alerts + Ahrefs/Ubersuggest free)
- Any page experience regressions (Lighthouse score deltas)

**Bi-weekly (every other Wed, 60 min):**
- Editorial calendar adjustments based on what's ranking
- Outreach pipeline review (pitches sent / replies / placements)
- AI engine citation check (manual queries on Perplexity/ChatGPT/Gemini)

**Monthly (last day of month, 90 min):**
- Full retro: did we hit growth target? what worked, what didn't?
- Reforecast next month
- Update SEO_MASTER_PLAN.md with learnings

---

## 12. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Content cadence slips | High | Critical | Buffer: 4-week ahead pipeline. Hire freelancer if behind 2 weeks. |
| Google algorithm update penalizes thin programmatic pages | Medium | High | Each programmatic page must have unique data + ≥600 words original commentary. No pure templating. |
| Competitors copy our content | High | Low | Move fast, build authority faster. Originality is the moat. |
| Crypto market crash kills demand for trading journals | Medium | Medium | Diversify: emphasize "any market" angle. Forex traders, futures traders. |
| Disallow rules blocking growth (e.g., we add /pricing to robots Disallow by mistake) | Low | Critical | Pre-deploy robots.txt diff check in CI. |
| AI search displaces blue-link clicks | High (long-term) | High | This is exactly why we ship GEO. Position for citation, not just rank. |
| Wikipedia editors reject our entity | Medium | Medium | Acquire 5+ secondary sources first (podcasts, mentions in larger publications). |

---

## 13. Week-by-week execution plan

### Week 1 — Foundation
- Day 1: Submit sitemap to GSC + Bing. Verify both. Enable IndexNow.
- Day 1: Run Lighthouse on top 5 pages, capture baseline.
- Day 2: Install web-vitals reporting → GA4.
- Day 2: Image optimization — convert hero PNG to WebP. Add `width`/`height` to all `<img>`.
- Day 3: Publish Article #1 (Foundation cluster).
- Day 4: Submit to AlternativeTo.net, Crunchbase.
- Day 5: Publish Article #2.
- Weekend: Outreach list of 30 podcasts + 30 crypto blogs. Draft pitch templates.

### Week 2 — Programmatic prep
- Day 1: Implement `/exchanges/{slug}/trade-history-export` template. Ship 3 pages (Binance, Bybit, Coinbase).
- Day 2: Article #3.
- Day 3: Ship 4 more exchange pages (Kraken, KuCoin, OKX, MEXC).
- Day 4: Article #4.
- Day 5: Send 10 podcast pitches.
- Weekend: Wikidata entity submission.

### Week 3 — Calculators + first comparison
- Day 1: Position size calculator landing page (with embedded interactive calc).
- Day 2: Article #5.
- Day 3: Drawdown recovery calculator landing.
- Day 4: Article #6.
- Day 5: Submit guest post pitches (5 sites).

### Week 4 — Velocity check
- Articles #7 + #8.
- /vs/tradezella page.
- 3 more calculator pages.
- Backlink check: should have 3-5 new referring domains.
- Reforecast based on what's indexed and ranking.

### Weeks 5-6 — Expansion
- 4 more articles.
- 4 more programmatic pages.
- HN Show post for the position size calculator.
- 2nd round outreach (15 more pitches).

### Weeks 7-8 — Authority push
- 4 more articles.
- 2 more vs pages.
- Indie Hackers post.
- Podcast recordings (assume 2 booked from Week 1-3 outreach).
- Wikidata public, attempt Wikipedia draft.

### Weeks 9-10 — Conversion focus
- Articles aimed at BOFU keywords.
- 2 more comparison pages.
- A/B test blog → signup CTA.
- Translate top 5 articles to PT.

### Weeks 11-12 — Push and review
- Last 4 articles to fill gaps in clusters.
- Translate 5 more to PT, top 5 to ES.
- Full retro. Update KPIs. Plan next 12 weeks.

---

## 14. What I need from you (Gustavo)

To execute this plan, you need to commit:

1. **Time**: ~10-12 hours/week (writing, outreach, podcasts) — OR — $1500/month for a freelance writer who covers writing
2. **Decisions**:
   - GA4 + GSC + Bing Webmaster setup (30 min, do today)
   - Approve which 5 competitors we make /vs pages for
   - Approve podcast pitch list (or replace any you don't want)
   - Sign off on the editorial calendar (or red-line specific articles)
3. **Founder presence**: be willing to write 2 honest first-person posts (Indie Hackers + Hacker News) about building TTD. They're the highest-ROI links you'll get.

---

## 15. Companion documents

- **`SEO_KEYWORDS.md`** — the 60+ keyword universe with research-backed estimates
- **`SEO_EDITORIAL_CALENDAR.md`** — 24 article briefs with outlines and internal linking
- **`SEO_PROGRAMMATIC.md`** — 5 page templates spawning 60+ pages with implementation specs
- **`SEO_TECHNICAL_AUDIT.md`** — Core Web Vitals baseline, Lighthouse opportunities, structured data validation results

Read those next, then come back here for the week-by-week plan.

---

*This document is a living artifact. Update it after every monthly review. Don't let it gather dust.*
