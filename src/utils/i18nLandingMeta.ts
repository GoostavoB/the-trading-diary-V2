export interface LandingMeta {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  lang: string;
  alternates: { lang: string; url: string }[];
}

export const landingMeta: Record<string, LandingMeta> = {
  en: {
    title: 'The #1 Crypto Trading Journal | Track & Analyze Every Trade',
    description: 'Track, analyze, and review every crypto trade with AI. Advanced analytics, automated insights, and performance tracking for serious traders.',
    keywords: 'crypto trading journal, cryptocurrency trading, crypto trade tracker, bitcoin trading journal, crypto analytics, trading performance',
    canonical: 'https://www.thetradingdiary.com/',
    ogTitle: 'The #1 Crypto Trading Journal',
    ogDescription: 'Track, analyze, and review every crypto trade with AI. Built for serious traders.',
    ogImage: 'https://www.thetradingdiary.com/og-image-en.png',
    lang: 'en',
    alternates: [
      { lang: 'en', url: 'https://www.thetradingdiary.com/' },
      { lang: 'pt', url: 'https://www.thetradingdiary.com/pt' },
      { lang: 'es', url: 'https://www.thetradingdiary.com/es' },
      { lang: 'ar', url: 'https://www.thetradingdiary.com/ar' },
      { lang: 'vi', url: 'https://www.thetradingdiary.com/vi' },
      { lang: 'x-default', url: 'https://www.thetradingdiary.com/' },
    ],
  },
  pt: {
    title: 'Diário de Trading #1 para Cripto | Analise Cada Trade com IA',
    description: 'Rastreie, analise e revise cada trade de cripto com IA. Análises avançadas, insights automatizados e acompanhamento de desempenho para traders sérios.',
    keywords: 'diário de trading, trading cripto, análise bitcoin, rastreador de trades, análise de criptomoedas, performance trading',
    canonical: 'https://www.thetradingdiary.com/pt',
    ogTitle: 'Diário de Trading #1 para Cripto',
    ogDescription: 'Rastreie, analise e revise cada trade de cripto com IA. Feito para traders sérios.',
    ogImage: 'https://www.thetradingdiary.com/og-image-pt.png',
    lang: 'pt-BR',
    alternates: [
      { lang: 'en', url: 'https://www.thetradingdiary.com/' },
      { lang: 'pt', url: 'https://www.thetradingdiary.com/pt' },
      { lang: 'es', url: 'https://www.thetradingdiary.com/es' },
      { lang: 'ar', url: 'https://www.thetradingdiary.com/ar' },
      { lang: 'vi', url: 'https://www.thetradingdiary.com/vi' },
      { lang: 'x-default', url: 'https://www.thetradingdiary.com/' },
    ],
  },
  es: {
    title: 'Diario de Trading #1 para Cripto | Analiza Cada Trade con IA',
    description: 'Rastrea, analiza y revisa cada trade de cripto con IA. Análisis avanzados, insights automatizados y seguimiento de rendimiento para traders serios.',
    keywords: 'diario trading, trading crypto, análisis bitcoin, rastreador trades, análisis criptomonedas, rendimiento trading',
    canonical: 'https://www.thetradingdiary.com/es',
    ogTitle: 'Diario de Trading #1 para Cripto',
    ogDescription: 'Rastrea, analiza y revisa cada trade de cripto con IA. Hecho para traders serios.',
    ogImage: 'https://www.thetradingdiary.com/og-image-es.png',
    lang: 'es',
    alternates: [
      { lang: 'en', url: 'https://www.thetradingdiary.com/' },
      { lang: 'pt', url: 'https://www.thetradingdiary.com/pt' },
      { lang: 'es', url: 'https://www.thetradingdiary.com/es' },
      { lang: 'ar', url: 'https://www.thetradingdiary.com/ar' },
      { lang: 'vi', url: 'https://www.thetradingdiary.com/vi' },
      { lang: 'x-default', url: 'https://www.thetradingdiary.com/' },
    ],
  },
  ar: {
    title: 'أفضل مجلة تداول للعملات الرقمية | تتبع وتحليل كل صفقة بالذكاء الاصطناعي',
    description: 'تتبع وتحليل ومراجعة كل صفقة عملات رقمية باستخدام الذكاء الاصطناعي. تحليلات متقدمة ورؤى تلقائية وتتبع الأداء للمتداولين الجادين.',
    keywords: 'مجلة تداول, تداول عملات رقمية, تحليل بيتكوين, متتبع صفقات, تحليل عملات مشفرة, أداء التداول',
    canonical: 'https://www.thetradingdiary.com/ar',
    ogTitle: 'أفضل مجلة تداول للعملات الرقمية',
    ogDescription: 'تتبع وتحليل ومراجعة كل صفقة عملات رقمية بالذكاء الاصطناعي. مصمم للمتداولين الجادين.',
    ogImage: 'https://www.thetradingdiary.com/og-image-ar.png',
    lang: 'ar',
    alternates: [
      { lang: 'en', url: 'https://www.thetradingdiary.com/' },
      { lang: 'pt', url: 'https://www.thetradingdiary.com/pt' },
      { lang: 'es', url: 'https://www.thetradingdiary.com/es' },
      { lang: 'ar', url: 'https://www.thetradingdiary.com/ar' },
      { lang: 'vi', url: 'https://www.thetradingdiary.com/vi' },
      { lang: 'x-default', url: 'https://www.thetradingdiary.com/' },
    ],
  },
  vi: {
    title: 'Nhật Ký Trading Crypto #1 | Theo Dõi & Phân Tích Mọi Giao Dịch với AI',
    description: 'Theo dõi, phân tích và xem xét mọi giao dịch crypto với AI. Phân tích nâng cao, insights tự động và theo dõi hiệu suất cho các trader chuyên nghiệp.',
    keywords: 'nhật ký trading, trading crypto, phân tích bitcoin, theo dõi giao dịch, phân tích tiền mã hóa, hiệu suất trading',
    canonical: 'https://www.thetradingdiary.com/vi',
    ogTitle: 'Nhật Ký Trading Crypto #1',
    ogDescription: 'Theo dõi, phân tích và xem xét mọi giao dịch crypto với AI. Được tạo cho trader chuyên nghiệp.',
    ogImage: 'https://www.thetradingdiary.com/og-image-vi.png',
    lang: 'vi',
    alternates: [
      { lang: 'en', url: 'https://www.thetradingdiary.com/' },
      { lang: 'pt', url: 'https://www.thetradingdiary.com/pt' },
      { lang: 'es', url: 'https://www.thetradingdiary.com/es' },
      { lang: 'ar', url: 'https://www.thetradingdiary.com/ar' },
      { lang: 'vi', url: 'https://www.thetradingdiary.com/vi' },
      { lang: 'x-default', url: 'https://www.thetradingdiary.com/' },
    ],
  },
};

export const updateLandingMeta = (langCode: string) => {
  const meta = landingMeta[langCode];
  if (!meta) return;

  // Update document title
  document.title = meta.title;

  // Update or create meta tags
  const updateMetaTag = (name: string, content: string, isProperty = false) => {
    const attr = isProperty ? 'property' : 'name';
    let element = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
    
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attr, name);
      document.head.appendChild(element);
    }
    element.content = content;
  };

  // Update basic meta tags
  updateMetaTag('description', meta.description);
  updateMetaTag('keywords', meta.keywords);

  // Update Open Graph tags
  updateMetaTag('og:title', meta.ogTitle, true);
  updateMetaTag('og:description', meta.ogDescription, true);
  updateMetaTag('og:url', meta.canonical, true);
  updateMetaTag('og:type', 'website', true);
  updateMetaTag('og:image', meta.ogImage, true);

  // Update Twitter Card tags
  updateMetaTag('twitter:card', 'summary_large_image');
  updateMetaTag('twitter:title', meta.ogTitle);
  updateMetaTag('twitter:description', meta.ogDescription);
  updateMetaTag('twitter:image', meta.ogImage);

  // Update canonical link
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = meta.canonical;

  // Update html lang attribute
  document.documentElement.lang = meta.lang;

  // Add hreflang alternates
  // Remove existing hreflang links
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
  
  // Add new hreflang links
  meta.alternates.forEach(({ lang, url }) => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = lang;
    link.href = url;
    document.head.appendChild(link);
  });
};

export const addStructuredData = (langCode: string) => {
  const meta = landingMeta[langCode];
  if (!meta) return;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "The Trading Diary",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": langCode === 'pt' ? 'BRL' : langCode === 'ar' ? 'AED' : langCode === 'vi' ? 'VND' : 'USD'
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "2500"
    },
    "inLanguage": meta.lang
  };

  // Remove existing structured data
  document.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());

  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
};

export const trackLandingView = (langCode: string) => {
  // Track with dataLayer for GTM
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: 'landing_view',
      language: langCode,
      page: langCode === 'en' ? '/' : `/${langCode}`,
    });
  }

  // Track with Facebook Pixel
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'ViewContent', {
      content_name: `Landing Page ${langCode.toUpperCase()}`,
      content_category: 'Landing',
      language: langCode,
    });
  }
};

export const trackCTAClick = (langCode: string, location: string) => {
  // Track with dataLayer for GTM
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: 'cta_click',
      language: langCode,
      button_location: location,
    });
  }

  // Track with Facebook Pixel
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'Lead', {
      content_name: `CTA Click ${langCode.toUpperCase()}`,
      language: langCode,
      location: location,
    });
  }

  // Save UTM data and language
  const urlParams = new URLSearchParams(window.location.search);
  const utmData = {
    source: urlParams.get('utm_source'),
    medium: urlParams.get('utm_medium'),
    campaign: urlParams.get('utm_campaign'),
    content: urlParams.get('utm_content'),
    term: urlParams.get('utm_term'),
    language: langCode,
    landingPage: window.location.pathname,
    timestamp: new Date().toISOString(),
  };
  
  localStorage.setItem('acquisition_data', JSON.stringify(utmData));
};
