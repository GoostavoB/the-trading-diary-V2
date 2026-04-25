import { BlogArticle } from '../blogArticles';

export const englishArticles: BlogArticle[] = [
  {
    title: '10 Proven Ways to Improve Your Crypto Trading Performance Using AI Tools',
    slug: 'ai-tools-for-crypto-trading',
    metaTitle: '10 Proven Ways AI Tools Improve Crypto Trading Performance',
    metaDescription: 'Learn how AI tools for crypto trading improve entries, exits, risk control, and discipline with workflows, metrics, and examples.',
    description: 'Master the most effective AI tools to track behavior, spot patterns, and respond to market conditions with data-driven precision.',
    focusKeyword: 'AI tools for crypto trading',
    readTime: '8 min read',
    author: 'Gustavo',
    date: '2025-10-22',
    category: 'AI Tools',
    tags: ['crypto trading', 'AI tools', 'trading journal', 'discipline', 'risk'],
    canonical: 'https://www.thetradingdiary.com/blog/ai-tools-for-crypto-trading',
    language: 'en',
    heroImage: '/blog/ai-tools-dashboard.png',
    heroImageAlt: 'AI tools for crypto trading dashboard showing risk and breaches',
    content: `# 10 Proven Ways to Improve Your Crypto Trading Performance Using AI Tools

You want consistent execution, faster learning, and fewer errors. AI helps you track behavior, spot patterns, and respond to market conditions with less guesswork. This guide gives you ten practical ways to use **AI tools for crypto trading**. You will see the metrics to track, weekly review workflows, and how an AI trading journal turns data into feedback you act on.

You can automate many steps with **The Trading Diary**. It imports fills, tags trades, tracks risk, and provides AI coaching. See how it works at [thetradingdiary.com](https://www.thetradingdiary.com).

## 1. Auto tag every trade with AI
- Tag setup, market regime, volatility class, time of day, and exchange.
- Store R multiple, stop reason, exit reason.
- Weekly: sort by setup and regime, cut the worst performer, scale the best.

Numbers to track: average R by setup, win rate by regime, adverse excursion.  
Try automated tagging inside [The Trading Diary](https://www.thetradingdiary.com).

Internal link: See [Why Every Successful Trader Keeps a Trading Journal for Crypto](/blog/trading-journal-for-crypto).

## 2. Use AI volatility signals to size risk
- Classify the day as quiet, normal, or high volatility using ATR or realized volatility.
- Tie position size and stop distance to the class.
- Reduce size above the 90th percentile of your lookback.

## 3. Detect overtrading with behavior analytics
- Monitor trade count per session, time between entries, and loss streaks.
- Install cooldowns and daily trade caps.
- Track net R by trade number; many traders see a drop after trade three.

Internal link: For emotional controls, see [The Psychology of Trading: How to Control Emotions and Avoid Revenge Trades](/blog/trading-psychology-control-emotions).

## 4. Surface risk hotspots with pattern mining
- Scan notes and tags for co-occurring risks like adding to losers or tight stops in chop.
- Create a weekly hotspot watchlist with one blocking rule.

The Trading Diary highlights breach trends and recurring risk patterns. Explore at [thetradingdiary.com](https://www.thetradingdiary.com).

## 5. Improve expectancy by ranking setups on R multiples
- Rank setups by average R, dispersion, and sample size.
- Keep only positive expectancy setups with stable distribution.
- Scale the top one or two.

Internal link: See [From Chaos to Clarity: How Data-Driven Traders Win More Consistently](/blog/data-driven-trading).

## 6. Measure discipline with plan versus execution analytics
- Compare planned entry, stop, and size against actual.
- Track slippage, early exits, and stop moves.
- Use a discipline score per trade.

The Trading Diary compares plan and execution, then its AI coach reports progress and gaps. Details at [thetradingdiary.com](https://www.thetradingdiary.com).

## 7. Track emotions and link them to outcomes
- Use short pre and post trade labels like calm, anxious, rushed.
- Correlate mood with expectancy and breach rates.
- Add cooldowns when tilt signals appear.

## 8. Switch playbooks with regime detection
- Tag sessions as trend, range, or mixed using simple indicators.
- Only run setups that fit the current regime.

## 9. Backtest journal rules
- Convert journal rules to code where possible.
- Test impact on expectancy and drawdown.

## 10. Use AI coaching for weekly focus
- Ask for keep, fix, and stop lists.
- Implement one rule and one metric per week.

Inside The Trading Diary, AI coaching reviews trades and proposes one focused improvement. See [thetradingdiary.com](https://www.thetradingdiary.com).

## Weekly review checklist
- Confirm tags and data quality.
- Review expectancy by setup and regime.
- Select one hotspot and define one blocking rule.
- Set a single metric to track next week.
- Publish the weekly plan.

## FAQs

**Q: Do AI tools replace strategy?**  
A: No. They measure and improve execution. You still define entries, stops, and targets.

**Q: How do I know AI adds value?**  
A: Discipline breaches fall and expectancy rises over a few weeks.

**Q: What about privacy?**  
A: Use read-only keys, encryption, and export controls.`
  },
  {
    title: 'Why Every Successful Trader Keeps a Trading Journal for Crypto',
    slug: 'trading-journal-for-crypto',
    metaTitle: 'Why Every Successful Trader Keeps a Trading Journal for Crypto',
    metaDescription: 'Build a trading journal for crypto that improves consistency, risk control, and profitability. Automation, dashboards, and weekly reviews.',
    description: 'Learn how to build a crypto trading journal that turns trades into measurable data and drives weekly improvements.',
    focusKeyword: 'trading journal for crypto',
    readTime: '7 min read',
    author: 'Gustavo',
    date: '2025-10-22',
    category: 'Trading Journal',
    tags: ['trading journal', 'crypto trading', 'AI tools', 'discipline'],
    canonical: 'https://www.thetradingdiary.com/blog/trading-journal-for-crypto',
    language: 'en',
    heroImage: '/blog/journal-template.png',
    heroImageAlt: 'Crypto trading journal template with setup and emotion fields',
    content: `# Why Every Successful Trader Keeps a Trading Journal for Crypto

A clear journal turns trades into measurable data. It reduces hindsight bias, exposes patterns, and drives weekly improvements. This article shows how to build a **trading journal for crypto** that you will use daily and review weekly.

Automate journaling, tagging, dashboards, and AI feedback with **The Trading Diary** at [thetradingdiary.com](https://www.thetradingdiary.com).

## What a trading journal does
- Memory you trust. Plan, execution, and outcome captured in the moment.
- Fast feedback. Expectancy and payoff by setup and regime.
- Discipline tracking. Plan versus execution gaps become visible.
- Risk control. Hotspots identified and removed with rules.

## What to record
- Identity: timestamp, symbol, exchange, direction, size, planned R.
- Context: setup, regime, volatility class, time of day, news context.
- Execution: fill, slippage, stop moved, partials, exit reason.
- Outcomes: R multiple, holding time, excursions.
- Behavior: pre and post trade emotion, breaches, short notes.

Internal link: For automation and AI support, see [10 Proven Ways to Improve Your Crypto Trading Performance Using AI Tools](/blog/ai-tools-for-crypto-trading).  
Internal link: For psychology and tilt control, read [The Psychology of Trading: How to Control Emotions and Avoid Revenge Trades](/blog/trading-psychology-control-emotions).

## 60-minute setup
1) Set base currency and time zone.  
2) Define three setups with one sentence rules.  
3) Define regime and volatility labels.  
4) Build a journal template with fixed fields.  
5) Connect exchanges and import fills.  
6) Turn on dashboards and weekly reports.

Try this workflow inside [The Trading Diary](https://www.thetradingdiary.com).

## Metrics that matter
- Expectancy, payoff ratio, win rate.
- R distribution and drawdown stats.
- Rule breaches and slippage.

## Weekly review on one page
- Filter last week's trades and confirm tags.
- Review expectancy by setup and regime.
- Pick one hotspot and define one blocking rule.
- Set one metric and publish next week's plan.

## Plan versus execution analysis
- Track planned vs actual entry, stop, and size.
- Score discipline per trade.
- Fix the most common breach first.

## Emotion tracking
- Use short labels before and after each trade.
- Correlate mood with expectancy and breaches.
- Add cooldowns when tilt signals appear.

## Case study snapshot
- After installing a journal, stop move breaches fell 40 percent and expectancy rose from 0.05 R to 0.17 R in two weeks.

## FAQs

**Q: How many setups should I track?**  
A: Start with three and expand only after stable results.

**Q: How do I know the journal works?**  
A: Discipline scores improve and expectancy trends higher.

**Q: How do I protect data?**  
A: Use read-only keys and confirm export and deletion options.`
  },
  {
    title: 'The Psychology of Trading: How to Control Emotions and Avoid Revenge Trades',
    slug: 'trading-psychology-control-emotions',
    metaTitle: 'Trading Psychology: Control Emotions and Stop Revenge Trades',
    metaDescription: 'Practical tactics to cut tilt, reduce revenge trades, and improve discipline with checklists, caps, emotion tracking, and AI coaching.',
    description: 'Stop revenge trading with clear caps, checklists, mood tracking, and cooldowns that work in live crypto markets.',
    focusKeyword: 'trading psychology',
    readTime: '9 min read',
    author: 'Gustavo',
    date: '2025-10-22',
    category: 'Trading Psychology',
    tags: ['trading psychology', 'discipline', 'risk controls', 'journaling'],
    canonical: 'https://www.thetradingdiary.com/blog/trading-psychology-control-emotions',
    language: 'en',
    heroImage: '/blog/psychology-checklist.png',
    heroImageAlt: 'Trading psychology checklist with cooldown rule',
    content: `# The Psychology of Trading: How to Control Emotions and Avoid Revenge Trades

Revenge trading follows fast losses, strong emotions, and weak rules. You can stop it with clear caps, checklists, mood tracking, and cooldowns. This guide gives you the tools that work in live crypto markets.

Track emotions, discipline, and breaches with **The Trading Diary**. See [thetradingdiary.com](https://www.thetradingdiary.com).

## What revenge trading looks like in data
- Trade count and size spike after a loss.
- Time between trades shrinks.
- Stop moves and early exits increase.

Metrics: net R after loss vs after win, average R by trade number, stop move events, early exit rate, slippage.

## Anti-tilt protocol
- Daily limits: 0.5–1.5 percent risk per trade, 3–5 R daily loss cap, three trades per session to start.
- Cooldowns: 20 minutes after a 2R loss; 10 minutes after a stop move.
- Pre-trade checklist: setup validity, stop location, expected R, caps respected, 60 seconds calm state.
- Post-trade checklist: stop moved, exit trigger, emotion, change for next time.

Internal link: Build structure with [Why Every Successful Trader Keeps a Trading Journal for Crypto](/blog/trading-journal-for-crypto).

## Emotion tracking that works
- Pre and post trade labels: calm, focused, anxious, angry, rushed, satisfied, frustrated.
- Correlate mood with expectancy and breach rate.
- Rules: cooldown after large loss, one minute pause when rushed, no add to losers.

## Plan versus execution analytics
- Compare planned vs actual entry, stop, and size.
- Track early exits and stop moves.
- Use a discipline score from 0 to 100 and fix the top breach first.

## Routines to reduce stress
- Morning: review plan and risk caps, short breathing.
- Pre-trade: confirm regime, read rules, mark stop, one minute timer.
- Post-trade: log emotion, breaches, short note.
- End of day: export, review expectancy, write keep, fix, stop.

## Case study snapshot
- After caps, cooldowns, and discipline scoring, breach count down 46 percent and expectancy up from 0.06 R to 0.18 R in four weeks.

## FAQs

**Q: How do I know cooldowns help?**  
A: Net R after loss improves toward zero or positive.

**Q: What if I broke a rule and won?**  
A: Still log a breach. Consistency beats luck.

**Q: Should I trade after life stress?**  
A: Usually reduce size or skip the session.`
  },
  {
    title: 'From Chaos to Clarity: How Data-Driven Traders Win More Consistently',
    slug: 'data-driven-trading',
    metaTitle: 'Data-Driven Trading: Processes, Metrics, and Dashboards',
    metaDescription: 'Install a data-driven trading process for crypto with core metrics, dashboards, and a weekly cadence that improves expectancy.',
    description: 'Turn noise into decisions with a data-driven process, stable metrics, and weekly reviews that compound small gains.',
    focusKeyword: 'data-driven trading',
    readTime: '8 min read',
    author: 'Gustavo',
    date: '2025-10-22',
    category: 'Trading Strategy',
    tags: ['data-driven trading', 'metrics', 'dashboards', 'journaling'],
    canonical: 'https://www.thetradingdiary.com/blog/data-driven-trading',
    language: 'en',
    heroImage: '/blog/data-driven-dashboard.png',
    heroImageAlt: 'Data-driven trading dashboard with expectancy by setup',
    content: `# From Chaos to Clarity: How Data-Driven Traders Win More Consistently

A data-driven trading process turns noise into decisions. You define fields, measure the same metrics weekly, and change one variable at a time. Over months, small gains compound.

Centralize imports, auto tag trades, and run AI reviews with **The Trading Diary** at [thetradingdiary.com](https://www.thetradingdiary.com).

## What data-driven means
- Structure: setup definitions and stable tags.
- Measurement: a core metric set you do not change often.
- Feedback: dashboards and weekly summaries.
- Action: one change per week.

Internal link: For AI support across the stack, read [10 Proven Ways to Improve Your Crypto Trading Performance Using AI Tools](/blog/ai-tools-for-crypto-trading).

## Your trading data model
- Identity: timestamp, symbol, exchange, direction, size, planned R.
- Context: setup, regime, volatility, time bucket, news window.
- Execution: fills, slippage, stop moved, partials, exit reason.
- Outcomes: R multiple, drawdown impact, contribution to weekly PnL.
- Behavior: mood, checklist pass or fail, breach type.

## Metrics that drive decisions
- Expectancy, payoff ratio, win rate.
- R distribution and left tail risk.
- Drawdown depth and duration.
- Rule breaches and slippage trends.
- Hour heatmap and holding time.

## Dashboard essentials
1) Risk and PnL now.  
2) Where rules break.  
3) Which setups work.  
4) When to trade.  
5) What to change next.

## Risk data that protects capital
- Risk per trade 0.5–1.5 percent.
- Max open risk and concentration caps.
- Daily loss cap 3–5 R. Stop when hit.
- Trade count cap. Start at three.

## Weekly cadence
- Friday: confirm tags, compute expectancy by setup and regime, pick one hotspot and one rule, set one metric, publish plan.
- Monday: in-scope setups, risk caps, rule under test, add a dashboard tile.
- Midweek: review breaches and trade count, reduce size if needed.

## Regime detection
- Trend vs range using simple indicators.
- ATR percentiles for volatility classes.
- Run the correct playbook for the regime.

## Case study snapshot
- After six weeks: stop move breaches down 41 percent, removed a negative hour, expectancy up from 0.07 R to 0.21 R, max daily drawdown down 33 percent.

## FAQs

**Q: Do I need heavy coding?**  
A: No. Start with structured fields and simple classifiers.

**Q: How fast should results change?**  
A: Process metrics improve in weeks. Expectancy moves slower.

**Q: How do I handle news spikes?**  
A: Track slippage and skip windows with negative expectancy.`
  },
  {
    title: 'The Future of Crypto Journaling: How Automation and AI Are Changing the Game',
    slug: 'ai-powered-trading-journal',
    metaTitle: 'AI-Powered Trading Journal: The Future of Crypto Journaling',
    metaDescription: 'Automated imports, AI tagging, discipline scoring, dashboards, and weekly reviews that make journaling stick.',
    description: 'Automation and AI fix manual journaling friction with imports, tagging, pattern recognition, and focused reviews.',
    focusKeyword: 'AI-powered trading journal',
    readTime: '7 min read',
    author: 'Gustavo',
    date: '2025-10-22',
    category: 'AI Tools',
    tags: ['AI-powered journal', 'automation', 'dashboards', 'discipline'],
    canonical: 'https://www.thetradingdiary.com/blog/ai-powered-trading-journal',
    language: 'en',
    heroImage: '/blog/ai-automation-pipeline.png',
    heroImageAlt: 'AI-powered trading journal pipeline from import to coaching',
    content: `# The Future of Crypto Journaling: How Automation and AI Are Changing the Game

Manual journaling fails when markets move fast. Automation and AI fix the friction. They import fills, tag trades, surface patterns, and produce focused reviews. The goal is simple. Less manual effort. Faster feedback. Better decisions.

Automate imports, AI tagging, risk alerts, and weekly coaching with **The Trading Diary** at [thetradingdiary.com](https://www.thetradingdiary.com).

## What an AI-powered trading journal does
- Imports fills, fees, and timestamps from exchanges.
- Normalizes symbols and base currency.
- Tags setup, regime, volatility, and hour bucket.
- Scores discipline and tracks emotions.
- Generates dashboards and weekly summaries.

Internal link: Foundation steps in [Why Every Successful Trader Keeps a Trading Journal for Crypto](/blog/trading-journal-for-crypto).  
Internal link: AI usage ideas in [10 Proven Ways to Improve Your Crypto Trading Performance Using AI Tools](/blog/ai-tools-for-crypto-trading).

## What to automate first
- Imports and fees.  
- Tagging for setup, regime, volatility, and time buckets.  
- Plan vs execution scoring.  
- Weekly summaries with keep, fix, stop.  
- Risk alerts for loss cap and trade count.

## How AI tagging improves decisions
- Setup quality: rank by average R and expectancy.
- Regime matching: reduce drawdowns during shifts.
- Volatility sizing: adjust size and stop distances.
- Time of day effects: remove negative hours.

## Discipline analytics
- Track early exits, stop moves, and slippage.
- Use a discipline score and fix the top breach first.
- Add platform prompts that require a stop before order acceptance.

## Emotion tracking
- Pre and post trade labels with short notes.
- Correlate mood with expectancy and breaches.
- Cooldowns and one minute pauses reduce tilt.

## Dashboards that drive action
- Today's PnL and open risk.
- Breaches by type and count.
- Expectancy by setup and regime.
- Hour heatmap and slippage trend.
- Emotion score trend with warnings.

## Weekly reviews that happen
- Confirm tags and merge duplicates.
- Expectancy by setup and regime.
- One hotspot. One rule. One metric.
- Publish keep, fix, stop.

## Privacy and data control
- Use read-only keys and encryption.
- Ensure export and deletion controls.
- Prefer explainable features over black box signals.

## Case study snapshot
- After six weeks: missing notes near zero, stop move breaches down 39 percent, negative hour removed, expectancy up from 0.05 R to 0.19 R, daily max drawdown down 31 percent.

## FAQs

**Q: Do I need to code?**  
A: No. Exchange connections and built-in dashboards cover most needs.

**Q: How fast will I see results?**  
A: Breach counts fall within weeks. Expectancy moves slower.

**Q: What if I trade many coins?**
A: Tag by asset class and liquidity, then monitor exposure and slippage.`
  },
  {
    title: 'Best Crypto Trading Journal Apps in 2026: An Honest Review',
    slug: 'best-crypto-trading-journal-2026',
    metaTitle: 'Best Crypto Trading Journal Apps 2026 | The Trading Diary',
    metaDescription: 'Best crypto trading journal app 2026: honest review of TradeZella, Edgewonk, Tradervue, spreadsheets, Notion and The Trading Diary. Pros, cons, pricing.',
    description: 'Six crypto trading journals compared honestly: TradeZella, Edgewonk, Tradervue, spreadsheets, Notion templates, and The Trading Diary. No hype, just tradeoffs.',
    focusKeyword: 'best crypto trading journal app 2026',
    readTime: '8 min read',
    author: 'Gustavo Belfiore',
    date: '2026-04-24',
    category: 'reviews',
    tags: ['crypto trading journal', 'trading diary app', 'tradezella', 'edgewonk', 'tradervue', 'review'],
    canonical: 'https://www.thetradingdiary.com/blog/best-crypto-trading-journal-2026',
    language: 'en',
    heroImage: '/blog/covers/best-crypto-trading-journal-2026.jpg',
    heroImageAlt: 'Comparison of the best crypto trading journal apps in 2026',
    content: `# Best Crypto Trading Journal Apps in 2026: An Honest Review

If you search for the **best crypto trading journal app 2026**, most results are affiliate pages ranking whichever tool pays the highest commission. This review is different. I run a crypto trading journal, so I have spent real money testing what works and what does not for perpetual futures, spot, and on-chain trading.

Below you will find an honest breakdown of six options, including a spreadsheet, a Notion template, and my own product. Each gets the same treatment: what it does well, where it falls short, pricing, and who should use it.

## Why you need a crypto trading journal

Crypto moves 24/7 across dozens of venues. You trade perps on Bybit, spot on Binance, leveraged altcoins on Hyperliquid, and maybe options on Deribit. Exchange analytics are fragmented and wiped after 90 days. Without a journal you cannot answer:

- What is my actual win rate by setup?
- Am I losing money on funding fees?
- Which altcoins chew through my edge?
- Do I trade worse after a red day?

A proper journal answers those questions with data, not vibes.

## What to look for in 2026

Not every journal built for stocks handles crypto well. Use this short checklist before paying for anything:

- **Exchange imports**: Binance, Bybit, OKX, Hyperliquid, Coinbase, Kraken at a minimum.
- **Perpetuals support**: funding fees tracked, leverage logged, liquidation price visible.
- **Multi-asset analytics**: segment by coin, setup, session, timeframe.
- **Emotional and behavioral tagging**: revenge-trade flags, tilt counters, pre-trade mood.
- **Plan vs execution diff**: entry, stop, target planned vs actual.
- **Screenshot storage**: TradingView chart per trade.
- **Data ownership**: export to CSV, no lock-in.
- **Fair pricing**: you pay in subscription, not by trade volume.

## The six options, reviewed honestly

### 1. TradeZella

Polished UI, strong on stocks and options, crypto support is functional but clearly secondary. Import works for Binance and Bybit via CSV, but perpetual funding fees do not always reconcile. Mental preparation and playbook features are excellent.

- **Pros**: beautiful interface, strong community, good backtester, coaching features.
- **Cons**: crypto handling feels bolted on, funding fees tricky, pricing has crept up.
- **Pricing**: roughly 29 to 59 USD per month in 2026.
- **Best for**: multi-asset traders whose primary edge is stocks or futures.

### 2. Edgewonk

The veteran. Manual entry first, but extremely deep analytics. Custom statistics, tilt-meter, and the cleanest expectancy dashboards on the market. The UI looks like 2018 and the CSV workflow is friction-heavy.

- **Pros**: the deepest analytics of any tool tested, one-time-ish pricing.
- **Cons**: manual import is brutal for high-frequency crypto scalpers, interface dated.
- **Pricing**: around 169 USD per year.
- **Best for**: swing traders who take fewer than 10 trades a week and want serious stats.

### 3. Tradervue

A long-standing tool with solid community features and note-sharing. Crypto imports are limited and broker support leans heavily toward US equities. If you trade crypto exclusively, you will feel this.

- **Pros**: mature platform, reliable uptime, good at sharing trade notes.
- **Cons**: weak crypto integrations, interface feels legacy.
- **Pricing**: 29 to 79 USD per month.
- **Best for**: equities traders with a small crypto sleeve.

### 4. A Google Sheets or Excel spreadsheet

Do not dismiss this. A spreadsheet you actually fill out beats a 59-dollar tool you ignore. You can calculate R multiples, win rate, and expectancy with basic formulas. The community has free templates on Reddit and GitHub.

- **Pros**: free, infinitely customizable, data is yours forever.
- **Cons**: no automation, no exchange imports, no screenshots, no AI.
- **Pricing**: free.
- **Best for**: beginners logging fewer than 5 trades a week and traders on a tight budget.

### 5. A Notion template

Notion crypto journal templates range from free to around 30 USD one-time. You get a tidy database, kanban boards, and a cover page that feels productive. You will also spend two hours a week copy-pasting data.

- **Pros**: beautiful, flexible, good for qualitative notes.
- **Cons**: no real analytics, no exchange sync, charts require manual embedding.
- **Pricing**: free to 30 USD one-time.
- **Best for**: journalers who care more about reflection than numbers.

### 6. The Trading Diary

Full disclosure: this is my product. I built it because I traded crypto perps full time and nothing on the market handled my workflow. The differentiator is AI trade extraction: paste a screenshot or message and it parses entry, stop, target, and setup automatically. Crypto-specific analytics include funding fee drag, liquidation distance, and session heatmaps by UTC hour.

- **Pros**: AI extraction saves 10 minutes a trade, crypto-first design, transparent pricing.
- **Cons**: newer product, smaller community than TradeZella, fewer integrations outside crypto.
- **Pricing**: free tier, paid plans around 15 USD per month.
- **Best for**: crypto-only traders who want to journal in seconds, not minutes.

See it at [thetradingdiary.com](https://www.thetradingdiary.com).

## How to choose

Pick based on how you actually trade, not on what looks prettiest:

- **You scalp perps daily**: The Trading Diary or TradeZella with CSV discipline.
- **You swing trade a few coins**: Edgewonk or a solid spreadsheet.
- **You want reflection over analytics**: Notion template.
- **You trade stocks plus a little crypto**: TradeZella or Tradervue.
- **You are brand new**: free spreadsheet for 60 days, then upgrade.

The best **crypto trading journal review** you can do is a 30-day trial. Most of these tools offer one. Pick two, log every trade, and see which one you still open on day 25.

## FAQ

**Q: Is a crypto trading journal worth paying for?**
A: If you trade more than 20 times a month, yes. The edge gained from honest weekly review will easily cover a 15 to 30 USD monthly fee.

**Q: What is the best free crypto trading journal?**
A: A Google Sheet you actually fill out. The Trading Diary also has a free tier with AI trade extraction.

**Q: Can I import trades from Binance and Bybit automatically?**
A: Yes on The Trading Diary, TradeZella, and Tradervue. Edgewonk uses CSV. Spreadsheets and Notion are manual.

**Q: Does a trading diary app improve performance?**
A: It does when you review it weekly. The tool itself does nothing. The habit of reviewing is what changes behavior.

**Q: What is the single most important feature in a trading diary app?**
A: Low friction. If logging a trade takes more than 60 seconds, you will stop doing it. Pick the one you will actually use.`
  },
  {
    title: 'How to Calculate Position Size in Crypto Trading (with Examples)',
    slug: 'how-to-calculate-position-size-crypto',
    metaTitle: 'How to Calculate Position Size in Crypto | The Trading Diary',
    metaDescription: 'How to calculate position size crypto: exact formula, worked examples for BTC and ETH, leverage, liquidation, Kelly criterion, and common mistakes.',
    description: 'The exact formula for crypto position sizing with worked BTC and ETH examples. Leverage impact, liquidation distance, and the mistakes most traders make.',
    focusKeyword: 'how to calculate position size crypto',
    readTime: '7 min read',
    author: 'Gustavo Belfiore',
    date: '2026-04-24',
    category: 'risk-management',
    tags: ['position sizing', 'crypto risk', 'risk per trade', 'leverage', 'liquidation'],
    canonical: 'https://www.thetradingdiary.com/blog/how-to-calculate-position-size-crypto',
    language: 'en',
    heroImage: '/blog/covers/how-to-calculate-position-size-crypto.jpg',
    heroImageAlt: 'Formula and example for calculating crypto position size',
    content: `# How to Calculate Position Size in Crypto Trading (with Examples)

Most crypto traders blow up accounts because they size positions by feel. They ask "how many contracts?" instead of "how much am I willing to lose?" This guide shows exactly **how to calculate position size crypto**, with a formula you can use in 30 seconds and worked examples for BTC and ETH.

## Why position sizing matters more than entries

Your edge is expressed through position size. A 60% win-rate system will still blow up if each loser is three times bigger than each winner. Position sizing is what turns a statistical edge into an equity curve. Get this wrong and nothing else matters.

Professional traders obsess about one number: **risk per trade**. Not account size. Not leverage. Not win rate. Risk per trade.

## The formula

Here is the core formula every crypto trader should memorize:

\`\`\`
position_size = (account_balance * risk_percent) / (entry_price - stop_price)
\`\`\`

That is it. Everything else is a variation.

- **account_balance**: your total trading capital, in USD or USDT.
- **risk_percent**: the fraction of your account you are willing to lose on this trade. Typically 0.005 to 0.02 (0.5% to 2%).
- **entry_price**: where you plan to enter.
- **stop_price**: where you will exit if wrong.

The denominator \`(entry_price - stop_price)\` is your risk per unit. Divide dollar risk by per-unit risk and you get the number of units (coins or contracts) to buy.

## Fixed fractional vs fixed dollar

Two approaches dominate:

- **Fixed fractional**: you always risk a percentage (say 1%) of the current balance. When you win, size grows. When you lose, size shrinks. This is self-correcting and the default for most disciplined traders.
- **Fixed dollar**: you risk a flat amount (say 20 USD) per trade regardless of account size. Simple, but does not compound growth and does not protect a shrinking account.

Beginners should use fixed fractional. It removes emotional decisions and enforces discipline automatically.

## The Kelly criterion, briefly

Kelly tells you the mathematically optimal fraction to risk given your edge. The formula simplifies to:

\`\`\`
kelly_fraction = win_rate - (loss_rate / win_loss_ratio)
\`\`\`

With a 55% win rate and 2:1 reward-to-risk, Kelly suggests risking around 32.5% per trade. That is insane for real trading. Variance will destroy you.

Instead, use **fractional Kelly**, typically 1/4 or 1/8 of the Kelly number. Most pros end up risking between 0.5% and 2% per trade, which is exactly what fractional Kelly recommends for realistic crypto edges.

## Worked examples

### Example 1: BTC perp, 1000 USD account, 2% risk

- Account: 1000 USD
- Risk: 2% = 20 USD
- Entry: 60,000 USD
- Stop: 58,000 USD (2000 USD below entry)

\`\`\`
position_size = 20 / (60000 - 58000) = 20 / 2000 = 0.01 BTC
\`\`\`

You buy 0.01 BTC. Notional value is 600 USD. If BTC hits your stop, you lose exactly 20 USD.

### Example 2: ETH perp, 5000 USD account, 1% risk

- Account: 5000 USD
- Risk: 1% = 50 USD
- Entry: 3200 USD
- Stop: 3100 USD (100 USD below)

\`\`\`
position_size = 50 / (3200 - 3100) = 50 / 100 = 0.5 ETH
\`\`\`

You buy 0.5 ETH. Notional: 1600 USD. Loss at stop: 50 USD.

### Example 3: ADA perp, 2000 USD account, 0.5% risk

- Account: 2000 USD
- Risk: 0.5% = 10 USD
- Entry: 0.50 USD
- Stop: 0.47 USD (0.03 below)

\`\`\`
position_size = 10 / 0.03 = 333.33 ADA
\`\`\`

You long 333 ADA. Notional: 166.50 USD. Loss at stop: about 10 USD.

## Leverage and liquidation

Leverage does not change your position size. It changes your margin requirement. Using the BTC example above, buying 0.01 BTC at 60,000 USD requires 600 USD in notional. At:

- **1x leverage**: 600 USD margin used.
- **10x leverage**: 60 USD margin used.
- **50x leverage**: 12 USD margin used.

Your **risk** is still 20 USD regardless of leverage, because your stop is in the same place. But leverage shrinks the price distance to **liquidation**. At 50x, your liquidation is approximately 2% below entry on a cross margin account. If your stop is 3.3% away (as in the BTC example), you get liquidated before the stop triggers.

Rule of thumb: liquidation distance should always be at least 2x your stop distance. Otherwise a normal wick closes your account.

## Common mistakes

- **Risking a percent of leveraged notional**: people say "I am risking 2% on 10x leverage", meaning they are really risking 20% of spot. This is how accounts die.
- **Moving the stop to fit desired size**: if you want a bigger position and tighten the stop to justify it, you are gambling.
- **Ignoring fees and funding**: on perps, round-trip fees plus a day of funding can eat 0.1% of notional. Bake this into risk.
- **Sizing by gut when excited**: the trade that "has to work" is the one you size down, not up.
- **Not using a calculator**: do the math every single trade. Muscle memory is not a risk system.

The Trading Diary logs planned risk and actual risk per trade and flags when they diverge. See it at [thetradingdiary.com](https://www.thetradingdiary.com).

## FAQ

**Q: What is the best risk per trade in crypto?**
A: For most traders, 0.5% to 1%. Professional traders stay under 2%. Anything above 3% means one bad streak ends you.

**Q: How do I calculate position size with leverage?**
A: Leverage does not enter the formula. Calculate position size by risk and stop distance first, then verify the notional fits within your leverage limits without being too close to liquidation.

**Q: Is Kelly criterion useful for crypto?**
A: Full Kelly is too aggressive. Use 1/4 Kelly as an upper bound, which typically lands in the 1-2% range anyway.

**Q: What is a crypto position sizing calculator?**
A: Any tool that takes account balance, risk percent, entry and stop and returns the position size. You can build one in a spreadsheet in 10 minutes or use a dedicated calculator.

**Q: Should I use the same risk on every trade?**
A: Fixed fractional is the safest default. Once you have 200+ journaled trades, you can scale slightly on higher-conviction setups (say 1.5% instead of 1%), never double.`
  },
  {
    title: 'How to Stop Revenge Trading: A Step-by-Step System',
    slug: 'how-to-stop-revenge-trading',
    metaTitle: 'How to Stop Revenge Trading: Step-by-Step | The Trading Diary',
    metaDescription: 'How to stop revenge trading: the neuroscience behind it, patterns to recognize, and a proven 5-step system crypto traders use to break the cycle.',
    description: 'A practical 5-step system to stop revenge trading. Why it happens (neurochemistry), how to recognize the urge, and what to do instead in the next 15 minutes.',
    focusKeyword: 'how to stop revenge trading',
    readTime: '6 min read',
    author: 'Gustavo Belfiore',
    date: '2026-04-24',
    category: 'psychology',
    tags: ['revenge trading', 'trading psychology', 'discipline', 'tilt', 'emotional control'],
    canonical: 'https://www.thetradingdiary.com/blog/how-to-stop-revenge-trading',
    language: 'en',
    heroImage: '/blog/covers/how-to-stop-revenge-trading.jpg',
    heroImageAlt: 'Trader taking a break from the screen to avoid revenge trading',
    content: `# How to Stop Revenge Trading: A Step-by-Step System

You just took a loss. Your finger hovers over the buy button. The chart is screaming at you that the next move is obvious. Ten minutes later you are down triple. You know the feeling. This guide is about **how to stop revenge trading** before it destroys another account.

There is no mystical fix. Just a system that works when you use it.

## What revenge trading actually is

Revenge trading is an emotional reflex after a loss where you enter a new position with the goal of "getting back" what you lost, rather than because the setup is valid.

Key markers:

- The trade is outside your rules.
- Position size is bigger than normal.
- You skip the checklist.
- You move stops to avoid the second loss.
- You feel rushed, not calm.

It is not about the direction being wrong. Plenty of revenge trades win. The problem is the process: you are not trading, you are gambling with your broker.

## The neuroscience, briefly

When you take a loss, your brain releases cortisol and your amygdala lights up the same way it does for physical threats. Dopamine levels drop. Your prefrontal cortex, the part that enforces rules, quiets down.

Your body is now in a state researchers call **reward prediction error recovery**. You are not wired to sit still. You are wired to act, fast, to restore the missing dopamine.

This is why "just discipline yourself" does not work. You are fighting hundreds of thousands of years of evolution with willpower alone. Willpower loses. You need a system.

## Patterns to recognize in yourself

Watch for these before the damage:

- **Size creep**: the next trade is 2x or 3x normal.
- **Shorter time-to-entry**: you enter within seconds of setup.
- **Ignoring the checklist**: you skip the plan, stop, or target.
- **Self-talk shift**: phrases like "I just need one good trade" or "this one will make it back".
- **Physical signs**: tight jaw, shallow breathing, hunched posture.
- **Chart-hopping**: you flick through 20 coins looking for any reason to click.

If you catch two of these simultaneously, you are in tilt. Stop.

## The 5-step system

This is what works. Follow it in order.

### Step 1: walk away for 15 minutes

Physically leave the desk. Not to a different tab. Not to Twitter. Leave. Walk outside, drink water, stretch. Fifteen minutes is the minimum cortisol half-life window. Less and you are still chemically hot.

### Step 2: log the loss with zero emotion

Open your journal. Write down: what setup, what size, what R multiple, what went wrong. Facts only. No "I should have" or "the market is manipulated". If you cannot write the entry without emotion, go back to step 1.

### Step 3: review the setup honestly

Was the trade inside your rules? If yes, it was a valid loss and no revenge needed. Losses are the cost of doing business. If no, you have a process problem that revenge trading will worsen.

Ask one question: "If I had not just lost money, would I take this next trade?" If the answer is no, you are revenge trading.

### Step 4: re-read your trading rules

Open the document you wrote when calm. Read it out loud. Your playbook, your max daily loss, your setup criteria. You wrote this when your brain was working. Let it speak to the version of you that is not.

### Step 5: only return when you can articulate why

Before the next trade, say out loud: "I am taking this trade because [setup], with stop at [price], targeting [price], risking [%]." If you stumble, you are not ready. Wait.

## Tools that help

- **Daily loss lock**: set a max daily loss (say 3% of account) after which the platform locks you out. Most exchanges do not do this. The Trading Diary and some third-party tools enforce it.
- **Pre-trade emotion log**: one word before entry (calm, rushed, revenge, confident). Correlate with outcomes weekly. You will see the pattern fast.
- **Screen time cap**: after hitting max daily loss or max trades, walk away for the day. No exceptions.
- **Accountability partner**: a group chat where you have to post every entry. Public rules get broken less often.
- **Cooldown timer**: set a 30-minute minimum between trades after any loss. Hard rule.

The Trading Diary flags when your current trade size or frequency indicates likely revenge trading based on your historical data. See [thetradingdiary.com](https://www.thetradingdiary.com).

## What the literature says

Behavioral finance research (Shefrin and Statman on loss aversion, Barber and Odean on overtrading) shows retail traders consistently underperform because they hold losers too long and overtrade after losses. Revenge trading is the sharpest form of this pattern. The academic fix is the same as the practical one: rules, cooldowns, and journaled reviews.

## FAQ

**Q: Why do I keep revenge trading even when I know it is wrong?**
A: Because knowledge lives in the prefrontal cortex and the urge lives in the limbic system. The limbic system wins under stress. You need a mechanical system that does not require in-the-moment willpower.

**Q: How long does revenge trading last after a big loss?**
A: Typically 30 to 90 minutes for the acute cortisol window. The behavioral residue can last the rest of the day. Many traders report worse performance for 24 to 48 hours after a big drawdown.

**Q: Is revenge trading a sign I should quit?**
A: No. It is a sign you need better systems. Nearly every successful trader has revenge traded. The ones who survive install rules that prevent it.

**Q: Does meditation help?**
A: Yes, but slowly. The faster intervention is a hard daily loss lock. Meditation builds the base; the loss lock is the seat belt.

**Q: What is the single best first step to stop revenge trading?**
A: Set a max daily loss. Write it in your journal. Hit it, stop for the day. One rule, no exceptions. Everything else builds from there.`
  },
  {
    title: 'Complete Crypto Risk Management Guide for 2026',
    slug: 'crypto-risk-management-guide-2026',
    metaTitle: 'Crypto Risk Management Guide 2026 | The Trading Diary',
    metaDescription: 'Crypto trading risk management guide for 2026: three layers of risk, daily loss locks, drawdown rules, leverage, funding fees, and a real case study.',
    description: 'A complete framework for managing risk in crypto trading: per-trade rules, daily loss locks, drawdown thresholds, correlation, leverage, and a real case study.',
    focusKeyword: 'crypto trading risk management guide',
    readTime: '9 min read',
    author: 'Gustavo Belfiore',
    date: '2026-04-24',
    category: 'risk-management',
    tags: ['crypto risk management', 'drawdown', 'leverage', 'funding fees', 'correlation', 'daily loss lock'],
    canonical: 'https://www.thetradingdiary.com/blog/crypto-risk-management-guide-2026',
    language: 'en',
    heroImage: '/blog/covers/crypto-risk-management-guide-2026.jpg',
    heroImageAlt: 'Crypto risk management dashboard showing drawdown and exposure',
    content: `# Complete Crypto Risk Management Guide for 2026

Risk management is the only part of trading you fully control. You cannot control whether BTC breaks 80k next week. You can control how much you lose if it does not. This **crypto trading risk management guide** lays out a complete framework built for 2026 market conditions: higher leverage, more correlated altcoins, and funding costs that can eat a week of profits in a day.

This is long. Bookmark it. Re-read it every time you size up.

## The three layers of risk

Think of risk in layers, each with its own rule:

- **Per-trade risk**: how much you can lose on any single position.
- **Daily risk**: how much you can lose in one trading session.
- **Overall account risk**: how much drawdown the account can take before you stop and review.

If any one layer is breached, you stop. No single trade should be able to damage the daily budget. No single day should be able to breach the monthly budget.

## Layer 1: the 1-2% rule

The foundation rule. Never risk more than 1% of your account on a single trade. If you are aggressive and experienced, 2%. More than that and you are not trading, you are gambling.

On a 10,000 USD account:

- 1% risk = 100 USD per trade
- 2% risk = 200 USD per trade

"Risk" means the dollar loss if your stop hits. Not position size, not notional, not margin used. The amount you lose at stop.

Formula reminder:

\`\`\`
position_size = (account * risk%) / (entry - stop)
\`\`\`

See the [position sizing guide](/blog/how-to-calculate-position-size-crypto) for worked examples.

## Layer 2: the daily loss lock

After you hit 3% daily loss, you are done for the day. Hard stop. No exceptions.

Why 3%? Because it is three max trades at 1% risk. Three losing trades in a row is normal statistical variance. Four or more suggests something is wrong, with the market or with you, and you should not find out by losing a fifth.

Enforcement options:

- **Mechanical**: use a tool that locks your exchange API or your account after a set loss. The Trading Diary supports this.
- **Manual**: close the platform, walk away, do something physical.
- **Social**: post in an accountability group that you are done for the day.

The manual version fails for most people. Install a mechanical lock if you can.

## Layer 3: drawdown thresholds

Every account goes into drawdown. The question is how you respond. Set three thresholds:

- **5% drawdown**: neutral. This is normal variance. Keep trading with the same size.
- **10% drawdown**: halve your size. Risk 0.5% per trade until you recover half of it. This prevents revenge trading at scale.
- **20% drawdown**: stop trading entirely. Take a week off. Review every trade. Rebuild the system before adding risk back.

Most blowups happen between 10% and 40%. Traders who cut size at 10% almost never hit 40%. Traders who "just push through" almost always do.

## Correlation risk

In crypto, everything correlates with BTC when BTC moves hard. You can have five "different" trades (ETH, SOL, ADA, AVAX, LINK) and effectively be one giant BTC position.

Rules for correlation:

- **Total open risk**: sum of all active trade risks should not exceed 4-6% of account.
- **Alt basket limit**: no more than three simultaneous alt longs or shorts.
- **Single-session cap**: during major BTC events (FOMC, CPI), cut total open risk in half.

Example: you have 1% risk on ETH long, 1% on SOL long, and 1% on ADA long. On paper that is 3% total risk. In practice, if BTC dumps 5% in an hour, all three hit stops simultaneously and you lose the full 3%. Correlated positions are not independent trades.

## Leverage rules

Leverage is a knob, not a strategy. Start at 2-3x and only increase once you have 200+ journaled trades with documented positive expectancy.

- **New traders**: 2x max, even on major coins.
- **Intermediate**: 5x on BTC/ETH perps, 3x on alts.
- **Advanced**: 10x on BTC/ETH with tight stops, 5x alts, 2x exotic.

Anything above 20x on crypto is a liquidation lottery ticket. You are betting that price does not wick through your stop. Wicks are how most leveraged accounts die.

## Funding fee costs on perps

Funding is paid every 8 hours on most exchanges. It is small per session but compounds. At 0.01% per 8 hours, a week of holding a long in a high-funding market costs 0.21%. During euphoric runs, funding spikes to 0.1% per session, which is 2.1% per week. That can wipe a good trade.

Rules:

- **Always check funding before entering**: if you are trading with the crowd, you pay funding. Against it, you collect.
- **Day trades**: ignore funding.
- **Swing trades**: bake funding into expectancy.
- **Trend follows**: during euphoric phases, funding alone can make a trend short profitable.

## Position stacking

Stacking means adding to a winning position. Done wrong it adds risk. Done right, it concentrates winners.

Rules:

- **Only stack on confirmed continuation**: not on wishful dips.
- **Reduce size with each add**: 1x base, 0.5x first add, 0.25x second add.
- **Move the total-position stop to breakeven after the first add**: you should never turn a winner into a full loser.

## A real case study: down 8% for the month

You are three weeks into a month. Account started at 10,000 USD. You are now at 9,200 USD, down 8%. You are in drawdown layer 2 territory. What do you do?

1. **Halve your size immediately**. New risk per trade: 0.5%, or 46 USD based on current balance.
2. **Review every trade from the last 30 days**. Tag each: valid setup, invalid setup, tilt, revenge, late entry. Count the tags.
3. **Find the one biggest leak**. Most traders find that 70% of the damage came from 20% of the trades, always the same pattern (e.g., longs into resistance, shorts into support, scalping in low volatility).
4. **Install one blocking rule**. Based on the review, write one rule that would have prevented 50%+ of the damage.
5. **Paper trade the new rule for 3-5 days**. Prove it works before risking capital.
6. **Return at half size for 20 trades**. Only scale back to full size after you recover half the drawdown cleanly.

This is how professionals handle a bad month. Amateurs add size to "make it back" and turn 8% into 25%.

The Trading Diary flags drawdown thresholds automatically and prompts the review workflow. See [thetradingdiary.com](https://www.thetradingdiary.com).

## FAQ

**Q: What is the most important rule in crypto risk management?**
A: Never risk more than you are willing to lose on a single trade. 1% is the default, 2% the ceiling. Everything else builds from this.

**Q: How do I manage risk when holding multiple positions?**
A: Cap total open risk at 4-6% of account. Treat correlated alts as a single trade. Halve total exposure before major macro events.

**Q: What is a reasonable monthly drawdown in crypto?**
A: 5-10% is normal. 15-20% is a warning. Above 20% is a structural problem that requires a stop and review.

**Q: Should I use trailing stops?**
A: Yes, after the trade moves at least 1R in your favor. Never use trailing stops as initial stops, they get hit by normal noise.

**Q: How do I know if my risk management is working?**
A: You have a healthy equity curve that grinds higher with shallow drawdowns. If you see sharp V-shaped recoveries, you are probably revenge trading and getting lucky. That ends eventually.`
  }
];
