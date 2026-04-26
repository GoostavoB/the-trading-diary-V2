/**
 * Programmatic SEO data for /exchanges/:slug/trade-history-export pages.
 *
 * Each entry feeds the ExchangeTutorial.tsx template — single source of truth
 * for SEO meta + page content. Keep entries genuinely different (real screenshots,
 * real quirks per exchange) to avoid Google's "doorway page" pattern detection.
 *
 * Add more exchanges by extending this array.
 */

export interface ExchangeTutorial {
  /** URL slug. Renders at /exchanges/<slug>/trade-history-export */
  slug: string;
  /** Display name shown in the page (and breadcrumb). */
  name: string;
  /** Path or URL of the exchange's logo (square). */
  logo: string;
  /** Short tagline for the hero subtitle. */
  tagline: string;
  /** Primary search-target keyword (also drives meta title). */
  primaryKeyword: string;
  /** Year on the page — bumped annually so the article looks fresh. */
  year: number;
  /** Average reading time in minutes. */
  readingTime: number;
  /** True if the exchange offers a native CSV export from the UI. */
  hasNativeCsv: boolean;
  /** True if the exchange offers a public REST API for trade history. */
  hasApiAccess: boolean;
  /** True if API requires a passphrase (KuCoin, OKX, etc). */
  apiRequiresPassphrase: boolean;
  /** True if the exchange supports both spot and perpetuals. */
  hasFutures: boolean;
  /** Step-by-step instructions for the manual CSV/UI export. */
  manualSteps: Array<{
    title: string;
    body: string;
    /** Optional path to an inline screenshot — relative to /public */
    screenshot?: string;
  }>;
  /** Step-by-step instructions for the API method (if applicable). */
  apiSteps?: Array<{ title: string; body: string }>;
  /** What columns the export contains. */
  exportColumns: string[];
  /** Things people commonly get wrong with this exchange's exports. */
  gotchas: string[];
  /** Five Q&As — schema FAQPage eligible. */
  faqs: Array<{ question: string; answer: string }>;
  /** Last reviewed/updated date YYYY-MM-DD. Drives `lastmod` and the visible "Last updated". */
  lastUpdated: string;
}

export const EXCHANGE_TUTORIALS: ExchangeTutorial[] = [
  // ── BINANCE ──────────────────────────────────────────────────────────────
  {
    slug: 'binance',
    name: 'Binance',
    logo: '/exchange-logos/binance.svg',
    tagline: 'The world\'s largest crypto exchange — exporting your full trade history end-to-end.',
    primaryKeyword: 'Binance trade history export',
    year: 2026,
    readingTime: 7,
    hasNativeCsv: true,
    hasApiAccess: true,
    apiRequiresPassphrase: false,
    hasFutures: true,
    manualSteps: [
      {
        title: 'Open Binance Order History',
        body: 'Log into binance.com, click your profile icon (top-right), and choose **Orders → Spot Order** for spot trades, or **Orders → Futures Order** for perps. The two histories are separate and must be exported individually — there is no unified export.',
      },
      {
        title: 'Set the date range',
        body: 'Use the **Custom Date** filter to choose a window. Binance limits each export to **3 months**. For a full year, run four exports and concatenate them.',
      },
      {
        title: 'Click "Export" → "Generate"',
        body: 'Binance queues the report. For active accounts, expect a 30–90 second wait. You\'ll get an email when it\'s ready, OR you can return to the same page and click "Download" once it appears.',
      },
      {
        title: 'Save the CSV',
        body: 'The file arrives as a `.csv.gz` (gzipped CSV). Decompress with `gunzip` on macOS/Linux or 7-Zip on Windows. The headers are in English regardless of your account language.',
      },
      {
        title: 'Repeat for futures + funding',
        body: 'Funding fees are NOT in the trade export. To get them, go to **Wallet → Transaction History → Income** and filter by `FUNDING_FEE`. This matters: ignoring funding makes your perpetuals P&L look better than it really is.',
      },
    ],
    apiSteps: [
      {
        title: 'Create a read-only API key',
        body: 'Settings → API Management → Create. Enable **only** "Enable Reading". Disable everything else (especially withdrawals). Whitelist your IP if you can.',
      },
      {
        title: 'Use the right endpoint',
        body: 'Spot trades: `GET /api/v3/myTrades`. Futures trades: `GET /fapi/v1/userTrades`. Funding: `GET /fapi/v1/income?incomeType=FUNDING_FEE`. All require HMAC-SHA256 signing of the query string with your secret key.',
      },
      {
        title: 'Paginate carefully',
        body: 'Default limit is 500 rows per request. Walk forward in time using `startTime` (ms) and `endTime`. Sleep 200ms between calls to stay under the 1200/min weight limit.',
      },
    ],
    exportColumns: [
      'Date(UTC)', 'Pair', 'Side (BUY/SELL)', 'Price', 'Executed', 'Amount', 'Fee', 'Fee Coin',
      'Realized Profit (futures only)', 'Order ID',
    ],
    gotchas: [
      'Spot and futures histories are separate — easy to forget half your trades.',
      'Funding fees live in a third export (Income), not the trade history.',
      'Conversions via Binance Convert do NOT appear in the trade history — they\'re in **Convert History** under the Wallet menu.',
      'If you used a sub-account, log into the sub-account directly to export — the parent account doesn\'t see sub-account trades.',
      'Times are in UTC, not your local timezone. If you trade in PST and your journal expects local time, you\'ll need to convert.',
    ],
    faqs: [
      {
        question: 'Can I export more than 3 months of Binance trade history at once?',
        answer: 'No — Binance caps each export to 3 months. For a full year, run four sequential exports and concatenate the CSVs. The Trading Diary handles this concatenation automatically when you upload multiple files.',
      },
      {
        question: 'Where are funding fees in the Binance export?',
        answer: 'Funding fees are NOT in the trade history. Go to Wallet → Transaction History → filter by `FUNDING_FEE`. Without these, your perpetuals P&L is overstated. The Trading Diary imports both and reconciles them per position.',
      },
      {
        question: 'Does Binance Convert show up in the trade history?',
        answer: 'No. Convert is a separate menu (Wallet → Convert History). The Trading Diary supports importing both the regular trade CSV and the Convert CSV, merging them by timestamp.',
      },
      {
        question: 'Is it safe to give The Trading Diary my Binance API key?',
        answer: 'Yes — when you create the key with read-only permission and IP whitelist enabled. The Trading Diary stores keys encrypted server-side, can never withdraw funds, and you can revoke access from Binance at any time.',
      },
      {
        question: 'How do I import Binance Futures trade history?',
        answer: 'Use the same Order History page, but switch the filter from Spot to Futures. The CSV format is similar but adds a "Realized Profit" column. The Trading Diary detects this column and treats the rows as futures positions automatically.',
      },
    ],
    lastUpdated: '2026-04-24',
  },

  // ── BYBIT ────────────────────────────────────────────────────────────────
  {
    slug: 'bybit',
    name: 'Bybit',
    logo: '/exchange-logos/bybit.svg',
    tagline: 'Top derivatives exchange — pulling your perps history without losing the funding details.',
    primaryKeyword: 'Bybit trade history export',
    year: 2026,
    readingTime: 8,
    hasNativeCsv: true,
    hasApiAccess: true,
    apiRequiresPassphrase: false,
    hasFutures: true,
    manualSteps: [
      {
        title: 'Open Trade History on Bybit',
        body: 'Log into bybit.com, hover **Orders & Trades** (top nav), and click **Trade History**. Switch between **Spot**, **Derivatives**, and **Copy Trading** tabs depending on what you trade.',
      },
      {
        title: 'Pick your date range',
        body: 'Bybit allows up to **6 months** per export — twice the window Binance gives you. Use the date picker. Bybit lets you switch between UTC+0 and your local timezone before exporting; default is UTC+0.',
      },
      {
        title: 'Click "Export"',
        body: 'A small dialog appears asking which fields to include. Tick **everything** — you can drop columns later but can\'t add what you didn\'t export. Click Export to start the job.',
      },
      {
        title: 'Wait and download',
        body: 'Reports take 1–3 minutes for active accounts. Bybit emails you when it\'s ready and the file appears under **My Reports**. Format is plain CSV (no gzip).',
      },
      {
        title: 'Export funding history separately',
        body: 'Bybit\'s funding history is at **Assets → Derivatives Account → Funding Fee History**. It is NOT included in the trade export. The Trading Diary auto-pulls funding from the API but for a manual CSV import, run this export too.',
      },
    ],
    apiSteps: [
      {
        title: 'Create a read-only API key',
        body: 'Account & Security → API → Create New Key. Choose "System-generated" (not custom IP). Permissions: **Read-Only**. Disable Trade, Withdraw, Position. Save the secret immediately — Bybit shows it once.',
      },
      {
        title: 'Use V5 endpoints',
        body: 'Bybit\'s V5 unified API: `GET /v5/execution/list?category=linear|spot|inverse`. Funding: `GET /v5/account/transaction-log?type=SETTLEMENT`. Sign with HMAC-SHA256 over the query string + timestamp + recv-window header.',
      },
      {
        title: 'Pagination via cursor',
        body: 'Bybit returns a `nextPageCursor` field. Pass it back as the `cursor` parameter to walk pages. Up to 100 rows per call. Rate limit: 600 calls/minute per key.',
      },
    ],
    exportColumns: [
      'Contracts', 'Side', 'Type', 'Status', 'Trade Price', 'Trade Quantity', 'Trade Value',
      'Order Price', 'Order Type', 'Trade Type', 'Maker/Taker', 'Fee Rate', 'Fee', 'Trade Time',
      'Closed P&L (derivatives only)',
    ],
    gotchas: [
      '**Funding fees are NOT in the trade CSV** — many traders miss this and overstate their P&L. Funding lives in the Asset → Funding Fee History export.',
      'The "Closed P&L" column on derivatives is the realized P&L NET of fees but BEFORE funding. Add funding manually for a true number.',
      'If you have a Unified Trading Account (UTA), the export structure differs slightly from the Standard Account. Check which one you\'re on.',
      'Bybit\'s "Trade Time" is UTC+0 by default but you can flip the toggle. Mixed-timezone CSVs are a pain to debug — pick one and stay with it.',
      'Copy trading P&L is in a separate tab. Easy to skip if you only checked the Derivatives tab.',
    ],
    faqs: [
      {
        question: 'How far back can I export Bybit trade history?',
        answer: 'Bybit retains 2+ years of trade history but each export is capped at 6 months. For a full 2-year history, run 4 exports and concatenate. The Trading Diary merges them on upload.',
      },
      {
        question: 'Why doesn\'t my Bybit P&L match The Trading Diary?',
        answer: 'Most likely you didn\'t import funding fees. Bybit\'s "Closed P&L" column excludes funding. The Trading Diary imports funding from the API or a separate CSV and reconciles per position — that\'s why our number is sometimes lower than Bybit\'s in-app number.',
      },
      {
        question: 'Does Bybit allow read-only API keys?',
        answer: 'Yes — when creating an API key, leave only "Read-Only" enabled and disable Trade and Withdraw. Save the secret, paste it into The Trading Diary\'s exchange connection page, and you\'re done.',
      },
      {
        question: 'How do I export Bybit copy-trading history?',
        answer: 'Trade History page has a separate Copy Trading tab. Export from there. The Trading Diary tags these rows distinctly so you can analyze copy-trading performance separately from your discretionary trades.',
      },
      {
        question: 'Is the Bybit Unified Account export different?',
        answer: 'Yes — UTA users see one merged trade history; Standard Account users see Spot, Linear, and Inverse separately. Both formats are supported on import.',
      },
    ],
    lastUpdated: '2026-04-24',
  },

  // ── COINBASE ──────────────────────────────────────────────────────────────
  {
    slug: 'coinbase',
    name: 'Coinbase',
    logo: '/exchange-logos/coinbase.svg',
    tagline: 'US market leader — clean OAuth flow and clear tax-friendly exports.',
    primaryKeyword: 'Coinbase trade history download',
    year: 2026,
    readingTime: 6,
    hasNativeCsv: true,
    hasApiAccess: true,
    apiRequiresPassphrase: false,
    hasFutures: false,
    manualSteps: [
      {
        title: 'Open Reports on Coinbase',
        body: 'Log into coinbase.com, go to **Profile → Reports**. Coinbase calls these "Tax Statements" but they include the full trade history.',
      },
      {
        title: 'Choose Transaction History',
        body: 'Pick **Transaction History (CSV)**. This includes buys, sells, conversions, deposits, withdrawals — far more than just trades. You\'ll filter on import.',
      },
      {
        title: 'Set the year',
        body: 'Coinbase exports are per calendar year. For a partial year, take the full export and filter by date later.',
      },
      {
        title: 'Generate and download',
        body: 'Click Generate Report. Email arrives in 5–15 minutes with a link. The file is plain CSV.',
      },
      {
        title: 'Repeat for Coinbase Pro / Advanced if you used both',
        body: 'Coinbase Advanced (formerly Pro) has its own Reports page. If you traded on both sides, export both and merge — the same trade does NOT appear twice.',
      },
    ],
    apiSteps: [
      {
        title: 'Create a Read-only OAuth app or API key',
        body: 'Settings → API → New API Key. Coinbase asks which scopes — pick **wallet:transactions:read** and **wallet:accounts:read**. Or use OAuth 2.0 (more secure for production).',
      },
      {
        title: 'Use the v2 endpoints',
        body: 'List accounts: `GET /v2/accounts`. List transactions: `GET /v2/accounts/{account_id}/transactions`. Sign requests with `CB-ACCESS-KEY`, `CB-ACCESS-SIGN` (HMAC-SHA256), and `CB-ACCESS-TIMESTAMP` headers.',
      },
      {
        title: 'Use Coinbase Advanced API for derivatives',
        body: 'Advanced API has unified order/fill endpoints: `GET /api/v3/brokerage/orders/historical/fills`. Supports futures (US-only) and gives you maker/taker side, fee, and execution price per fill.',
      },
    ],
    exportColumns: [
      'Timestamp', 'Transaction Type', 'Asset', 'Quantity Transacted', 'Spot Price Currency',
      'Spot Price at Transaction', 'Subtotal', 'Total (inclusive of fees)', 'Fees', 'Notes',
    ],
    gotchas: [
      'Coinbase\'s "Transaction History" includes deposits/withdrawals/staking rewards/conversions, not just trades. Filter `Transaction Type = Buy/Sell/Convert` if you want only trades.',
      'A "Convert" (e.g., BTC → ETH) is recorded as ONE row but is effectively two trades. Some journals double-count these.',
      'Coinbase rounds prices to 2 decimals in the consumer CSV. For precise P&L use Coinbase Advanced exports or the API.',
      'Spot price is in your account currency at transaction time — useful for tax, less useful for trading P&L if you bridge currencies.',
      'Coinbase Earn rewards appear as "Reward" rows. They\'re tax-relevant but not trades.',
    ],
    faqs: [
      {
        question: 'How do I download my Coinbase trade history for taxes?',
        answer: 'Profile → Reports → Transaction History (CSV) → choose the year → Generate. The file includes buys, sells, conversions, and rewards with USD values at transaction time. The Trading Diary can filter to just buys/sells if you want a trader\'s journal view.',
      },
      {
        question: 'What\'s the difference between Coinbase and Coinbase Advanced exports?',
        answer: 'Coinbase (consumer) gives a tax-formatted CSV with consumer-grade prices. Coinbase Advanced (formerly Pro) gives an institutional-grade fill log with maker/taker, exact prices, and order IDs. If you trade actively, use Advanced.',
      },
      {
        question: 'Can I connect Coinbase to The Trading Diary via OAuth?',
        answer: 'Yes — we use Coinbase\'s OAuth 2.0 with read-only scopes. You authorize once, we sync new trades automatically, and you can revoke access from your Coinbase account at any time. No API keys to manage.',
      },
      {
        question: 'Does Coinbase show futures trades in the regular export?',
        answer: 'No — Coinbase Derivatives (US futures) lives under a separate report. Use the Advanced API to pull futures fills. The Trading Diary supports both feeds.',
      },
      {
        question: 'How do I handle Coinbase Convert in my journal?',
        answer: 'A Convert (BTC → ETH) is one transaction in Coinbase\'s books but it closes one position and opens another in trading terms. The Trading Diary splits it into a sell + buy automatically when imported.',
      },
    ],
    lastUpdated: '2026-04-24',
  },
];

/** Lookup helper. */
export const getExchangeTutorial = (slug: string) =>
  EXCHANGE_TUTORIALS.find(t => t.slug === slug);
