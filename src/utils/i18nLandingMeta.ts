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
  geo?: {
    region: string;
    placename: string;
  };
}

export const landingMeta: Record<string, LandingMeta> = {
  en: {
    title: 'Trade With Clarity and Control | AI Crypto Trading Journal',
    description: 'AI helps you upload trades faster, see patterns, and improve decisions. No APIs. No exchange connections. Full privacy. Track trades with clarity.',
    keywords: 'crypto trading journal, crypto trading log, crypto trade tracker, crypto trade history, trading performance, trade review tools, cryptocurrency trade analysis, trading diary, manual trade entry, screenshot trade uploads, trade error tracking, trading psychology',
    canonical: 'https://www.thetradingdiary.com/',
    ogTitle: 'Trade With Clarity and Control',
    ogDescription: 'AI helps you upload trades faster, see patterns, and improve decisions. No APIs. Full privacy.',
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
    geo: {
      region: 'US',
      placename: 'United States'
    }
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
    geo: {
      region: 'BR',
      placename: 'Brazil'
    }
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
    geo: {
      region: 'ES',
      placename: 'Spain'
    }
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
    geo: {
      region: 'AE',
      placename: 'United Arab Emirates'
    }
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
    geo: {
      region: 'VN',
      placename: 'Vietnam'
    }
  },
};

export const getLandingStructuredData = (langCode: string) => {
  const meta = landingMeta[langCode];
  if (!meta) return null;

  // Organization Schema
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "The Trading Diary",
    "url": "https://www.thetradingdiary.com",
    "logo": "https://www.thetradingdiary.com/logo.png",
    "description": "AI-powered crypto trading journal for tracking, analyzing, and improving trading performance"
  };

  // Software Application Schema
  const softwareData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "The Trading Diary",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "offers": [
      {
        "@type": "Offer",
        "name": "Starter Plan",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Free plan with 5 AI Extracts and unlimited manual uploads"
      },
      {
        "@type": "Offer",
        "name": "Pro Plan",
        "price": "18",
        "priceCurrency": "USD",
        "description": "Professional plan with 30 AI Extracts per month and custom dashboard"
      },
      {
        "@type": "Offer",
        "name": "Elite Plan",
        "price": "30",
        "priceCurrency": "USD",
        "description": "Elite plan with unlimited AI Extracts and priority support"
      }
    ],
    "featureList": "AI trade extraction, Screenshot uploads, Anti-duplicate detection, Advanced charts, Journal with emotional tracking, Market sentiment analysis, Exchange fee comparison, Wealth forecast, Risk calculator, Tax report export",
    "inLanguage": meta.lang
  };

  return { organizationData, softwareData };
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
