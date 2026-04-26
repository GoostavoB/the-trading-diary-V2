# Programmatic SEO Strategy — The Trading Diary

**Domain**: thetradingdiary.com
**Date**: 2026-04-25
**Owner**: Growth / Engineering
**Goal**: Build 5 reusable page templates that spawn 100+ unique landing pages, capturing high-intent long-tail traffic from traders searching for journals, calculators, exchange tutorials, and competitor comparisons.

---

## Strategic Overview

The Trading Diary is a crypto-first trading journal SaaS competing in a niche dominated by stock/forex incumbents (TradeZella, Edgewonk, Tradervue). Our edge: **native crypto exchange integrations, perp/futures-aware analytics, and modern UX**. Programmatic SEO lets us scale content production cheaply by leveraging structured data (exchange specs, calculator math, setup definitions) we already have or can build once.

**Templates targeted (5)**:
1. Competitor comparisons — `/vs/<competitor>`
2. Exchange tutorials — `/exchanges/<slug>/trade-history-export`
3. Calculators — `/calculators/<calc-slug>`
4. "Best X for Y" listicles — `/guides/best-<thing>-for-<persona>`
5. Strategy/setup pages — `/strategies/<setup-slug>`

**Total target pages launched**: ~75 (Phase 1) → 150+ (Phase 2)

---

## Template 1: Competitor Comparison ("vs" pages)

**Goal**: Rank for "<competitor> alternative" and "The Trading Diary vs <competitor>" queries from users actively comparing journals.

**URL pattern**: `/vs/<competitor-slug>`

**Number of pages spawned**: 8 (Phase 1) — TradeZella, Edgewonk, Tradervue, TraderSync, Trademetria, Chartlog, TradesViz, TradeBench.

**Starting set**:
- `/vs/tradezella` — vs TradeZella, the current crypto-friendly market leader.
- `/vs/edgewonk` — vs Edgewonk, the analytics-heavy desktop-first journal.
- `/vs/tradervue` — vs Tradervue, the legacy stock-focused journal.
- `/vs/tradersync` — vs TraderSync, broker-import competitor.
- `/vs/trademetria` — vs Trademetria, equities-focused tool.
- `/vs/chartlog` — vs Chartlog, simple equities journal.
- `/vs/tradesviz` — vs TradesViz, visualization-heavy free tier.
- `/vs/tradebench` — vs TradeBench, free legacy journal.

**Primary keyword pattern**: `"<competitor> alternative"`, `"<competitor> vs the trading diary"`, `"<competitor> for crypto"`, `"is <competitor> good for binance"`.

**Search volume potential**: **Med-High**. "TradeZella alternative" alone gets ~1.5K MSV. Long-tail variants compound.

**Competition**: Currently ranked by competitors' own pages, Reddit threads, and a few blog roundups (e.g., daytrading.com, tradingsim.com). **Most are weak** — generic listicles with no head-to-head depth. Honest, structured comparisons can leapfrog.

**Page structure**:
- **H1**: The Trading Diary vs {Competitor}: Honest Comparison for Crypto Traders ({year})
- **H2**: Quick verdict — who should pick which?
- **H2**: Overview of {Competitor}
- **H2**: Key differences at a glance (table)
- **H2**: Pricing — {Competitor} vs The Trading Diary
- **H2**: For crypto specifically — exchanges, perps, funding fees
- **H2**: Where {Competitor} wins
- **H2**: Where The Trading Diary wins
- **H2**: How to migrate from {Competitor} to The Trading Diary
- **H2**: FAQ
  - Q: Is {Competitor} good for crypto?
  - Q: Does {Competitor} support Binance/Bybit?
  - Q: Can I import my {Competitor} trades?
  - Q: Is The Trading Diary cheaper than {Competitor}?
  - Q: Which has better analytics for perps?

**Data needs**:
- Per-page variables: `{name}`, `{logo}`, `{founded_year}`, `{pricing_tiers}`, `{free_tier}`, `{supported_exchanges}`, `{supported_brokers}`, `{crypto_native}`, `{perp_support}`, `{import_format}`, `{pros[]}`, `{cons[]}`, `{our_pricing_vs_them}`, `{migration_steps[]}`, `{faq[]}`, `{verdict_persona}`.
- **Source**: hardcoded `src/data/competitors.ts` — array of `Competitor` objects with the above fields. Manually researched once, updated quarterly.

**Schema**: `Article` + `FAQPage` + `SoftwareApplication` (for both products) + `Comparison` (use `Review` schema with `aggregateRating` if we collect any).

**Internal linking**:
- **From → here**: homepage "Why The Trading Diary?" section links to top 3 vs pages; pricing page links to vs pages in objection-handling FAQ; blog posts about journal selection link here.
- **Here → where**: each vs page links to (a) /pricing, (b) /exchanges/binance/trade-history-export (if competitor supports Binance poorly), (c) /guides/best-crypto-journal-for-day-traders, (d) blog post "Switching trading journals: a checklist".

**Imagery**:
- Cover: split-screen logo comparison.
- Comparison table screenshot (auto-generated from data).
- Pricing chart bar graph.
- Migration screenshots (CSV export from competitor → import into TTD).

**Conversion CTA**: "Start free 14-day trial — import your {Competitor} CSV in 60 seconds" (mid-page sticky + footer).

**Implementation effort**: **Med**. Data sourcing is the bottleneck (1-2h research per competitor); template build is ~1 day.

**Example body excerpt (TradeZella page)**:

> ### Where TradeZella wins
>
> Let's be honest: TradeZella is the most polished trading journal on the market for **stock and options day traders**. If you trade NQ futures or SPY options on Tradovate or Interactive Brokers, TradeZella's broker integrations are mature, their analytics are battle-tested, and their community (Discord, replays, mentor templates) is unmatched. Their playbook feature is genuinely well-designed.
>
> ### Where The Trading Diary wins
>
> Crypto. Specifically, **perpetual futures**. TradeZella treats crypto as an afterthought — you can manually log Binance trades, but funding fees, partial fills across multiple sub-accounts, and Bybit's unified trading account are all messy. The Trading Diary was built crypto-first: native API sync with Binance, Bybit, OKX, and Coinbase; automatic funding-fee P&L attribution; perp-aware metrics like funding-adjusted Sharpe. We're also roughly 40% cheaper at the equivalent tier.
>
> ### Verdict
>
> If you trade US equities or futures via a traditional broker, TradeZella is probably the better tool today. If 60%+ of your volume is crypto perps, switch to The Trading Diary — you'll save hours per week on manual entry and finally see clean P&L with funding included.

**Implementation plan**:
- File: `src/data/competitors.ts` (typed `Competitor[]` array).
- Route: `src/pages/vs/[slug].tsx` (Next.js) or `src/routes/vs.$slug.tsx` (TanStack/React Router).
- Component: `<CompetitorComparisonPage competitor={...} ourProduct={...} />` reading from `competitors.ts` by slug.
- Sitemap: auto-generate from `competitors.ts`.

---

## Template 2: Exchange-Specific Tutorials

**Goal**: Rank for "<exchange> trade history export" and "how to export trades from <exchange>" — capturing traders who already need their data and would benefit from auto-import.

**URL pattern**: `/exchanges/<slug>/trade-history-export`

**Number of pages spawned**: 11 (Phase 1).

**Starting set**:
- `/exchanges/binance/trade-history-export` — Spot + Futures + Margin export walkthrough.
- `/exchanges/bybit/trade-history-export` — Unified Trading Account export.
- `/exchanges/okx/trade-history-export` — OKX Spot/Perp/Margin export.
- `/exchanges/coinbase/trade-history-export` — Coinbase Advanced + retail.
- `/exchanges/kraken/trade-history-export` — Kraken Pro export + ledger CSV.
- `/exchanges/kucoin/trade-history-export` — KuCoin export incl. futures.
- `/exchanges/bitfinex/trade-history-export` — Bitfinex CSV/API export.
- `/exchanges/mexc/trade-history-export` — MEXC futures export.
- `/exchanges/bingx/trade-history-export` — BingX copy-trading + perp export.
- `/exchanges/gate-io/trade-history-export` — Gate.io spot + perp export.
- `/exchanges/bitstamp/trade-history-export` — Bitstamp transactions export.

**Primary keyword pattern**: `"{exchange} trade history export"`, `"how to download trades from {exchange}"`, `"{exchange} csv export"`, `"{exchange} tax report"`.

**Search volume potential**: **High**. "Binance trade history" gets ~8K MSV; long-tail multipliers across all exchanges = ~30K MSV combined.

**Competition**: Tax tools (Koinly, CoinTracker), exchange's own help docs, and YouTube tutorials. Tax tools rank but don't optimize for journaling — gap to fill.

**Page structure**:
- **H1**: How to Export Your Trade History from {Exchange} ({year} Guide)
- **H2**: TL;DR — fastest method
- **H2**: Method 1 — Web UI export (step-by-step with screenshots)
- **H2**: Method 2 — API export (for advanced users / large accounts)
- **H2**: What fields the {Exchange} export contains
- **H2**: Common gotchas ({Exchange}-specific quirks: e.g., Binance sub-accounts, Bybit UTA, OKX trading-pair naming)
- **H2**: Auto-import to The Trading Diary (one-click API connection)
- **H2**: Using your export for taxes vs journaling
- **H2**: FAQ
  - Q: How far back can I export {Exchange} trades?
  - Q: Does {Exchange} export include funding fees?
  - Q: Can I export futures and spot together?
  - Q: Is the API safer than CSV?
  - Q: What if my export is missing trades?

**Data needs**:
- Per-page variables: `{name}`, `{logo}`, `{export_url_path}`, `{api_docs_url}`, `{export_methods[]}`, `{fields[]}` (timestamp, symbol, side, qty, price, fee, fee_currency, realized_pnl, funding_fee...), `{max_history_days}`, `{quirks[]}`, `{screenshots[]}`, `{api_supported_by_ttd}: bool`.
- **Source**: hardcoded `src/data/exchanges.ts`. Screenshots stored in `/public/images/exchanges/<slug>/`. Re-shoot screenshots quarterly.

**Schema**: `HowTo` (perfect fit — Google loves HowTo for exchange tutorials) + `FAQPage` + `BreadcrumbList`.

**Internal linking**:
- **From → here**: homepage features section links to "Connect Binance/Bybit/OKX"; pricing page links to "supported exchanges" hub; relevant blog posts link contextually.
- **Here → where**: each exchange page links to (a) /pricing, (b) /vs/tradezella (if competitor doesn't support that exchange well), (c) /calculators/funding-fees (relevant for perp exchanges), (d) other exchange tutorials in "also see".

**Imagery**: Numbered annotated screenshots of the actual export flow on each exchange (5-8 screenshots per page). Cover image: exchange logo + "Export Guide" badge.

**Conversion CTA**: "Skip the CSV — connect {Exchange} via read-only API in 30 seconds. Free trial."

**Implementation effort**: **Med-High**. Screenshots are the bottleneck (~2h per exchange). Template itself: 1 day.

**Example body excerpt (Bybit page)**:

> ### What Bybit's export actually contains
>
> Bybit's CSV export from the Unified Trading Account (UTA) includes 14 columns, but only 9 are useful for journaling: `Trade Time`, `Symbol`, `Side`, `Order Type`, `Qty`, `Price`, `Exec Fee`, `Fee Currency`, and `Closed P&L`. **Critically, funding fees are NOT in the trade history export** — they live in a separate "Transaction Log" CSV under Wallet → Asset Info. If you only download Trade History and ignore the Transaction Log, your real P&L on perps will be off by 0.5-3% per month, especially during high-funding regimes.
>
> ### The faster path
>
> Or: skip the CSV juggling entirely. The Trading Diary connects to Bybit via a read-only API key (no withdrawal permission, ever) and pulls trades, funding payments, and fees into a single unified ledger automatically. Your P&L includes funding by default. Setup takes 30 seconds — paste your API key, pick "Read only", done.

**Implementation plan**:
- File: `src/data/exchanges.ts` (typed `Exchange[]` with method instructions and screenshot paths).
- Route: `src/pages/exchanges/[slug]/trade-history-export.tsx`.
- Component: `<ExchangeExportGuide exchange={...} />` with `<HowToSchema>` injection.
- Reuse the same `exchanges.ts` for the `/exchanges` hub page and homepage logo grid.

---

## Template 3: Calculator Landing Pages

**Goal**: Rank for high-intent calculator queries ("position size calculator crypto", "leverage calculator") with a free, embedded, working calculator that captures email/signup.

**URL pattern**: `/calculators/<calc-slug>`

**Number of pages spawned**: 6 (Phase 1) → 12 (Phase 2 with variations).

**Starting set**:
- `/calculators/position-size` — Risk-based position sizing for crypto perps.
- `/calculators/leverage` — Effective leverage given margin and notional.
- `/calculators/risk-reward` — R:R + breakeven win-rate.
- `/calculators/drawdown-recovery` — % gain needed to recover from a drawdown.
- `/calculators/funding-fees` — Daily/annualized funding cost on a perp position.
- `/calculators/tax-pl` — Realized P&L for tax reporting (FIFO/LIFO/HIFO).

**Phase 2**: liquidation-price, compound-growth, kelly-criterion, sharpe-ratio, win-rate-required, average-true-range.

**Primary keyword pattern**: `"<calc> calculator"`, `"<calc> calculator crypto"`, `"how to calculate <thing>"`.

**Search volume potential**: **High**. "Position size calculator" ~12K MSV; "leverage calculator" ~6K MSV; "drawdown recovery calculator" ~2K MSV. Combined: ~40K+ MSV.

**Competition**: Babypips (forex-focused), Investopedia (educational, no calculator), random blogspam. Few have **actually-working interactive calculators with crypto-specific inputs** (USDT pairs, 100x leverage, funding fees).

**Page structure**:
- **H1**: {Calculator Name} for Crypto Traders (Free)
- **Interactive calculator above the fold** — no scroll required.
- **H2**: How this calculator works
- **H2**: The formula (with worked math)
- **H2**: Worked example — long ETH at 5x leverage
- **H2**: Worked example — short BTC at 10x leverage
- **H2**: Common mistakes traders make
- **H2**: When to use this vs other calculators
- **H2**: Track your real numbers — how The Trading Diary auto-calculates this for every trade
- **H2**: FAQ
  - Q: What's a safe {value} for crypto?
  - Q: Does this account for fees?
  - Q: How does leverage affect this?
  - Q: How is this calculated in The Trading Diary?
  - Q: Can I save my inputs?

**Data needs**:
- Per-page variables: `{name}`, `{slug}`, `{formula_latex}`, `{inputs[]}` (label, type, default, min, max), `{calculation_fn}`, `{worked_examples[]}`, `{related_calculators[]}`, `{faq[]}`.
- **Source**: hardcoded `src/data/calculators.ts` for content + per-calculator React component for the interactive widget (`src/components/calculators/PositionSizeCalc.tsx`, etc.).

**Schema**: `Article` + `FAQPage` + `HowTo` (for the formula explanation). Optionally `WebApplication` schema for the calculator itself.

**Internal linking**:
- **From → here**: homepage tools strip; blog posts about risk management; sidebar of every calculator linking to others; footer "Free Tools" section.
- **Here → where**: each calculator links to (a) `/pricing`, (b) related calculators, (c) one relevant strategy page (e.g., position-size links to /strategies/breakout-retest), (d) one relevant exchange page.

**Imagery**: Calculator UI is the imagery. OG image: rendered screenshot of the calculator with example values filled in.

**Conversion CTA**: "Save your inputs and auto-apply this to every trade — free with The Trading Diary."

**Implementation effort**: **High** (per calculator: 1-2 days for the interactive widget; content templating reusable).

**Example body excerpt (Position Size Calculator)**:

> ### How position size works in crypto perps
>
> Position sizing is the single most important risk decision you make per trade — and on a 100x perp exchange like Bybit or Binance Futures, it's the difference between a paper-cut loss and a liquidation. The math is simple: **decide how much of your account you're willing to lose on this trade (risk %), then back-solve for position size given your stop distance**.
>
> Formula:
>
> `Position Size (USD) = (Account Equity × Risk %) ÷ Stop Distance %`
>
> ### Worked example — long ETH
>
> You have $10,000. You're risking 1% ($100) on a long ETH at $3,200 with a stop at $3,136 (a 2% stop). Position size = $100 ÷ 0.02 = **$5,000 notional**. At 5x leverage, that's $1,000 of margin posted. If ETH hits stop, you lose exactly $100 — independent of the leverage you used.
>
> ### What traders get wrong
>
> Beginners size by leverage ("I'll use 10x"), not by risk. That works until volatility expands, your stop gets wider, and the same 10x position now risks 4% of your account instead of 1%. **Always size from the stop, never from the leverage.**

**Implementation plan**:
- File: `src/data/calculators.ts` — content config.
- File: `src/components/calculators/<Slug>Calc.tsx` — one interactive component per calculator.
- Route: `src/pages/calculators/[slug].tsx` — picks the right calculator component dynamically.
- State: `useState` only; persist last inputs to `localStorage`.

---

## Template 4: "Best X for Y" Listicles

**Goal**: Rank for buyer-intent listicles where users self-select by persona ("best journal for scalpers", "best free trading journal") — high conversion since the user has already decided they need a journal.

**URL pattern**: `/guides/best-<thing>-for-<persona>`

**Number of pages spawned**: 8 (Phase 1).

**Starting set**:
- `/guides/best-crypto-journal-for-day-traders` — Day-trader focus.
- `/guides/best-trading-journal-for-scalpers` — Scalper / high-frequency focus.
- `/guides/best-journal-for-bybit-users` — Bybit-specific.
- `/guides/best-trading-journal-for-beginners` — Onboarding-friendly.
- `/guides/best-free-trading-journal` — Free-tier comparison.
- `/guides/best-trading-journal-for-funded-accounts` — Prop-firm / funded traders (FTMO, MyForexFunds, etc.).
- `/guides/best-trading-journal-for-binance` — Binance-specific.
- `/guides/best-trading-journal-for-perpetual-futures` — Perp-focused.

**Primary keyword pattern**: `"best <thing> for <persona>"`, `"top <thing> <year>"`, `"<persona> trading journal"`.

**Search volume potential**: **Med**. "Best trading journal" ~3K MSV; "best free trading journal" ~1K; long-tail personas 200-800 each.

**Competition**: Affiliate roundups (often biased), Reddit threads, dated blog posts. **Honesty + recency** is the moat — most existing posts are 2-3 years old and ignore crypto.

**Page structure**:
- **H1**: Best {Thing} for {Persona} in {Year} — Honest Roundup
- **H2**: TL;DR — the top pick
- **H2**: How we picked
- **H2**: #1 — The Trading Diary (full review with caveats)
- **H2**: #2 — {Competitor A} (where they win)
- **H2**: #3 — {Competitor B}
- **H2**: #4 — {Competitor C}
- **H2**: #5 — {Free / niche option}
- **H2**: Comparison table (sortable)
- **H2**: How to choose for your situation
- **H2**: FAQ
  - Q: What makes a journal good for {persona}?
  - Q: Do I need a paid journal?
  - Q: Can I use a spreadsheet instead?
  - Q: What features matter most for {persona}?
  - Q: Which has a free trial?

**Data needs**:
- Per-page variables: `{persona}`, `{thing}`, `{year}`, `{ranked_options[]}` (each with `{name, score, pros, cons, best_for, pricing, link}`), `{decision_framework}`, `{faq[]}`.
- **Source**: `src/data/guides.ts` referencing `src/data/competitors.ts` (DRY — same competitor data drives Template 1 and Template 4).

**Schema**: `Article` + `FAQPage` + `ItemList` (for the ranked listicle).

**Internal linking**:
- **From → here**: blog posts; homepage "Why us" section; persona-targeted landing pages.
- **Here → where**: each entry in the listicle links to its full vs page (e.g., #2 TradeZella → /vs/tradezella); CTA links to /pricing; relevant calculators and exchange tutorials linked contextually.

**Imagery**: Cover image with persona-themed art (e.g., scalper = candle chart with tight timeframe). Comparison table screenshot. Each ranked option gets its logo.

**Conversion CTA**: "Try the #1 pick free for 14 days — no card required."

**Implementation effort**: **Low-Med** (reuses competitor data; mostly content-writing).

**Example body excerpt (best-trading-journal-for-scalpers)**:

> ### Why scalpers need a different journal
>
> Scalping 30-200 trades per day breaks most journals. Tradervue groans at 5K trades/month. TradeZella's UI gets sluggish above 10K. And manual entry? Forget it — you'll spend more time logging than trading.
>
> What scalpers actually need: **(1) auto-import via API, (2) bulk tagging by setup, (3) session-level analytics, not per-trade, (4) latency-aware fee tracking, and (5) a UI that doesn't choke on 50K trades**.
>
> ### #1 — The Trading Diary
>
> We built TTD on Postgres + indexed time-series tables specifically because the founder scalped Binance perps and hit Tradervue's wall at 8K trades. TTD handles 100K+ trades per account without UI lag, auto-imports from 8 exchanges via API (no CSV), and groups trades into sessions automatically. **Caveat**: if you're a US equities scalper using DAS Trader or Sterling, our broker support isn't there yet — see #2.
>
> ### #2 — TradeZella (for US equities scalpers)
>
> If your day is SPY 0DTE and NQ futures via DAS or Tradovate, TradeZella's broker integrations and replay feature are still best-in-class. Slower than TTD on huge accounts, but the workflow polish is real.

**Implementation plan**:
- File: `src/data/guides.ts` — listicle configs that reference competitors by slug.
- Route: `src/pages/guides/[slug].tsx`.
- Component: `<BuyersGuidePage guide={...} />` — renders header, ranked list, comparison table, FAQ.

---

## Template 5: Strategy / Setup Pages

**Goal**: Capture long-tail educational traffic ("breakout retest strategy", "RSI divergence trading") and convert via "track your version of this setup" CTA.

**URL pattern**: `/strategies/<setup-slug>`

**Number of pages spawned**: 10 (Phase 1) → 25+ (Phase 2).

**Starting set**:
- `/strategies/breakout-retest` — Classic breakout + retest of prior resistance.
- `/strategies/range-fade` — Mean-reversion at range extremes.
- `/strategies/trend-pullback` — Buy the dip in an uptrend.
- `/strategies/support-resistance` — Foundational S/R bounces.
- `/strategies/ema-cross` — 9/21 EMA crossover.
- `/strategies/rsi-divergence` — Bullish/bearish RSI divergence.
- `/strategies/order-block` — ICT-style order blocks.
- `/strategies/liquidity-sweep` — Stop-hunt and reversal.
- `/strategies/fair-value-gap` — FVG fill plays.
- `/strategies/vwap-reclaim` — Intraday VWAP reclaim setup.

**Phase 2**: torres-gemeas, head-and-shoulders, cup-and-handle, wyckoff-spring, ascending-triangle, fibonacci-retracement, ema-200-bounce, three-bar-reversal, etc.

**Primary keyword pattern**: `"<setup> strategy"`, `"<setup> trading"`, `"how to trade <setup>"`, `"<setup> entry rules"`.

**Search volume potential**: **Med**. Individually 200-2K MSV; aggregate across 25 strategies = 15K+ MSV.

**Competition**: Babypips, Investopedia, BabyPips School, YouTube. Beatable with crypto-specific examples and the "track-your-version" CTA hook.

**Page structure**:
- **H1**: {Setup Name}: How to Trade It (and When It Fails)
- **H2**: What is a {setup}?
- **H2**: Entry rules (numbered list with chart)
- **H2**: Stop-loss placement
- **H2**: Take-profit logic
- **H2**: When this setup works (regime + timeframe)
- **H2**: When it fails (the brutal truth)
- **H2**: Crypto-specific notes — does this work on perps?
- **H2**: Worked example — annotated chart
- **H2**: How to track your {setup} performance in The Trading Diary
- **H2**: Related setups
- **H2**: FAQ
  - Q: What timeframe is best for {setup}?
  - Q: Win rate of {setup}?
  - Q: Does {setup} work on crypto?
  - Q: How is {setup} different from {related setup}?
  - Q: What R:R should I aim for?

**Data needs**:
- Per-page variables: `{name}`, `{slug}`, `{description}`, `{entry_rules[]}`, `{stop_logic}`, `{tp_logic}`, `{works_when}`, `{fails_when}`, `{crypto_notes}`, `{example_chart_url}`, `{related_setups[]}`, `{faq[]}`.
- **Source**: `src/data/strategies.ts`. Charts: TradingView snapshots stored in `/public/images/strategies/<slug>/`.

**Schema**: `Article` + `HowTo` (entry rules naturally fit) + `FAQPage`.

**Internal linking**:
- **From → here**: blog posts about strategy frameworks; calculator pages link contextually (position-size → breakout-retest); each strategy links to 3 related strategies.
- **Here → where**: each strategy page links to (a) /calculators/risk-reward, (b) /calculators/position-size, (c) 3 related strategies, (d) /pricing.

**Imagery**: Annotated TradingView chart per page (entry, stop, target marked). Cover image: stylized version of the setup.

**Conversion CTA**: "Tag every {setup} you take and see your real edge. Free with The Trading Diary."

**Implementation effort**: **Med**. Charts are the bottleneck (1h per setup). Content writing is templatable.

**Example body excerpt (breakout-retest)**:

> ### When breakout-retest works
>
> The breakout-retest is the highest-probability variant of any breakout strategy. The premise: price breaks a level, retraces to test it from the other side, the level holds, and you enter with a tight stop. It works best in **trending markets** with clear horizontal levels — especially the daily and 4H on BTC, ETH, and large-cap alts after consolidation ranges.
>
> ### When it fails
>
> It fails on three setups: (1) range-bound chop where every "breakout" is a fake-out, (2) low-volume Asian session breaks on perps, and (3) when the level being broken isn't actually significant (random intraday swing high, not a real S/R).
>
> ### Track your real edge
>
> Most traders feel like breakout-retests work. Few have data. In The Trading Diary, tag every breakout-retest entry with the `#breakout-retest` tag — after 30 trades, you'll see your win rate, average R, and which timeframe / coin / session your version actually works on. Mine, for the record: 47% win rate, 1.8R average, only profitable on 4H and daily, never on 15m.

**Implementation plan**:
- File: `src/data/strategies.ts`.
- Route: `src/pages/strategies/[slug].tsx`.
- Component: `<StrategyPage strategy={...} />`.

---

## Internal Linking Matrix

Goal: every new programmatic page launches with **≥3 inbound internal links**. Below is the seed matrix (extend as content grows).

| # | Source URL | Target URL | Anchor / context |
|---|-----------|-----------|------------------|
| 1 | `/` (homepage) | `/vs/tradezella` | "How we compare to TradeZella" — vs section |
| 2 | `/pricing` | `/vs/edgewonk` | Objection-handling FAQ "how do you compare to Edgewonk?" |
| 3 | `/vs/tradezella` | `/exchanges/binance/trade-history-export` | "Importing Binance trades" subsection |
| 4 | `/vs/tradezella` | `/guides/best-crypto-journal-for-day-traders` | "See full crypto-journal roundup" |
| 5 | `/exchanges/bybit/trade-history-export` | `/calculators/funding-fees` | "Calculate funding cost on your Bybit positions" |
| 6 | `/exchanges/binance/trade-history-export` | `/vs/tradezella` | "How TradeZella handles Binance imports vs us" |
| 7 | `/calculators/position-size` | `/strategies/breakout-retest` | "Apply this to a breakout-retest entry" |
| 8 | `/calculators/risk-reward` | `/strategies/range-fade` | "Why R:R matters for fade setups" |
| 9 | `/strategies/breakout-retest` | `/calculators/position-size` | "Size your breakout-retest entry" |
| 10 | `/strategies/rsi-divergence` | `/strategies/trend-pullback` | "Combine divergence with pullbacks" |
| 11 | `/guides/best-trading-journal-for-scalpers` | `/vs/tradezella` | "#2 pick: TradeZella deep-dive" |
| 12 | `/guides/best-journal-for-bybit-users` | `/exchanges/bybit/trade-history-export` | "How to actually export your Bybit trades" |
| 13 | `/blog/funding-fees-explained` | `/calculators/funding-fees` | Inline link to calculator |
| 14 | `/blog/switching-trading-journals` | `/vs/tradezella`, `/vs/edgewonk` | Migration guide references |
| 15 | Footer (sitewide) | `/calculators/*` (all 6) | "Free Tools" footer column |

**Reciprocal rule**: every vs page links to ≥1 exchange page + ≥1 guide page. Every exchange page links to ≥1 vs page + ≥1 calculator. Every strategy links to ≥2 other strategies + ≥1 calculator. Every guide page links to ≥3 vs pages.

---

## Implementation Order (6-Week Rollout)

Ranking by **ROI / effort ratio**:

| Rank | Template | ROI | Effort | Why |
|------|----------|-----|--------|-----|
| 1 | **Calculators** (T3) | High | High (per-calc) | Highest MSV, evergreen, strong backlink magnet, conversion via input-saving |
| 2 | **Exchange tutorials** (T2) | High | Med | Massive aggregate MSV, HowTo schema, captures users mid-task |
| 3 | **Competitor "vs"** (T1) | High | Med | Highest commercial intent, direct conversion |
| 4 | **"Best X for Y"** (T4) | Med | Low | Reuses competitor data, listicle CTR is decent |
| 5 | **Strategies** (T5) | Med | Med | Long-tail volume, lower commercial intent but excellent for top-of-funnel + internal-link mesh |

### 6-Week Rollout

**Week 1 — Foundations**
- Build shared infra: `src/data/{competitors,exchanges,calculators,guides,strategies}.ts` schemas; route patterns; sitemap generator; `<FAQSchema>`, `<HowToSchema>`, `<ArticleSchema>` JSX components; OG image generator.

**Week 2 — Calculators (T3)**
- Ship 3 calculators: position-size, risk-reward, leverage. These are the highest-MSV three.
- Internal links from homepage tools strip + footer.

**Week 3 — Calculators + Exchanges**
- Ship remaining 3 calculators (drawdown-recovery, funding-fees, tax-pl).
- Start exchange tutorials: Binance, Bybit, OKX (top 3 by user base).

**Week 4 — Exchanges**
- Ship remaining 8 exchange tutorials (Coinbase, Kraken, KuCoin, Bitfinex, MEXC, BingX, Gate.io, Bitstamp).
- Launch `/exchanges` hub page.

**Week 5 — Competitor "vs" pages (T1)**
- Ship all 8 vs pages (TradeZella, Edgewonk, Tradervue, TraderSync, Trademetria, Chartlog, TradesViz, TradeBench).
- Wire internal links from homepage + pricing.

**Week 6 — "Best X for Y" + Strategies kickoff**
- Ship 8 buyer-guide pages (T4) — fast since they reuse T1 competitor data.
- Launch first 5 strategy pages (T5): breakout-retest, range-fade, trend-pullback, S/R, EMA-cross.
- Continue T5 strategies post-launch at ~3/week as content cadence.

**Post-week-6**: monitor GSC for which pages get impressions but low CTR; A/B test titles and meta descriptions; double down on the categories pulling traffic.

---

## SERP Risk Register (Doorway-Page Avoidance)

Google's [doorway pages](https://developers.google.com/search/docs/essentials/spam-policies#doorways) policy targets pages that exist primarily to funnel users to the same destination with thin, near-duplicate content. Programmatic SEO done badly = doorway flag = manual action.

### Risks per template

| Template | Risk level | Specific risks | Mitigations |
|----------|-----------|----------------|-------------|
| **T1 vs pages** | Low | Boilerplate pros/cons could read as templated | Hand-write at least 40% of body per page (verdict, "where competitor wins" sections genuinely differ); update yearly; honest acknowledgments where competitor wins |
| **T2 exchanges** | Med | Same template, different exchange names — could look like doorways | Real, exchange-specific screenshots (not stock images); document each exchange's unique quirks (sub-accounts, UTA, ledger separation); HowTo schema; ≥800 words unique per page |
| **T3 calculators** | Low | Each page has a genuinely interactive tool — strongest signal of unique value | Ensure each calculator works without JS errors; add 800-1200 words of unique educational content per page; worked examples differ |
| **T4 guides** | **Med-High** | Listicle format + similar product comparisons across pages = highest doorway risk | Genuinely different rankings per persona (e.g., #2 differs across pages); persona-specific reasoning sections; avoid copy-pasting product blurbs — write fresh per context |
| **T5 strategies** | Low | Educational long-tail content rarely flagged | Unique chart per setup; specific entry rules; honest "when it fails" sections |

### General mitigations (apply to all templates)

1. **Minimum unique word count per page**: 800 words of *non-templated* prose. The boilerplate (FAQ scaffolding, schema markup) doesn't count.
2. **No keyword stuffing**: don't repeat the persona/competitor/exchange name 50 times. Natural mention frequency.
3. **Real value per page**: a working calculator (T3), real screenshots (T2), real comparison data (T1, T4), real charts (T5). Generic stock content = doorway flag.
4. **Don't ship all 75 pages on day 1**. Roll out gradually (matches the 6-week plan); Google's algorithm flags sudden URL explosions on new content.
5. **Submit to Search Console manually** in batches; monitor for "Discovered — currently not indexed" or "Crawled — not indexed" signals.
6. **Diversify outbound links**: each programmatic page should link to ≥2 external authoritative sources (not just our own pages).
7. **Author bylines** on strategy and guide pages — establishes E-E-A-T.
8. **No "city × service" or "country × product" multipliers** — those are the classic doorway anti-pattern. Our matrices (competitor, exchange, calculator, persona, setup) are categorically distinct content, not pure permutations.
9. **Update cadence**: vs pages and guides updated quarterly with `lastmod` in sitemap; signals freshness.
10. **Canonical tags**: each page self-canonicals; no near-duplicate URL variants (no `?ref=...` indexed).

---

## Summary Table — All Templates

| Template | Pages (Phase 1) | Effort | Aggregate MSV (est) | ROI rank |
|----------|----------------|--------|---------------------|----------|
| T1 — vs pages | 8 | Med | ~5K | 3 |
| T2 — Exchange tutorials | 11 | Med-High | ~30K | 2 |
| T3 — Calculators | 6 | High | ~40K | 1 |
| T4 — Best X for Y | 8 | Low-Med | ~8K | 4 |
| T5 — Strategies | 10 | Med | ~15K | 5 |
| **Total** | **43** (Phase 1) | — | **~98K MSV** | — |

Phase 2 expansion (next 6 months) doubles the page count to ~85 with marginal additional engineering effort, since templates and data infrastructure already exist.
