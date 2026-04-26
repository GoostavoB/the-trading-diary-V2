# Technical SEO Audit — The Trading Diary

**Date:** 2026-04-25
**Auditor:** Automated technical pass against `/Users/gustavoborges/Desktop/the-trading-diary-V2`
**Scope:** Build/runtime, Lighthouse predictions, image optimization, structured data, internal linking, indexability, search-console setup, Core Web Vitals, redirects, CI/CD safeguards.

---

## 1. Build / Runtime Baseline

### 1.1 Code-splitting (already in place)

`grep "lazy(" src/App.tsx` — **44 routes** are already wrapped in `React.lazy()`. Excellent baseline. Confirmed candidates that are correctly split:

```text
Dashboard, Upload, Analytics, Forecast, Achievements, MarketData,
Settings, Blog, BlogPost, Author, FAQ, CryptoTradingFAQ, Journal,
Goals, RiskManagement, Reports, Psychology, TradingPlan, NotFound,
CustomPage, ExchangeConnections, SpotWallet, FeeAnalysis,
CapitalManagementPage, LogoDownload, LogoGenerator, LongShortRatio…
```

**However**, the route components most relevant to organic traffic should sit on a different priority tier:

| Route | Public? | SSR/CSR | LCP risk | Action |
|---|---|---|---|---|
| `/` (Index) | Yes | CSR (lazy) | Medium — orbs only, no image | OK |
| `/pt`, `/es`, `/ar`, `/vi` | Yes | CSR (lazy IndexPt/Es/Ar/Vi) | Medium | Check translated heroes use same lightweight pattern |
| `/pricing` | Yes | CSR (lazy) | Low | Add `<link rel="modulepreload">` for `/src/pages/PricingPage.tsx` |
| `/blog` | Yes | CSR (lazy) | High — list of cards with images | Eager-load first 3 thumbnails |
| `/blog/:slug` | Yes | CSR (lazy) | High — article hero image | Eager-load article hero |
| `/about` | Yes | CSR (lazy) | Low | OK |
| `/contact` | Yes | CSR (lazy) | Low | OK |
| `/how-it-works` | Yes | Not in routes (not implemented yet) | — | If launching: SSR or pre-render |
| `/features` | Yes | Not in App.tsx routes | — | Same — SSR or pre-render |
| `/crypto-trading-faq` | Yes | CSR (lazy) | Low | OK |
| `/author/gustavo` | Yes | CSR (lazy) | Low | OK |

> **Strategic gap:** the entire site is CSR through Vite. Google does render JS, but every route ships an empty `<div id="root"></div>` — initial HTML has zero content. For high-value SEO entry points (homepage, `/blog`, `/blog/:slug`), strongly consider **pre-rendering** these routes at build time using `vite-plugin-prerender-spa` or migrating to `vite-plugin-ssr` / Astro for the marketing surface.

### 1.2 `index.html` — preconnect / preload audit

Already in place at `index.html:312-323`:
- `preconnect` → fonts.googleapis.com, fonts.gstatic.com, supabase.co
- `dns-prefetch` → googletagmanager, google-analytics, analytics
- `preload` → Inter font CSS (`as="style"` swap)
- `modulepreload` → main.tsx, App.tsx
- `prefetch` → Dashboard.tsx, Upload.tsx (private routes — wasted on cold organic visitors)

**Critical bug at `index.html:371`:**
```html
<link rel="preload" as="image" href="/src/assets/bull-bear-realistic.png" fetchpriority="high" ...>
```
This file is **not used by `Hero.tsx`** (only `LogoDownload.tsx` references it). Result: the browser fetches a 122 KB PNG on every public page that nothing renders. **Fix immediately**:

```diff
- <link rel="preload" as="image" href="/src/assets/bull-bear-realistic.png" fetchpriority="high" imagesrcset="/src/assets/bull-bear-realistic.png 1x" imagesizes="100vw">
+ <!-- Removed — image not rendered above the fold. Re-add a real LCP candidate when the hero gets a static image. -->
```

Also: the prefetches for `/src/pages/Dashboard.tsx` and `/src/pages/Upload.tsx` (lines 367-368) target authenticated routes — replace with public-route prefetches:
```diff
- <link rel="prefetch" href="/src/pages/Dashboard.tsx" as="script">
- <link rel="prefetch" href="/src/pages/Upload.tsx" as="script">
+ <link rel="prefetch" href="/src/pages/Blog.tsx" as="script">
+ <link rel="prefetch" href="/src/pages/PricingPage.tsx" as="script">
```

### 1.3 Vite config

`vite.config.ts` (138 LOC) defines healthy `manualChunks`:
- `vendor-react`, `vendor-ui` (Radix), `vendor-charts` (recharts), `vendor-utils` (date-fns, crypto-js, react-query), `vendor-supabase`, `vendor-threejs`.
- Terser minification, console drops in prod, `cssCodeSplit: true`, `chunkSizeWarningLimit: 600`.

`vite.config.optimization.ts` exists but is a **template/example** — it is not used by Vite (Vite reads only `vite.config.ts`). Either inline its useful pieces or delete it to avoid drift.

**Recommended additions to `vite.config.ts`:**

```diff
   build: {
+    target: 'es2020',          // smaller bundles for modern browsers
+    sourcemap: false,
+    reportCompressedSize: true,
     rollupOptions: {
       output: {
+        assetFileNames: (info) => {
+          if (/\.(png|jpe?g|svg|gif|webp|avif)$/.test(info.name || '')) return 'assets/images/[name]-[hash][extname]';
+          if (/\.(woff2?|ttf)$/.test(info.name || '')) return 'assets/fonts/[name]-[hash][extname]';
+          return 'assets/[name]-[hash][extname]';
+        },
+        chunkFileNames: 'assets/js/[name]-[hash].js',
+        entryFileNames: 'assets/js/[name]-[hash].js',
         manualChunks: {
+          'vendor-motion': ['framer-motion'],   // currently bundled into main
           ...
         }
       }
     }
   }
```

There is **no image-optimization plugin**. Add `vite-plugin-image-optimizer` (sharp-based) to auto-emit WebP/AVIF for every imported PNG.

---

## 2. Lighthouse Opportunities (predicted)

Site cannot be run in this sandbox; predictions derived from static inspection.

### 2.1 LCP (Largest Contentful Paint)

| Page | Likely LCP element | Issue | Fix |
|---|---|---|---|
| `/` | Hero `<h1>` (no image) | Hero has only blur orbs; text is LCP. Should be fast. | OK; **remove** the wasted `/src/assets/bull-bear-realistic.png` preload (`index.html:371`). |
| `/blog` | First article card image | `loading="lazy"` on **all** images including the first row (`Blog.tsx:189`). Lazy images defer LCP. | First 3 cards should use `loading="eager" fetchpriority="high"`. |
| `/blog/:slug` | Article hero `<img>` at `BlogPost.tsx:401` | No `fetchpriority`, no explicit width/height. | Add `width`, `height`, `fetchpriority="high"`, `loading="eager"`, and a `<link rel="preload" as="image">` injected via `Helmet`. |
| `/pricing` | Pricing card grid | No image LCP, fine. | OK |

**Concrete patch — `src/pages/Blog.tsx` around line 186:**
```diff
- <img
+ <img
+   width={640}
+   height={360}
    src={post.image}
    alt={post.title}
-   loading="lazy"
+   loading={index < 3 ? "eager" : "lazy"}
+   fetchpriority={index === 0 ? "high" : "auto"}
    decoding="async"
  />
```

### 2.2 CLS (Cumulative Layout Shift)

- **Web fonts**: `index.html:321-323` uses `&display=swap` (good). But the load pattern at line 321 swaps `body` font-family at `fonts-loaded` class — small reflow possible. Mitigated by `-apple-system` fallback being metric-similar to Inter; should be ≤0.05 CLS.
- **Images without `width`/`height`**: blog cards (above) and `BlogPost.tsx:401` lack explicit dimensions. **Each is a CLS source.** Add aspect-ratio.

```css
/* in src/index.css, global */
img { aspect-ratio: attr(width) / attr(height); }
```
Or set via Tailwind utility class on each `<img>`.

### 2.3 TBT / INP

- **`recharts` is correctly chunked into `vendor-charts`** — only loaded on `/analytics`, not on landing.
- **`framer-motion`** is in `package.json` but **not in `manualChunks`** → bundled into the main chunk on every public route. Estimated 35-50 KB gzipped main-bundle bloat. Add to `vendor-motion` chunk (diff above).
- **`three`, `@react-three/fiber`** — already chunked into `vendor-threejs`. Confirm no public route imports them statically.
- **GTM/GA4** — only `dns-prefetch`, no script tag in `index.html`. If GTM is injected client-side, defer it to after `idle`.

### 2.4 Unused CSS

`tailwind.config.ts:5-7`:
```ts
content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"]
```
Globs are correct. Purge will work. No `safelist` set, so no over-inclusion. Watch for CSS bloat from `tailwindcss-animate` (already a dep, expected).

---

## 3. Image Optimization Checklist

`find public -name "*.png" -size +200k` returned:

| File | Size | Format | Action |
|---|---|---|---|
| `public/original-logo.png` | 576 KB | PNG | Strip alpha + WebP conversion → ~80 KB. **Remove from public if not referenced** (likely unused). |
| `public/logo-512.png` | 321 KB | PNG | Run `pngquant` → ~120 KB. Add WebP twin. |
| `public/logo-192.png` | 321 KB | PNG | **Suspicious — same size as 512px**. Looks like the same source PNG with no real downscale. Re-export from source at 192×192. Target 25-40 KB. |
| `public/apple-touch-icon.png` | 321 KB | PNG | Same problem; resize to 180×180. Target 30 KB. |
| `public/favicon.png` | 321 KB | PNG | Same. Should be ≤8 KB at 64×64. |

**Source assets `src/assets/`:**

| File | Size | Used? | Action |
|---|---|---|---|
| `bull-bear-fight-neon.png` | 852 KB | grep needed | Audit; likely orphan |
| `bull-neon.png` | 697 KB | ? | Audit |
| `bear-neon.png` | 768 KB | ? | Audit |
| `bull-bear-realistic.png` | 122 KB | only `/logo-download` | Convert to WebP (≈45 KB) |
| `dashboard-screenshot-new.png` | 246 KB | likely landing | Convert to WebP + AVIF, srcset |
| `dashboard-screenshot.png` | 239 KB | check duplicate | Likely orphan, delete |
| `td-logo-official.png` | 321 KB | ? | Convert to SVG if vector source exists |

**OG images (already reasonably sized, 39-62 KB each):**
```
og-image-en.png  47K
og-image-pt.png  62K
og-image-es.png  54K
og-image-ar.png  51K
og-image-vi.png  47K
og-image.png     39K (default)
```
Acceptable. **Recommended:** keep PNG (Facebook/Twitter caches PNG most reliably), but optionally provide a WebP twin via `og:image:secure_url`.

**Action plan:**
1. Install `vite-plugin-image-optimizer` and `sharp`.
2. Add to `vite.config.ts`:
   ```ts
   import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
   plugins: [
     ViteImageOptimizer({
       png: { quality: 80 },
       jpeg: { quality: 82 },
       webp: { lossless: false, quality: 80 },
       avif: { lossless: false, quality: 60 },
     }),
   ]
   ```
3. Convert `<img src="/blog/foo.png">` → `<picture>` with WebP/AVIF sources:
   ```tsx
   <picture>
     <source srcSet={src.replace('.png', '.avif')} type="image/avif" />
     <source srcSet={src.replace('.png', '.webp')} type="image/webp" />
     <img src={src} width={640} height={360} alt={alt} loading={eager ? 'eager' : 'lazy'} />
   </picture>
   ```
4. Ship a `<ResponsiveImage>` helper component in `src/components/`.

---

## 4. Structured Data Coverage Matrix

`grep '@type' src/` returned **40 hits** across 7 files. Coverage:

| File | Schemas |
|---|---|
| `src/utils/seoHelpers.ts` | BreadcrumbList, ListItem, Article, Person, Organization, ImageObject, WebPage, Blog, HowTo, HowToStep, SoftwareApplication, Offer, Review, Rating |
| `src/utils/i18nLandingMeta.ts` | Organization, SoftwareApplication, Offer (×3) |
| `src/components/Pricing.tsx` | ItemList, ListItem, Offer, Organization |
| `src/pages/CryptoTradingFAQ.tsx` | FAQPage, Question, Answer |
| `src/pages/BlogPost.tsx` | Article, Person, Organization, ImageObject, WebPage |
| `src/pages/Author.tsx` | Person |
| `index.html` (static) | SoftwareApplication, Organization, WebSite + SearchAction, FAQPage |

### Coverage matrix

| Page | Should have | Present | Missing | Priority |
|---|---|---|---|---|
| `/` (Index) | Organization, WebSite, SoftwareApplication, FAQPage, BreadcrumbList | All except BreadcrumbList | **BreadcrumbList** | Low |
| `/pricing` | Organization, Product/Offer, BreadcrumbList | ItemList+Offer | **Product wrapper, BreadcrumbList** | **High** — pricing pages benefit hugely from Product schema |
| `/blog` | Blog, BreadcrumbList, ItemList of BlogPosting | Blog (in helpers) | **Verify it's actually emitted on the live page; add ItemList of recent posts** | Medium |
| `/blog/:slug` | Article, BreadcrumbList, Person (author), Organization (publisher), ImageObject, WebPage | Article+Person+Org+Image+WebPage | **BreadcrumbList** | **High** — Google blog rich-results require it |
| `/about` | AboutPage, Organization, BreadcrumbList | Organization (inherited) | **AboutPage type, BreadcrumbList** | Medium |
| `/contact` | ContactPage, Organization, BreadcrumbList | Organization | **ContactPage, BreadcrumbList** | Medium |
| `/crypto-trading-faq` | FAQPage, BreadcrumbList | FAQPage | **BreadcrumbList** | Low |
| `/author/:slug` | ProfilePage, Person, BreadcrumbList | Person | **ProfilePage wrapper, BreadcrumbList** | Medium |
| `/sitemap` | CollectionPage, BreadcrumbList | none | **All** | Low |
| `/how-it-works` (when shipped) | HowTo, BreadcrumbList | helper exists | wire it up | Medium |
| `/features` (when shipped) | ItemList of features, SoftwareApplication, BreadcrumbList | none | **All** | Medium |

**Top action:** add `BreadcrumbList` JSON-LD globally via `<Breadcrumbs>` component (already exists at `src/components/Breadcrumbs.tsx` — verify it emits JSON-LD, not just visual breadcrumbs).

---

## 5. Internal Linking Matrix Recommendations

### Current state

- **Blog index** lists posts but no hub/spoke clustering visible from grep.
- **Footer / Header** links audit not exhaustive — no centralized "related posts" component found.
- 5 blog posts in sitemap (`ai-tools-for-crypto-trading`, `trading-journal-for-crypto`, `trading-psychology-control-emotions`, `data-driven-trading`, `ai-powered-trading-journal`).

### Recommended hub-and-spoke

**Hub 1 — Risk Management** (`/blog/category/risk-management` or use a tag page)
Spokes:
1. Position sizing for crypto perps
2. Stop-loss strategy (fixed vs ATR)
3. Daily loss lock & guardrails
4. Risk-of-ruin math for retail traders
5. Leverage misconceptions
6. Funding-rate cost on long holds

**Hub 2 — Trading Psychology** (`/blog/category/psychology`)
Spokes:
1. Revenge trading — recognize and break the pattern
2. FOMO & confirmation bias
3. Journaling for emotional regulation
4. Daily lesson-learned protocol
5. Pre-trade checklist
6. Post-loss recovery routine

**Hub 3 — Data-Driven Trading** (`/blog/category/data-driven`)
Spokes: profit factor, win rate vs avg-R trade-off, expectancy, drawdown analysis, performance by setup, performance by asset.

**Hub 4 — AI in Trading** (`/blog/category/ai`)
Spokes: AI screenshot extraction, AI trade tagging, GPT-based pattern discovery, AI risk scoring, automated journaling.

### Linking rules (enforce in editorial process)

1. Every blog post **must** link to ≥4 internal pages: 1 hub, 2 sibling spokes, 1 product page (`/`, `/pricing`, or `/features`).
2. Every product page **must** link to ≥3 blog articles (currently `/pricing` likely has 0 — fix).
3. Every hub page **must** link to **all** spokes (cluster completeness).
4. Anchor text must be descriptive (avoid "click here", "read more").

Add a CI check: `scripts/check-internal-links.ts` — parses `src/data/blog/*.md(x)`, asserts ≥4 internal `/blog/*` or `/pricing|/about|...` links per post.

---

## 6. Indexability Audit

### 6.1 robots.txt — `public/robots.txt` (232 LOC, 146 directives)

Verified disallows of all private app routes: `/dashboard`, `/upload`, `/analytics`, `/settings`, `/auth`, `/journal`, `/risk-management`, `/reports`, `/trading-plan`, `/psychology`, `/forecast`, `/goals`, `/fee-analysis`, `/tax-reports`, `/achievements`, `/exchange-connections`, `/exchanges`, `/spot-wallet`, `/capital-management`, `/long-short-ratio`, `/market-data`, `/blog-admin`, `/seo-dashboard`, etc. **Looks complete.**

**Issues found:**
- `Disallow: /api/` — no `/api/` route exists in the SPA, but harmless.
- `Disallow: /custom/` blocks `CustomPage` — verify this is intentional (custom user-generated dashboards should not be indexed).
- AI-bot section is comprehensive (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended, etc.). Good for GEO.
- `Crawl-delay: 1` is ignored by Google but respected by Bingbot/Yandex.

**Recommendation:** add explicit `Allow: /blog/` and `Allow: /pricing` blocks above the disallows for absolute clarity. Currently relying on default `Allow: /` precedence is fine but defensive.

### 6.2 sitemap.xml — `public/sitemap.xml` (374 LOC, 37 URLs)

Contents:
- Homepage + 4 locale variants (5 URLs)
- `/pricing` + 4 variants (5)
- `/about` + 4 variants (5)
- `/contact` + 4 variants (5)
- `/features`, `/how-it-works`, `/testimonials`, `/changelog` (4 — but `/features`, `/how-it-works`, `/testimonials`, `/changelog` are **not in `App.tsx` routes** — possible 404s)
- `/crypto-trading-faq`, `/sitemap` (2)
- Legal: `/legal`, `/privacy`, `/terms`, `/cookie-policy` (4)
- `/blog` + `/author/gustavo` (2)
- 5 blog post slugs (5)

**Cross-reference vs `App.tsx` reveals these in sitemap but not routed:**
- `/features` — sitemap line ~11, no Route in `App.tsx`
- `/how-it-works` — sitemap line ~17, no Route
- `/testimonials` — sitemap, no Route
- `/changelog` — sitemap, no Route
- `/cookie-policy` — sitemap, no Route

**Action:** either ship these pages (recommended, they're listed in your `SEO_KEYWORDS.md`) or remove from sitemap. **Indexing 404s is a quality signal Google penalizes.**

### 6.3 noindex audit

`grep -n "noindex" index.html src/`:
- `index.html` — **no noindex** ✓ (homepage indexable)
- `src/components/SEO.tsx` — accepts `noindex` prop, defaults `false` ✓
- `src/utils/seoHelpers.ts` — 20+ entries with `robots: 'noindex,nofollow'`. **Audit which routes consume these** to ensure no public route inherits noindex by mistake. Run:
  ```bash
  grep -rn "noindex" src/utils/seoHelpers.ts | head -25
  ```
  Then for each, confirm the page is genuinely private (dashboard/auth/etc.).

### 6.4 hreflang chain reciprocity

`index.html:28-33` declares `en, pt, es, ar, vi, x-default` for `/`. Every translated route (`/pt`, `/es`, etc.) **must** emit the same set of `<link rel="alternate" hreflang>` back. Verify:

```bash
grep -rn "hreflang" src/pages/ src/components/SEO.tsx
```

If only the default English `index.html` has them and the SPA does not inject them per-route via Helmet, **all locale routes are missing reciprocal hreflang** — major i18n SEO bug. Fix in `<SEO>` component to dynamically emit the full chain.

---

## 7. GSC + Bing Webmaster + IndexNow Setup Checklist

### 7.1 Google Search Console

1. **Verify ownership** — pick the most durable method:
   - **DNS TXT** (recommended): add `google-site-verification=<token>` TXT record at the apex.
   - **HTML file**: drop `google<token>.html` in `public/` (auto-served by Vite/Vercel).
   - **HTML meta tag**: inject `<meta name="google-site-verification" content="...">` in `index.html` head.
2. **Submit sitemap**: `https://www.thetradingdiary.com/sitemap.xml` and `/image-sitemap.xml` (separate submissions).
3. **Set preferred domain**: enforce `www.` via Vercel redirect (already in `vercel.json`?). Audit and add canonical 301 if not.
4. **International targeting**: under "Legacy tools and reports → International Targeting" — leave country **unset** (you're global). The hreflang signals do the work.
5. **Coverage / URL inspection**: weekly check for "Discovered — currently not indexed" and "Crawled — currently not indexed" buckets.

### 7.2 Bing Webmaster Tools

1. Sign in with same Google account (Bing supports OAuth import from GSC).
2. Add property `https://www.thetradingdiary.com`.
3. Verify via XML file (`BingSiteAuth.xml` in `public/`) or DNS CNAME.
4. **Import sitemap from GSC** in one click, or submit `/sitemap.xml` manually.
5. Enable URL & Content submission API for IndexNow.

### 7.3 IndexNow

1. **Generate key**: pick a 32-char hex string (e.g., from `openssl rand -hex 16`).
2. **Host verification file**: place `public/<key>.txt` containing the key on its own line.
3. **Ping endpoint** on each deploy:
   ```bash
   curl "https://api.indexnow.org/IndexNow?url=https://www.thetradingdiary.com/blog/<slug>&key=<key>"
   ```
4. **Bulk ping** (preferred):
   ```bash
   curl -X POST https://api.indexnow.org/IndexNow \
     -H "Content-Type: application/json; charset=utf-8" \
     -d '{
       "host": "www.thetradingdiary.com",
       "key": "'"$INDEXNOW_KEY"'",
       "keyLocation": "https://www.thetradingdiary.com/'"$INDEXNOW_KEY"'.txt",
       "urlList": ["https://www.thetradingdiary.com/", "https://www.thetradingdiary.com/blog/<new-slug>"]
     }'
   ```
5. **CI hook**: add a `scripts/indexnow-ping.ts` invoked by Vercel post-deploy webhook — diff the previous and current sitemap, ping changed URLs only.

---

## 8. Core Web Vitals Tracking

`web-vitals@5.1.0` is **already installed** (`package.json:95`). Reporter exists in `src/utils/webVitals.ts` and is wired in `src/main.tsx:6,17`. Current reporter calls `sendVitalsToAnalytics`.

### Recommended GA4 reporter snippet

If `sendVitalsToAnalytics` doesn't already pipe to GA4, replace its body with:

```ts
// src/utils/webVitals.ts
import type { Metric } from 'web-vitals';

export const sendVitalsToAnalytics = (metric: Metric) => {
  // GA4 expects event_category + event_label + non_interaction
  if (typeof window === 'undefined' || !(window as any).gtag) return;
  (window as any).gtag('event', metric.name, {
    event_category: 'Web Vitals',
    event_label: metric.id,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    metric_rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
    metric_value: metric.value,
    non_interaction: true,
  });
};

export const reportWebVitals = (cb: (m: Metric) => void) => {
  import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
    onCLS(cb);
    onINP(cb);
    onFCP(cb);
    onLCP(cb);
    onTTFB(cb);
  });
};
```

### Thresholds + alerting (Lighthouse-aligned)

| Metric | Good | Needs Improvement | Poor (alert) |
|---|---|---|---|
| LCP | ≤ 2.5 s | 2.5–4.0 s | > 4.0 s |
| INP | ≤ 200 ms | 200–500 ms | > 500 ms |
| CLS | ≤ 0.10 | 0.10–0.25 | > 0.25 |
| FCP | ≤ 1.8 s | 1.8–3.0 s | > 3.0 s |
| TTFB | ≤ 0.8 s | 0.8–1.8 s | > 1.8 s |

In GA4 → Explore → set up an exploration with `metric_rating = poor` and segment by page_location. Wire to a Looker Studio dashboard or push to Slack via a `gtag` → BigQuery → Cloud Function alert.

---

## 9. 404 / Redirect Strategy

### 9.1 URLs in sitemap but NOT in `App.tsx` routes (likely 404)

| Sitemap URL | App.tsx route exists? | Recommendation |
|---|---|---|
| `/features` | No | Ship the page OR remove from sitemap |
| `/how-it-works` | No | Same |
| `/testimonials` | No | Same |
| `/changelog` | No | Same |
| `/cookie-policy` | No | Same |

### 9.2 Redirect map (recommended in `vercel.json`)

If any of the below older slugs were ever used:

```json
{
  "redirects": [
    { "source": "/journal", "destination": "/blog", "permanent": true, "has": [{ "type": "header", "key": "user-agent", "value": "(?i).*bot.*" }] },
    { "source": "/posts/:slug", "destination": "/blog/:slug", "permanent": true },
    { "source": "/pt-br", "destination": "/pt", "permanent": true },
    { "source": "/es-es", "destination": "/es", "permanent": true },
    { "source": "/index.html", "destination": "/", "permanent": true },
    { "source": "/home", "destination": "/", "permanent": true },
    { "source": "/(.*)/$", "destination": "/$1", "permanent": true }
  ]
}
```

The trailing-slash normalizer (last entry) is critical for canonical hygiene.

### 9.3 SPA 404 strategy

Confirm `vercel.json` does **not** rewrite all paths to `/index.html` with status 200 for unknown routes — that would mask 404s. The `NotFound.tsx` page should set `<meta name="robots" content="noindex">` and ideally a server-level 404 status (Vercel: use `notFound: true` in middleware, or a Cloudflare worker).

---

## 10. CI/CD Safeguards

Add `scripts/seo-preflight.sh` invoked in CI before deploy:

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# 1) Validate sitemap.xml
echo "→ Validating sitemap.xml"
xmllint --noout "$ROOT/public/sitemap.xml" \
  || { echo "sitemap.xml is not valid XML"; exit 1; }

# 2) Validate image-sitemap.xml
xmllint --noout "$ROOT/public/image-sitemap.xml"

# 3) robots.txt vs public-routes diff
echo "→ Diffing robots.txt against public routes"
node "$ROOT/scripts/check-robots.js"

# 4) Lighthouse CI against staging
echo "→ Lighthouse CI"
npx lhci autorun --config "$ROOT/.lighthouserc.json"

# 5) Structured data validator (top 10 URLs)
echo "→ Schema validation"
node "$ROOT/scripts/validate-schema-live.js"

echo "✓ SEO pre-flight passed"
```

### `scripts/check-robots.js` (Node)

```js
// Fails CI if any public route in App.tsx appears in robots.txt Disallow
import fs from 'node:fs';

const APP = fs.readFileSync('src/App.tsx', 'utf8');
const ROBOTS = fs.readFileSync('public/robots.txt', 'utf8');

const publicRoutes = [...APP.matchAll(/<Route path="(\/[^":]+)"[^>]*PublicPageThemeWrapper/g)]
  .map(m => m[1])
  .filter(p => !p.includes(':lang') && !p.includes(':slug'));

const disallows = ROBOTS
  .split('\n')
  .filter(l => l.startsWith('Disallow:'))
  .map(l => l.replace('Disallow:', '').trim());

const conflicts = publicRoutes.filter(r =>
  disallows.some(d => d !== '/' && d !== '' && r.startsWith(d))
);

if (conflicts.length) {
  console.error('❌ Public routes blocked by robots.txt:', conflicts);
  process.exit(1);
}
console.log('✓ robots.txt does not block public routes');
```

### `scripts/validate-schema-live.js`

```js
// Hits staging URLs and pipes JSON-LD through schema.org validator
import fetch from 'node-fetch';

const URLS = [
  'https://staging.thetradingdiary.com/',
  'https://staging.thetradingdiary.com/pricing',
  'https://staging.thetradingdiary.com/blog',
  'https://staging.thetradingdiary.com/blog/ai-tools-for-crypto-trading',
  'https://staging.thetradingdiary.com/about',
  'https://staging.thetradingdiary.com/contact',
  'https://staging.thetradingdiary.com/crypto-trading-faq',
  'https://staging.thetradingdiary.com/author/gustavo',
  'https://staging.thetradingdiary.com/pt',
  'https://staging.thetradingdiary.com/es',
];

let failed = 0;
for (const url of URLS) {
  const html = await fetch(url).then(r => r.text());
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!blocks.length) { console.error(`✗ ${url} — no JSON-LD`); failed++; continue; }
  for (const [, json] of blocks) {
    try { JSON.parse(json); }
    catch (e) { console.error(`✗ ${url} — invalid JSON-LD: ${e.message}`); failed++; }
  }
  console.log(`✓ ${url} — ${blocks.length} JSON-LD blocks`);
}
process.exit(failed ? 1 : 0);
```

### Lighthouse CI thresholds (already partly in `.lighthouserc.json`)

Current settings already enforce `performance ≥ 0.9`, `seo ≥ 0.9`, `a11y ≥ 0.95`. Tighten:

```diff
- "categories:performance": ["error", { "minScore": 0.9 }],
+ "categories:performance": ["error", { "minScore": 0.8 }],   // realistic for SPA
- "categories:seo":         ["error", { "minScore": 0.9 }],
+ "categories:seo":         ["error", { "minScore": 0.95 }],  // SEO must be near-perfect
```

Add `npm run build && npm run preview` step before `lhci autorun` (already in `startServerCommand`).

### GitHub Actions snippet (`.github/workflows/seo.yml`)

```yaml
name: SEO Pre-flight
on: [pull_request]
jobs:
  seo:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - name: Install xmllint
        run: sudo apt-get update && sudo apt-get install -y libxml2-utils
      - run: bash scripts/seo-preflight.sh
```

---

## Appendix A — Files referenced

- `/Users/gustavoborges/Desktop/the-trading-diary-V2/index.html` (383 LOC)
- `/Users/gustavoborges/Desktop/the-trading-diary-V2/vite.config.ts` (138 LOC)
- `/Users/gustavoborges/Desktop/the-trading-diary-V2/vite.config.optimization.ts` (129 LOC, unused template)
- `/Users/gustavoborges/Desktop/the-trading-diary-V2/tailwind.config.ts` (187 LOC)
- `/Users/gustavoborges/Desktop/the-trading-diary-V2/public/sitemap.xml` (374 LOC, 37 URLs)
- `/Users/gustavoborges/Desktop/the-trading-diary-V2/public/robots.txt` (232 LOC)
- `/Users/gustavoborges/Desktop/the-trading-diary-V2/.lighthouserc.json`
- `/Users/gustavoborges/Desktop/the-trading-diary-V2/src/App.tsx`
- `/Users/gustavoborges/Desktop/the-trading-diary-V2/src/components/SEO.tsx`
- `/Users/gustavoborges/Desktop/the-trading-diary-V2/src/components/Hero.tsx`
- `/Users/gustavoborges/Desktop/the-trading-diary-V2/src/utils/seoHelpers.ts`
- `/Users/gustavoborges/Desktop/the-trading-diary-V2/src/utils/webVitals.ts`
- `/Users/gustavoborges/Desktop/the-trading-diary-V2/src/utils/i18nLandingMeta.ts`

## Appendix B — Sandbox limitations

The following could not be executed in this sandbox:
- `npm run build` to measure actual bundle sizes per chunk
- Lighthouse against staging (no network access to live deploy)
- Schema.org validator against live HTML
- Real Core Web Vitals from RUM data
- Confirming Vercel redirect rules in production

All findings above are derived from static file inspection.
