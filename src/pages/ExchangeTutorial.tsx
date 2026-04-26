import { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ChevronRight,
  Download,
  KeyRound,
  ListChecks,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { SEO } from '@/components/SEO';
import { getExchangeTutorial } from '@/data/exchangeTutorials';

/**
 * Programmatic SEO landing — `/exchanges/:slug/trade-history-export`
 *
 * Targets queries like "binance trade history export", "bybit trade history download",
 * "coinbase trade history" — long-tail informational with strong commercial intent
 * (people who export their history are typically about to journal it).
 *
 * Each rendered page emits Article + HowTo + FAQPage JSON-LD for rich result eligibility.
 */
export default function ExchangeTutorial() {
  const { slug } = useParams<{ slug: string }>();
  const tutorial = slug ? getExchangeTutorial(slug) : undefined;

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (!tutorial) {
    return <Navigate to="/exchanges" replace />;
  }

  const canonical = `https://www.thetradingdiary.com/exchanges/${tutorial.slug}/trade-history-export`;
  const seoTitle = `${tutorial.name} Trade History Export — Complete Guide ${tutorial.year}`;
  const seoDescription = `Export your full ${tutorial.name} trade history step-by-step. CSV download, API method, funding fees, and how to import into a trading journal. Updated ${tutorial.lastUpdated}.`;

  // Structured data: Article + HowTo + FAQPage
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: seoTitle,
    description: seoDescription,
    datePublished: tutorial.lastUpdated,
    dateModified: tutorial.lastUpdated,
    author: {
      '@type': 'Person',
      name: 'Gustavo Belfiore',
      url: 'https://www.thetradingdiary.com/author/gustavo',
      jobTitle: 'Crypto trader & founder',
    },
    publisher: {
      '@type': 'Organization',
      name: 'The Trading Diary',
      url: 'https://www.thetradingdiary.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.thetradingdiary.com/logo-512.png',
      },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    inLanguage: 'en',
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to export your ${tutorial.name} trade history`,
    description: `Step-by-step guide to download your full ${tutorial.name} trade history (CSV + API).`,
    totalTime: `PT${tutorial.readingTime}M`,
    step: tutorial.manualSteps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.title,
      text: s.body,
    })),
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: tutorial.faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.thetradingdiary.com/' },
      { '@type': 'ListItem', position: 2, name: 'Exchanges', item: 'https://www.thetradingdiary.com/exchanges' },
      { '@type': 'ListItem', position: 3, name: `${tutorial.name} Trade History Export`, item: canonical },
    ],
  };

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={canonical}
        ogImage={`https://www.thetradingdiary.com${tutorial.logo}`}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <AppLayout>
        <main id="main-content" className="container max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="text-xs text-space-400 mb-6 flex items-center gap-1.5 flex-wrap">
            <Link to="/" className="hover:text-space-200">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/exchanges" className="hover:text-space-200">Exchanges</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-space-200">{tutorial.name}</span>
          </nav>

          {/* Hero */}
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={tutorial.logo}
                alt={`${tutorial.name} logo`}
                className="h-11 w-11 rounded-ios bg-space-700 p-1.5 border border-space-500/40"
                width={44}
                height={44}
              />
              <span className="chip chip-electric">{tutorial.primaryKeyword}</span>
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-gradient-electric leading-tight">
              {tutorial.name} Trade History Export
            </h1>
            <p className="text-lg text-space-300 mt-3 max-w-2xl">{tutorial.tagline}</p>
            <div className="mt-4 flex items-center gap-4 text-xs text-space-400 flex-wrap">
              <span>By <Link to="/author/gustavo" className="text-electric hover:text-electric-bright">Gustavo Belfiore</Link></span>
              <span>·</span>
              <span>{tutorial.readingTime} min read</span>
              <span>·</span>
              <span>Updated {new Date(tutorial.lastUpdated).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </header>

          {/* Quick facts panel */}
          <section className="card-premium p-5 mb-10">
            <div className="text-xs uppercase tracking-wide text-space-400 mb-3 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-electric" />
              At a glance
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FactCell label="Native CSV" yes={tutorial.hasNativeCsv} />
              <FactCell label="Public API" yes={tutorial.hasApiAccess} />
              <FactCell label="Futures support" yes={tutorial.hasFutures} />
              <FactCell label="API passphrase" yes={tutorial.apiRequiresPassphrase} caveat={!tutorial.apiRequiresPassphrase ? 'not required' : undefined} />
            </div>
          </section>

          {/* Manual steps */}
          <section className="mb-12">
            <h2 className="font-display text-2xl md:text-3xl text-space-100 mb-6 flex items-center gap-2">
              <Download className="h-6 w-6 text-electric" />
              Method 1 — Manual CSV export
            </h2>
            <ol className="space-y-6">
              {tutorial.manualSteps.map((s, i) => (
                <li key={i} className="card-premium p-5">
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 h-8 w-8 rounded-full bg-electric/15 text-electric font-display font-bold flex items-center justify-center tabular-nums">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-space-100 mb-2">{s.title}</h3>
                      <p className="text-sm text-space-300 leading-relaxed" dangerouslySetInnerHTML={{
                        __html: s.body.replace(/\*\*(.+?)\*\*/g, '<strong class="text-space-100">$1</strong>'),
                      }} />
                      {s.screenshot && (
                        <img src={s.screenshot} alt={s.title} className="mt-3 rounded-ios border border-space-500/40" loading="lazy" />
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* API steps (if applicable) */}
          {tutorial.apiSteps && tutorial.apiSteps.length > 0 && (
            <section className="mb-12">
              <h2 className="font-display text-2xl md:text-3xl text-space-100 mb-6 flex items-center gap-2">
                <KeyRound className="h-6 w-6 text-electric" />
                Method 2 — API access
              </h2>
              <ol className="space-y-4">
                {tutorial.apiSteps.map((s, i) => (
                  <li key={i} className="card-premium p-5">
                    <h3 className="font-semibold text-space-100 mb-2">
                      <span className="text-electric mr-2 tabular-nums">{i + 1}.</span>
                      {s.title}
                    </h3>
                    <p className="text-sm text-space-300 leading-relaxed" dangerouslySetInnerHTML={{
                      __html: s.body.replace(/\*\*(.+?)\*\*/g, '<strong class="text-space-100">$1</strong>')
                                    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-space-600 rounded text-electric font-num text-xs">$1</code>'),
                    }} />
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Export columns */}
          <section className="mb-12">
            <h2 className="font-display text-xl md:text-2xl text-space-100 mb-4 flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-electric" />
              What columns the export contains
            </h2>
            <div className="card-premium p-5">
              <div className="flex flex-wrap gap-2">
                {tutorial.exportColumns.map((col) => (
                  <span key={col} className="chip">{col}</span>
                ))}
              </div>
            </div>
          </section>

          {/* Gotchas */}
          <section className="mb-12">
            <h2 className="font-display text-xl md:text-2xl text-space-100 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-apple-orange" />
              Common gotchas
            </h2>
            <ul className="space-y-3">
              {tutorial.gotchas.map((g, i) => (
                <li key={i} className="card-premium p-4 flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-apple-orange shrink-0 mt-0.5" />
                  <span className="text-sm text-space-200 leading-relaxed" dangerouslySetInnerHTML={{
                    __html: g.replace(/\*\*(.+?)\*\*/g, '<strong class="text-space-100">$1</strong>'),
                  }} />
                </li>
              ))}
            </ul>
          </section>

          {/* CTA */}
          <section className="card-premium-highlight p-6 md:p-8 mb-12 text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-gradient-electric mb-3">
              Skip the manual export
            </h2>
            <p className="text-sm md:text-base text-space-300 max-w-xl mx-auto mb-5">
              The Trading Diary connects to {tutorial.name} in one click — read-only, encrypted, auto-synced.
              Funding fees, futures, and conversions are all reconciled per position.
            </p>
            <Link to="/exchanges" className="btn-primary">
              <Sparkles className="h-4 w-4" />
              Connect {tutorial.name} now
            </Link>
            <p className="text-xs text-space-400 mt-3">
              Free Starter plan · No credit card · Disconnect anytime
            </p>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="font-display text-2xl md:text-3xl text-space-100 mb-6">
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {tutorial.faqs.map((f, i) => (
                <details key={i} className="card-premium p-5 group">
                  <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                    <span className="font-semibold text-space-100">{f.question}</span>
                    <ChevronRight className="h-4 w-4 text-space-400 shrink-0 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm text-space-300 leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Related */}
          <section className="mb-12">
            <h2 className="font-display text-xl text-space-100 mb-4">Related guides</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <Link to="/blog/best-crypto-trading-journal-2026" className="card-premium p-4 hover-lift block">
                <CheckCircle2 className="h-4 w-4 text-electric mb-2" />
                <span className="font-semibold text-space-100">Best crypto trading journal apps in 2026</span>
                <p className="text-xs text-space-400 mt-1">Honest comparison of 6 options including The Trading Diary.</p>
              </Link>
              <Link to="/blog/how-to-calculate-position-size-crypto" className="card-premium p-4 hover-lift block">
                <CheckCircle2 className="h-4 w-4 text-electric mb-2" />
                <span className="font-semibold text-space-100">How to calculate position size in crypto</span>
                <p className="text-xs text-space-400 mt-1">The formula, examples, and Kelly criterion explained.</p>
              </Link>
            </div>
          </section>

        </main>
      </AppLayout>
    </>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function FactCell({ label, yes, caveat }: { label: string; yes: boolean; caveat?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-space-400 mb-1">{label}</div>
      <div className={`flex items-center gap-1.5 text-sm font-semibold ${yes ? 'text-apple-green' : 'text-space-300'}`}>
        {yes ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{caveat || 'Yes'}</span>
          </>
        ) : (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-space-500" />
            <span>{caveat || 'No'}</span>
          </>
        )}
      </div>
    </div>
  );
}
