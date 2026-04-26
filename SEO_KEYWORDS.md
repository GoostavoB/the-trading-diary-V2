# SEO Keyword Universe — The Trading Diary

**Domain:** thetradingdiary.com
**Market:** US-EN (primary)
**Compiled:** 2026-04-25
**Research stack:** DataForSEO Google Ads volume API, DataForSEO Labs keyword overview, DataForSEO Live Organic SERP (Google, US-EN, desktop), manual SERP review.

> **Note on volume confidence.** Where Google Ads returned a numeric volume, that value is shown. Where the keyword was rejected (zero impressions in the Ads database) but the term clearly exists in the wild (we see Reddit threads, ranking pages, and people-also-ask data on it), it is marked **Est.** with a low/med/high band. This is the standard SEO practice — Ads volume is a floor, not a ceiling, especially for technical/long-tail crypto queries that skew Reddit-native.

---

## Cluster overview

| # | Cluster | Keyword count | Total monthly volume (verified, US) |
|---|---|---|---|
| 1 | Crypto trading journals (head terms) | 11 | ~7,330 |
| 2 | Risk management / position sizing | 10 | ~770+ |
| 3 | Trading psychology | 11 | ~3,790 |
| 4 | Comparisons (BOFU) | 11 | ~37,000+ (Tradervue/Zella nav-heavy) |
| 5 | Exchange-specific (programmatic) | 12 | ~140 verified, true demand much higher |
| 6 | AI / new tech | 7 | ~200 |
| 7 | Tax / reporting | 6 | ~6,600 |
| 8 | Educational head terms (TOFU) | 10 | ~1,400 |
| **Total** | | **78 keywords** | |

---

## Cluster 1 — Crypto trading journals (head terms)

SERP analysis (verified live, 2026-04-25):

| Keyword | Top 5 ranking domains | Page type | Recency |
|---|---|---|---|
| **crypto trading journal** | tradermake.money, tradezella.com (subpath), amazon.com, ultratrader.app, tradesviz.com | 4 SaaS landing pages + 1 Amazon book listing | Mostly evergreen / 2025 |
| **best crypto trading journal** | tradesviz.com, tradervue.com (blog), tradermake.money, tradersync.com, tradezella.com | 1 listicle, 4 SaaS landings; AI Overview present citing Reddit | 2026-03 listicle |
| **trading journal app** | apps.apple.com (SuperTrader), play.google.com, reddit.com, tradervue.com, stonkjournal.com | App store + 2 SaaS + Reddit; AI Overview present | Mixed |
| **free trading journal** | stonkjournal.com, tradebench.com, reddit.com, tradesyncer.com, apps.apple.com (UltraTrader) | Free SaaS + Reddit; perspectives carousel from Reddit | Active 2026 discussions |

| Keyword | Intent | Funnel | Difficulty | Volume (US-EN) | Page type | Notes |
|---|---|---|---|---|---|---|
| crypto trading journal | Commercial | MOFU | **Med** | **70/mo** (peaks 210 in Sep 2025) | Landing (homepage) | TradeZella ranks #2 with sub-page; tradermake.money owns #1. Crypto-specific so beatable with strong landing + automation hook. |
| crypto trading diary | Navigational/Commercial | MOFU | Low | 10/mo | Landing | We literally own this brand match — "trading diary" is in our domain. Easy #1 with on-page basics. |
| best crypto trading journal | Commercial | BOFU | Med | 10/mo | Listicle + Landing | AI Overview pulls from Reddit + Tradervue blog. Need our own ranked listicle to be cited by AIO. |
| trading journal app | Commercial | MOFU | **High** | **390/mo** | Landing + App Store presence | App Store dominates #1; iOS app is table stakes here. |
| trading journal software | Commercial | MOFU | High | 320/mo | Landing | Heavily SaaS-dominated. CPC $3.58 = real buying intent. |
| crypto trade tracker | Commercial | MOFU | Low | 20/mo | Landing | CPC $8.63 — high commercial value despite low volume. |
| trading journal | Commercial | MOFU | High | **5,400/mo** | Landing | Head term. Tradervue + Zella + StockBrokers.com listicle dominate. 12-week play not realistic; 12-month play yes. |
| crypto trading log | Informational | MOFU | Low | 10/mo | Article + Landing | Same SERP as "journal"; cluster intent. |
| trading journal for crypto futures | Commercial | MOFU | Low | Est. low | Landing (futures-specific) | Surfaced in Reddit threads ("best journal for crypto futures"). Programmatic angle. |
| best journal for day traders | Commercial | BOFU | Med | Est. med | Listicle | Generic but adjacent demand. |
| perpetual futures journal | Commercial | MOFU | Low | Est. low | Landing | Niche but exact-match for our ICP (perp traders like Gustavo). |

---

## Cluster 2 — Risk management / position sizing (high-intent, calculator hooks)

| Keyword | Intent | Funnel | Difficulty | Volume | Page type | Notes |
|---|---|---|---|---|---|---|
| crypto leverage calculator | Commercial | MOFU | Low | **260/mo** | Programmatic calculator | Comp index 1. Free interactive calc + schema = quick win. |
| leverage calculator crypto | Commercial | MOFU | Low | 170/mo | Programmatic calculator | Same intent as above; build one page targeting both. |
| crypto position size calculator | Commercial | MOFU | Low | 140/mo | Programmatic calculator | Comp index very low. Featured snippet bait. |
| position size calculator crypto | Commercial | MOFU | Low | 50/mo | Programmatic calculator | |
| trading risk calculator | Commercial | MOFU | Low | 70/mo | Calculator | CPC $3.22. |
| risk per trade calculator | Commercial | MOFU | Low | 20/mo | Calculator | CPC $8.48 — very high value. |
| stop loss calculator crypto | Commercial | MOFU | Low | 10/mo | Calculator | CPC $15.78 (!!) — exceptional commercial value. |
| how to calculate position size crypto | Informational | TOFU | Low | Est. low-med | Article + embedded calc | No Ads volume but clear Reddit/YouTube demand. |
| kelly criterion crypto | Informational | TOFU | Low | 10/mo | Article | Niche-savvy traders. Authority builder. |
| max drawdown crypto | Informational | TOFU | Low | Est. low | Article | Pair with Cluster 8 "what is drawdown trading". |

**Programmatic template idea:** `/calculators/{calculator-slug}` driving 5–8 pages from one React component (position size, stop-loss, leverage, risk-per-trade, R-multiple, drawdown, Kelly).

---

## Cluster 3 — Trading psychology (long-tail, low competition)

SERP for **how to stop revenge trading**: Reddit r/Forex thread is #2 (organic #1 after AI Overview), Axi blog #6, JournalPlus #10. Forum-heavy SERP = beatable with a good article + interactive cooldown widget.

| Keyword | Intent | Funnel | Difficulty | Volume | Page type | Notes |
|---|---|---|---|---|---|---|
| trading psychology | Informational | TOFU | Med | **1,000/mo** | Pillar article | High volume, medium SERP comp (mostly broker blogs). |
| revenge trading | Informational | TOFU | Low | 260/mo | Article + tool | Comp index 1. AIO-bait. |
| fear of missing out trading | Informational | TOFU | Low | 720/mo | Article | Trending 2026-Q1 (1,600–1,900/mo). Volatile but reachable. |
| how to stop revenge trading | Informational | TOFU | Low | 30/mo | Article + cooldown checklist | Forum-dominated SERP — easy ranking with a journal-product CTA. |
| trading psychology mistakes | Informational | TOFU | Low | 10/mo | Article (10 mistakes listicle) | |
| trading discipline | Informational | TOFU | Low | 10/mo | Article | Same SERP as below. |
| discipline trading | Informational | TOFU | Low | 10/mo | Article | Dedupe with above. |
| trading journal templates | Commercial | MOFU | **High** | **720/mo** | Free download + email gate | Comp index 100. High value: gated template = lead magnet. |
| trading journal template | Commercial | MOFU | High | 720/mo | Same as plural | Dedupe, target both via H1/H2. |
| FOMO trading crypto | Informational | TOFU | Low | Est. low (no Ads data) | Article | Crypto-specific angle on the FOMO mass-volume term. |
| ai trade review | Commercial | BOFU | Low (KD 6) | 10/mo | Feature page | Trending +100% YoY per DataForSEO. Position our AI feature. |

---

## Cluster 4 — Comparisons (BOFU)

SERP for **tradezella alternative**: TraderSync (own competitor page) #2, Reddit thread #3, Trademetria #5, ForexTester #6, Tradervue #7, Edgewonk #10, JournalPlus #11. AI Overview cites JournalPlus, TraderSync, Edgewonk, Reddit — every brand with a published `/alternatives/tradezella` page gets pulled in. **Pattern is clear: build the page, get cited.**

| Keyword | Intent | Funnel | Difficulty | Volume | Page type | Notes |
|---|---|---|---|---|---|---|
| TradeZella | Navigational | — | High | **27,100/mo** | — | Don't chase brand; capture overflow with comparison pages. |
| Tradervue | Navigational | — | High | 8,100/mo | — | Same. |
| Edgewonk | Navigational | — | Med | 1,000/mo | — | Same. |
| free trading journal | Commercial | BOFU | Med-High | **1,000/mo** | Landing (free tier) | Stonk Journal owns it; SERP also includes Reddit/Notion = attackable with strong free-tier landing. |
| TradeZella alternatives | Commercial | BOFU | Med | Est. med (90/mo for "tradezella alternative" singular) | Comparison | KD ~30. Top hit gets AIO citation. |
| tradezella alternative | Commercial | BOFU | Med | 90/mo | Comparison | Comp 0.41, CPC $4.26. Build a `/alternatives/tradezella` page. |
| TradeZella vs Edgewonk | Comparison | BOFU | Low | Est. low (20/mo for "edgewonk vs tradezella") | Comparison | Build it once, target both directional spellings. |
| edgewonk vs tradezella | Comparison | BOFU | Low | 20/mo | Comparison | Same page. |
| tradezella vs tradervue | Comparison | BOFU | Low | 70/mo | Comparison | CPC $11.04. |
| best Tradervue alternative | Commercial | BOFU | Med | Est. low-med | Comparison | "tradervue alternative" = 70/mo, KD med. |
| TradeZella review | Commercial | BOFU | Low | 210/mo | Review article | CPC $8.12. Honest review with our angle. |
| Edgewonk review | Commercial | BOFU | Low | 30/mo | Review article | |
| free vs paid trading journal | Informational | MOFU | Low | Est. low | Comparison article | Builds topical authority. |

---

## Cluster 5 — Exchange-specific (programmatic potential)

SERP for **binance trade history export**: Binance's own help docs own #1, #2, #4, #6, #8. Then Reddit, then CoinTracking. **Opportunity:** none of the SaaS journals rank — they all cede this query to the exchange. We can capture by writing a deeper "how to export Binance trades AND import them into your journal" tutorial, repeated per exchange.

| Keyword | Intent | Funnel | Difficulty | Volume | Page type | Notes |
|---|---|---|---|---|---|---|
| Binance trade history export | Informational | MOFU | Low | 10/mo | Programmatic guide | Exchange docs dominate; we wedge in with "+ journal it" angle. |
| Bybit trade history | Informational | MOFU | Low | 10/mo | Programmatic guide | |
| how to track Bybit trades | Informational | MOFU | Low | Est. low | Programmatic guide | |
| Coinbase trade history download | Informational | MOFU | Low | Est. low-med | Programmatic guide | Coinbase = US largest user base. |
| OKX trade journal | Commercial | MOFU | Low | Est. low | Programmatic landing | Pair "how to export from OKX" + "OKX journal". |
| MEXC trade history | Informational | MOFU | Low | 10/mo | Programmatic guide | |
| Kraken trade history | Informational | MOFU | Low | 10/mo | Programmatic guide | |
| KuCoin trade history | Informational | MOFU | Low | 10/mo | Programmatic guide | |
| Gate.io trade history | Informational | MOFU | Low | 10/mo | Programmatic guide | |
| BingX trade history | Informational | MOFU | Low | Est. low | Programmatic guide | |
| Binance API trade history | Informational | MOFU | Low | 10/mo | Programmatic guide | Developer/power-user angle. |
| how to export trades from Binance | Informational | MOFU | Low | Est. low (clusters with #1) | Programmatic guide | |

**Programmatic template idea:** `/integrations/{exchange-slug}` — one template, ~10 pages, each ranks for the long-tail "{exchange} trade history" + "{exchange} journal" + "import {exchange} trades". Each page needs: screenshots of CSV/API export flow, our import demo, a CTA.

---

## Cluster 6 — AI / new tech

| Keyword | Intent | Funnel | Difficulty | Volume | Page type | Notes |
|---|---|---|---|---|---|---|
| AI crypto trading journal | Commercial | MOFU | Low | Est. low (no Ads data) | Landing | Brand-new category — own the term before the SERP solidifies. |
| AI trading journal | Commercial | MOFU | Low | Est. low | Landing | TradesViz already uses "AI-Powered" in title tags; we need our own positioning. |
| AI-powered trading journal | Commercial | MOFU | Low | Est. low | Landing | |
| auto trade journaling crypto | Commercial | MOFU | Low | Est. low | Landing | |
| automated trading journal | Commercial | MOFU | Low | 110/mo (spiking — 1,000 in Mar 2026) | Landing | **Trending hard.** CPC $6.98. |
| AI trade analysis | Commercial | MOFU | Med | 70/mo | Feature page | KD ~6. Steady demand. |
| screenshot to trade extract | Informational | MOFU | Low | Est. very low | Article + feature page | Almost no competition. If our product ships OCR/screenshot ingest, this is a long-tail moat. |
| AI trading insights | Commercial | MOFU | Low | 10/mo | Feature page | |
| auto-import trades crypto | Informational | MOFU | Low | Est. low | Article + feature page | Pair with exchange pages. |
| ai trade review | Commercial | BOFU | Low (KD 6) | 10/mo | Feature page | YoY +100%. |

---

## Cluster 7 — Tax / reporting (seasonal, Q1 spike)

| Keyword | Intent | Funnel | Difficulty | Volume | Page type | Notes |
|---|---|---|---|---|---|---|
| crypto tax software | Commercial | MOFU | Med | **3,600/mo** (12,100 in Jan!) | Landing or partnership | High CPC ($25.19). Heavily seasonal. Probably better as **affiliate/partnership** than building tax engine ourselves. |
| crypto tax calculator | Commercial | MOFU | Med | **2,900/mo** (8,100 in July) | Landing | Massively seasonal. |
| crypto trading taxes | Informational | TOFU | Low | 70/mo | Pillar article | Very high CPC $22.61. Educational article funneling to tax-software affiliate. |
| crypto trading tax calculator | Commercial | MOFU | High | 10/mo | Landing | Comp index 86. CPC $4.51. |
| crypto tax report tool | Commercial | MOFU | Low | Est. low | Landing | |
| futures trading tax report | Informational | TOFU | Low | Est. low | Article | Underserved — almost no good content for futures-specific tax. |
| how are crypto futures taxed | Informational | TOFU | Low | Est. low | Article | Featured-snippet bait. |

---

## Cluster 8 — Educational head terms (TOFU pillar content)

| Keyword | Intent | Funnel | Difficulty | Volume | Page type | Notes |
|---|---|---|---|---|---|---|
| trading psychology | Informational | TOFU | Med | 1,000/mo | Pillar | Already counted in Cluster 3; sits at intersection. |
| win rate | Informational | TOFU | Med | **880/mo** | Article | Brutal SERP (mixed with esports/gaming "win rate"). Need crypto-specific angle. |
| drawdown trading | Informational | TOFU | Low | 210/mo | Article | CPC $4.02. |
| profit factor trading | Informational | TOFU | Low | 110/mo | Article | Comp 0.03. Easy win. |
| expectancy trading | Informational | TOFU | Low | 70/mo | Article | Underserved educationally. |
| what is profit factor | Informational | TOFU | Low | 50/mo | Article | Featured-snippet target. |
| R multiple trading | Informational | TOFU | Low | 30/mo | Article | Nerdy but exact-match for our user persona. |
| equity curve trading | Informational | TOFU | Low | 30/mo | Article | Pair with embedded equity-curve product screenshot. |
| what is drawdown trading | Informational | TOFU | Low | 20/mo | Article | |
| what is win rate trading | Informational | TOFU | Low | Est. low | Article | |
| what is R multiple | Informational | TOFU | Low | Est. low | Article | |
| how to read equity curve | Informational | TOFU | Low | Est. low | Article | |

---

## Strategic analysis

### 1. Lowest-hanging fruit (weak SERPs, fast ranking)

Five queries where the SERP is dominated by Reddit threads, Quora, or generic broker blogs **with no dedicated SaaS landing page** owning the result:

- **how to stop revenge trading** (30/mo, growing): SERP is Reddit r/Forex #2, broker blogs (Axi, ACY, Warrior Trading), JournalPlus. No specialized journal product owns the result. A 1,500-word article + an in-app "cooldown timer" feature CTA can grab the top organic spot in 8–10 weeks.
- **profit factor trading / what is profit factor** (160/mo combined, comp 0.03): Educational gap, mostly trading-school blogs. A clean definition + interactive calculator wins.
- **crypto trading diary** (10/mo): We literally own this in our domain name. Build the homepage to target it explicitly.
- **TradeZella alternative / TradeZella vs Edgewonk / TradeZella vs Tradervue** (~180/mo combined, KD ~30): Every competitor with an `/alternatives/tradezella` page gets cited by AI Overview. Build ours, ship in week 1, iterate.
- **automated trading journal** (110/mo, spiking to 1,000 Mar 2026, CPC $6.98): AI/automation is the dominant 2026 narrative. Few entrenched dedicated landing pages; UltraTrader and CoinMarketMan ride the term loosely. We can stake it.
- **crypto leverage calculator + crypto position size calculator** (400/mo combined): Comp index 1. Existing rankers are blog-style, not real interactive tools. A real React calculator with schema markup will leapfrog them.

### 2. Highest-value but hardest (authority plays, 6–12 months)

- **trading journal** (5,400/mo): Head term. Tradervue, TradeZella, TraderSync, StockBrokers.com listicles dominate. Realistic only with sustained content + backlinks over 9–12 months, plus a strong "we're the crypto-native one" wedge.
- **trading journal app** (390/mo) and **trading journal software** (320/mo): Heavily SaaS-saturated; iOS app store presence is required for the "app" variant.
- **crypto tax software** (3,600/mo, peaks 12,100 in Jan): High CPC but capital-heavy to compete. Better played via **affiliate partnerships** with CoinLedger/Koinly than building our own tax engine.
- **trading psychology** (1,000/mo): Pillar opportunity — owning this term is brand authority gold but needs original frameworks + linkable assets.
- **fear of missing out trading** (720/mo, trending): High-volume but volatile (170 → 1,900 swings). Worth a pillar article tied to product features (FOMO-detection signals from journal data).
- **best crypto trading journal**: Now AI-Overview-driven. Long-term play: get cited by AIO via a structured, opinionated listicle that compares us against TradeZella/Tradervue/CoinMarketMan/UltraTrader.

### 3. Programmatic opportunities (one template → 10+ pages)

Three programmatic families stand out:

- **`/integrations/{exchange-slug}`** — Binance, Bybit, OKX, Coinbase, Kraken, KuCoin, Gate.io, MEXC, BingX, Bitget, dYdX, Hyperliquid (12 pages from one template). Each captures "{exchange} trade history" + "{exchange} trade journal" + "how to export {exchange} trades" + "{exchange} API journal" — roughly 4 keywords/page = ~50 keyword targets from one template. None of the existing journals do this well; the SERP is owned by exchange help docs which we won't outrank, but we'll outrank them on the **action**-intent queries ("how to journal …", "track …").
- **`/calculators/{calc-slug}`** — Position size, leverage, stop-loss, risk-per-trade, R-multiple, expectancy, Kelly, max drawdown. 8 pages, each ranks for 2–4 calculator keywords. Combined target: ~600/mo.
- **`/glossary/{term-slug}`** — All the Cluster 8 educational terms (profit factor, win rate, drawdown, R-multiple, equity curve, expectancy, Sharpe, Sortino, MAE/MFE, etc.) as featured-snippet-targeted glossary entries. 15+ pages from one template, each 300–500 words, schema'd with `DefinedTerm`.

### 4. Gaps vs competitors (what they rank for that we don't)

From SERPs sampled:

- **Tradervue** owns `/blog/best-trading-journal` — a listicle that ranks for "best trading journal", "trading journal app", and is cited in the "tradezella alternative" AI Overview. **We have no equivalent listicle yet.** Build ours.
- **TradeZella** has dedicated programmatic sub-pages: `/trader-journal/crypto-trading-journal`, `/best-trading-journal`, prop-firm guide. They've programmaticized vertical landing pages we haven't.
- **JournalPlus** — a newer entrant — already ranks #11 for "tradezella alternative" with an `/alternatives/tradezella` page and #10 for "how to stop revenge trading" with a 5-step guide. They show the cheap-and-fast playbook works.
- **Tradesyncer / Tradesviz** rank for "free trading journal" with dedicated free-tier landing pages we don't have.
- **CoinMarketMan** owns "Automated Crypto Trading Journal" — they've claimed the automated-crypto-futures positioning. We need to differentiate on AI insights + screenshot ingest + multi-exchange depth.
- **Edgewonk** owns the **"Tiltmeter"** psychology angle in AI Overviews. We need our own named feature — "Discipline Score", "Cooldown Timer", "FOMO Detector" — to be cited alongside it.

The gap pattern: every strong competitor has **(a)** one ranking listicle blog post, **(b)** a `/alternatives/{competitor}` set of pages, **(c)** programmatic feature/integration pages. We need all three by week 8.

---

## Sources cited (live SERP and volume data, 2026-04-25)

**SERP samples reviewed:**
- ["crypto trading journal" Google SERP — top 10 + AI Overview](https://www.google.com/search?q=crypto+trading+journal)
- ["best crypto trading journal" Google SERP — top 10 + AI Overview](https://www.google.com/search?q=best+crypto+trading+journal)
- ["trading journal app" Google SERP — top 10 + AI Overview](https://www.google.com/search?q=trading+journal+app)
- ["free trading journal" Google SERP — top 10 + Perspectives](https://www.google.com/search?q=free+trading+journal)
- ["tradezella alternative" Google SERP — top 10 + AI Overview](https://www.google.com/search?q=tradezella+alternative)
- ["binance trade history export" Google SERP — top 10 + PAA](https://www.google.com/search?q=binance+trade+history+export)
- ["how to stop revenge trading" Google SERP — top 10 + AI Overview + Perspectives](https://www.google.com/search?q=how+to+stop+revenge+trading)

**Top-ranking competitor pages reviewed:**
- [TradeZella — Crypto Trading Journal landing](https://www.tradezella.com/trader-journal/crypto-trading-journal)
- [Tradervue — 7 Best Trading Journals 2026 listicle](https://www.tradervue.com/blog/best-trading-journal)
- [TradesViz — Best Crypto Trading Journal page](https://www.tradesviz.com/best-crypto-trading-journal/)
- [TraderSync — TradeZella Alternative page](https://tradersync.com/tradezella-alternative/)
- [JournalPlus — TradeZella alternative + revenge trading guide](https://journalplus.co/alternatives/tradezella)
- [CoinMarketMan — automated crypto journaling](https://coinmarketman.com/features/automated-journaling/)
- [UltraTrader — Crypto Trading Journal](https://ultratrader.app/crypto-trading-journal)
- [TraderMake.Money](https://tradermake.money/) (#1 ranker for "crypto trading journal")
- [StonkJournal — free trading journal](https://stonkjournal.com/)
- [TradeBench — free trading journal](https://tradebench.com/)
- [StockBrokers.com — 5 Best Trading Journals 2026](https://www.stockbrokers.com/guides/best-trading-journals)
- [Edgewonk — TradeZella vs Edgewonk](https://edgewonk.com/blog/the-best-tradezella-alternative-edgewonk-vs-tradezella)
- [Forex Tester Online — Tradezella alternatives](https://forextester.com/blog/tradezella-alternatives/)
- [Tradeciety — Best Online Trading Journals 2026](https://tradeciety.com/best-online-trading-journals)
- [Binance — How to Download Spot Trading History](https://www.binance.com/en/support/faq/detail/e4ff64f2533f4d23a0b3f8f17f510eab)
- [Reddit r/Daytrading — Best trading journal for crypto](https://www.reddit.com/r/Daytrading/comments/1i5nrxv/best_trading_journal_for_crypto/)
- [Reddit r/Daytrading — Good trading journal besides Tradezella](https://www.reddit.com/r/Daytrading/comments/1ky9u9k/good_trading_journal_besides_tradezella/)
- [Reddit r/RealDayTrading — Trading journal tool recs](https://www.reddit.com/r/RealDayTrading/comments/1l0yq3i/looking_for_a_trading_journal_tool_any_good_ones/)
- [Reddit r/Forex — How to stop revenge trading](https://www.reddit.com/r/Forex/comments/1avwqqh/help_me_im_cant_stop_revenge_trading/)
- [Gotrade — Trading Journal Explained](https://www.heygotrade.com/en/blog/trading-journal-explained/)
- [Gotrade — Revenge Trading definition](https://www.heygotrade.com/en/blog/revenge-trading-definition-causes-and-how-to-avoid-it/)

**Volume / KD / intent data source:** [DataForSEO Google Ads + Labs API](https://dataforseo.com/) (live calls 2026-04-25, US, en).
