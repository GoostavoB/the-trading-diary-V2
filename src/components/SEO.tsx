import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  noindex?: boolean;
  /**
   * Override hreflang chain. When omitted, the chain is auto-derived from `canonical`
   * by detecting the locale prefix (/pt, /es, /ar, /vi) and emitting reciprocal
   * `<link rel="alternate" hreflang>` for every supported locale + x-default.
   *
   * Pass `false` to disable hreflang entirely (useful for noindex pages).
   * Pass an array to override completely.
   */
  hreflang?: false | Array<{ lang: string; url: string }>;
}

const SUPPORTED_LOCALES = ['en', 'pt', 'es', 'ar', 'vi'] as const;
const DOMAIN = 'https://www.thetradingdiary.com';

/**
 * Auto-derive hreflang chain from a canonical URL.
 * Examples:
 *   `/about`        → en + pt/about, es/about, ar/about, vi/about + x-default=/about
 *   `/pt/about`     → en /about, pt /pt/about, es /es/about, ... x-default=/about
 *   `/blog/x-y-z`   → en /blog/x-y-z, pt /pt/blog/x-y-z, ... x-default=/blog/x-y-z
 */
function deriveHreflangs(canonical: string): Array<{ lang: string; url: string }> {
  let url: URL;
  try {
    url = new URL(canonical);
  } catch {
    return [];
  }
  // Strip leading lang prefix if present
  const segments = url.pathname.split('/').filter(Boolean);
  const first = segments[0];
  const isLocalePrefix = first && (SUPPORTED_LOCALES as readonly string[]).includes(first);
  const rawPath = isLocalePrefix
    ? '/' + segments.slice(1).join('/')
    : url.pathname;

  // Build URL for a given locale
  const buildUrl = (lang: string) => {
    const path = lang === 'en' ? rawPath : `/${lang}${rawPath === '/' ? '' : rawPath}`;
    return `${DOMAIN}${path === '' ? '/' : path}`;
  };

  const out = SUPPORTED_LOCALES.map(lang => ({ lang, url: buildUrl(lang) }));
  // x-default points to the English version
  out.push({ lang: 'x-default', url: buildUrl('en') });
  return out;
}

export const SEO = ({
  title,
  description,
  canonical,
  keywords,
  ogImage = 'https://www.thetradingdiary.com/og-image-en.png',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  noindex = false,
  hreflang,
}: SEOProps) => {
  const siteTitle = 'The Trading Diary';
  const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;

  // Resolve hreflang chain
  const hreflangs =
    hreflang === false
      ? []
      : Array.isArray(hreflang)
        ? hreflang
        : (canonical && !noindex ? deriveHreflangs(canonical) : []);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Hreflang chain — auto-derived unless overridden */}
      {hreflangs.map(({ lang, url }) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteTitle} />
      {/* Locale hint for OG (used by Facebook for language matching) */}
      {canonical && (() => {
        const m = canonical.match(/\/(pt|es|ar|vi)(?:\/|$)/);
        const ogLocale = m ? { pt: 'pt_BR', es: 'es_ES', ar: 'ar_AR', vi: 'vi_VN' }[m[1] as 'pt'|'es'|'ar'|'vi'] : 'en_US';
        return <meta property="og:locale" content={ogLocale} />;
      })()}

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content="@thetradingdiary" />
      <meta name="twitter:creator" content="@thetradingdiary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};
