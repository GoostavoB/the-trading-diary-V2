/**
 * SEO helper utilities for dynamic meta tags and structured data
 */

interface MetaTag {
  name?: string;
  property?: string;
  content: string;
}

export interface PageMeta {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  robots?: string;
}

/**
 * Update page meta tags dynamically
 */


/**
 * Add structured data (JSON-LD) to page
 */
export const addStructuredData = (data: object, id: string = 'structured-data') => {
  // Remove existing script if present
  const existingScript = document.getElementById(id);
  if (existingScript) {
    existingScript.remove();
  }

  // Create new script tag
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

/**
 * Generate breadcrumb structured data
 */
export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

/**
 * Generate Article schema for blog posts
 */
export const generateArticleSchema = (article: {
  title: string;
  description: string;
  author: string;
  date: string;
  canonical: string;
  image?: string;
  keywords?: string;
}) => {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.description,
    "image": article.image || "https://www.thetradingdiary.com/og-image-en.png",
    "author": {
      "@type": "Person",
      "name": article.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "The Trading Diary",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.thetradingdiary.com/og-image-en.png"
      }
    },
    "datePublished": article.date,
    "dateModified": article.date,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": article.canonical
    },
    "keywords": article.keywords || ""
  };
};

/**
 * Generate Blog schema for blog listing page
 */
export const generateBlogSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "The Trading Diary Blog",
    "description": "Expert insights on crypto trading, AI-powered tools, trading psychology, risk management, and data-driven strategies.",
    "url": "https://www.thetradingdiary.com/blog",
    "publisher": {
      "@type": "Organization",
      "name": "The Trading Diary",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.thetradingdiary.com/og-image-en.png"
      }
    }
  };
};

/**
 * Generate HowTo schema for tutorial articles
 */
export const generateHowToSchema = (article: {
  title: string;
  description: string;
  image?: string;
  steps: Array<{ name: string; text: string }>;
}) => {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": article.title,
    "description": article.description,
    "image": article.image || "https://www.thetradingdiary.com/og-image-en.png",
    "step": article.steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text
    }))
  };
};

/**
 * Generate SoftwareApplication schema
 */
export const generateSoftwareApplicationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "The Trading Diary",
    "description": "Track, analyze, and review every crypto trade with AI. Built exclusively for crypto traders with advanced analytics and automated insights.",
    "url": "https://www.thetradingdiary.com",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web Browser, iOS, Android",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "screenshot": "https://www.thetradingdiary.com/og-image-en.png",
    "featureList": [
      "AI-powered trade analysis",
      "Multi-exchange support",
      "Advanced analytics dashboard",
      "Automated trade import",
      "Risk management tools",
      "Performance tracking"
    ],
    "author": {
      "@type": "Organization",
      "name": "The Trading Diary"
    }
  };
};

/**
 * Generate individual Review schema
 */
export const generateReviewSchema = (review: {
  author: string;
  rating: number;
  reviewBody: string;
  datePublished: string;
}) => {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": "SoftwareApplication",
      "name": "The Trading Diary"
    },
    "author": {
      "@type": "Person",
      "name": review.author
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.rating,
      "bestRating": "5",
      "worstRating": "1"
    },
    "reviewBody": review.reviewBody,
    "datePublished": review.datePublished
  };
};

/**
 * Page-specific meta configurations
 */
export const pageMeta = {
  dashboard: {
    title: 'Dashboard - The Trading Diary',
    description: 'Your personalized trading analytics dashboard with real-time performance tracking and insights.',
    keywords: 'trading dashboard, analytics, performance tracking, trading metrics',
    canonical: 'https://www.thetradingdiary.com/dashboard',
    robots: 'noindex,nofollow',
  },
  upload: {
    title: 'Upload Trades - The Trading Diary',
    description: 'Upload and analyze your trading data with our advanced trade import system.',
    keywords: 'upload trades, import trades, trade data, csv import',
    canonical: 'https://www.thetradingdiary.com/upload',
    robots: 'noindex,nofollow',
  },
  analytics: {
    title: 'Advanced Analytics - The Trading Diary',
    description: 'Deep dive into your trading performance with comprehensive analytics and visualizations.',
    keywords: 'trading analytics, performance analysis, trading statistics, trade insights',
    canonical: 'https://www.thetradingdiary.com/analytics',
    robots: 'noindex,nofollow',
  },
  tools: {
    title: 'Trading Tools - The Trading Diary',
    description: 'Access powerful trading tools including risk calculators, forecasts, and market data.',
    keywords: 'trading tools, risk calculator, trading forecast, market analysis',
    canonical: 'https://www.thetradingdiary.com/tools',
    robots: 'noindex,nofollow',
  },
  journal: {
    title: 'Trading Journal - The Trading Diary',
    description: 'Log your trade notes, reflections, and lessons learned to continuously improve your trading.',
    keywords: 'trading journal, trade notes, trading diary, performance log',
    canonical: 'https://www.thetradingdiary.com/journal',
    robots: 'noindex,nofollow',
  },
  riskManagement: {
    title: 'Risk Management - The Trading Diary',
    description: 'Calculate position sizes, stop-losses, leverage, and drawdown to protect your trading capital.',
    keywords: 'risk management, position sizing, stop loss calculator, leverage calculator',
    canonical: 'https://www.thetradingdiary.com/risk-management',
    robots: 'noindex,nofollow',
  },
  reports: {
    title: 'AI Reports - The Trading Diary',
    description: 'Generate AI-powered trading performance reports to understand your strengths and weaknesses.',
    keywords: 'trading reports, performance report, AI analysis, trading review',
    canonical: 'https://www.thetradingdiary.com/reports',
    robots: 'noindex,nofollow',
  },
  tradingPlan: {
    title: 'Trading Plan - The Trading Diary',
    description: 'Create and follow your structured trading strategy with checklists and plan templates.',
    keywords: 'trading plan, trading strategy, trading checklist, trade rules',
    canonical: 'https://www.thetradingdiary.com/trading-plan',
    robots: 'noindex,nofollow',
  },
  goals: {
    title: 'Trading Goals - The Trading Diary',
    description: 'Set and track your trading objectives including win rate, profit targets, and growth milestones.',
    keywords: 'trading goals, profit targets, trading objectives, performance goals',
    canonical: 'https://www.thetradingdiary.com/goals',
    robots: 'noindex,nofollow',
  },
  psychology: {
    title: 'Trading Psychology - The Trading Diary',
    description: 'Track your emotional state and discipline to improve your trading psychology and mental game.',
    keywords: 'trading psychology, emotional trading, trading mindset, discipline',
    canonical: 'https://www.thetradingdiary.com/psychology',
    robots: 'noindex,nofollow',
  },
  feeAnalysis: {
    title: 'Fee Analysis - The Trading Diary',
    description: 'Analyze your trading costs and commissions to maximize net profitability.',
    keywords: 'trading fees, commission analysis, cost efficiency, trading costs',
    canonical: 'https://www.thetradingdiary.com/fee-analysis',
    robots: 'noindex,nofollow',
  },
  taxReports: {
    title: 'Tax Reports - The Trading Diary',
    description: 'Generate tax-ready reports for your crypto trading activity.',
    keywords: 'crypto tax, trading tax report, capital gains, trading taxes',
    canonical: 'https://www.thetradingdiary.com/tax-reports',
    robots: 'noindex,nofollow',
  },
  forecast: {
    title: 'Forecast - The Trading Diary',
    description: 'Project your future trading growth with scenario-based forecasting tools.',
    keywords: 'trading forecast, growth projection, trading simulator, goal planning',
    canonical: 'https://www.thetradingdiary.com/forecast',
    robots: 'noindex,nofollow',
  },
  // App pages
  achievements: {
    title: 'Achievements - The Trading Diary',
    description: 'Track your trading milestones, badges, and accomplishments.',
    keywords: 'trading achievements, trading badges, trading milestones',
    canonical: 'https://www.thetradingdiary.com/achievements',
    robots: 'noindex,nofollow',
  },
  myMetrics: {
    title: 'My Metrics - The Trading Diary',
    description: 'Deep dive into your personal trading performance metrics and KPIs.',
    keywords: 'trading metrics, performance KPIs, trading statistics',
    canonical: 'https://www.thetradingdiary.com/my-metrics',
    robots: 'noindex,nofollow',
  },
  settings: {
    title: 'Settings - The Trading Diary',
    description: 'Manage your account preferences, display settings, and integrations.',
    keywords: 'account settings, trading preferences, profile settings',
    canonical: 'https://www.thetradingdiary.com/settings',
    robots: 'noindex,nofollow',
  },
  accounts: {
    title: 'Accounts - The Trading Diary',
    description: 'Manage your connected trading accounts and exchange integrations.',
    keywords: 'trading accounts, exchange accounts, portfolio accounts',
    canonical: 'https://www.thetradingdiary.com/accounts',
    robots: 'noindex,nofollow',
  },
  errorAnalytics: {
    title: 'Error Analytics - The Trading Diary',
    description: 'Identify and analyze your most common trading mistakes to improve future performance.',
    keywords: 'trading errors, mistake analysis, trading improvement',
    canonical: 'https://www.thetradingdiary.com/error-analytics',
    robots: 'noindex,nofollow',
  },
  progressAnalytics: {
    title: 'Progress Analytics - The Trading Diary',
    description: 'Track your improvement over time with detailed progress analytics.',
    keywords: 'trading progress, skill development, performance improvement',
    canonical: 'https://www.thetradingdiary.com/progress-analytics',
    robots: 'noindex,nofollow',
  },
  leaderboard: {
    title: 'Leaderboard - The Trading Diary',
    description: 'See how your trading performance compares to the community.',
    keywords: 'trading leaderboard, top traders, community rankings',
    canonical: 'https://www.thetradingdiary.com/leaderboard',
    robots: 'noindex,nofollow',
  },
  social: {
    title: 'Social - The Trading Diary',
    description: 'Connect with other traders, share insights, and learn from the community.',
    keywords: 'trading community, social trading, trader network',
    canonical: 'https://www.thetradingdiary.com/social',
    robots: 'noindex,nofollow',
  },
  socialFeed: {
    title: 'Social Feed - The Trading Diary',
    description: 'Follow top traders, see their trades, and engage with the community feed.',
    keywords: 'trading social feed, trader updates, community feed',
    canonical: 'https://www.thetradingdiary.com/social-feed',
    robots: 'noindex,nofollow',
  },
  tradeAnalysis: {
    title: 'Trade Analysis - The Trading Diary',
    description: 'Detailed analysis of individual trades and setups.',
    keywords: 'trade analysis, setup review, trade breakdown',
    canonical: 'https://www.thetradingdiary.com/trade-analysis',
    robots: 'noindex,nofollow',
  },
  marketData: {
    title: 'Market Data - The Trading Diary',
    description: 'Live crypto market data, prices, and trends.',
    keywords: 'crypto market data, live prices, market overview',
    canonical: 'https://www.thetradingdiary.com/market-data',
    robots: 'noindex,nofollow',
  },
  economicCalendar: {
    title: 'Economic Calendar - The Trading Diary',
    description: 'Stay on top of major macro events and market-moving news.',
    keywords: 'economic calendar, market events, macro news',
    canonical: 'https://www.thetradingdiary.com/economic-calendar',
    robots: 'noindex,nofollow',
  },
  longShortRatio: {
    title: 'Long/Short Ratio - The Trading Diary',
    description: 'Real-time long/short ratio data across major crypto exchanges.',
    keywords: 'long short ratio, market sentiment, crypto positions',
    canonical: 'https://www.thetradingdiary.com/long-short-ratio',
    robots: 'noindex,nofollow',
  },
  exchangeConnections: {
    title: 'Exchange Connections - The Trading Diary',
    description: 'Connect and manage your crypto exchange API integrations.',
    keywords: 'exchange API, exchange connection, crypto integration',
    canonical: 'https://www.thetradingdiary.com/exchange-connections',
    robots: 'noindex,nofollow',
  },
  performanceAlerts: {
    title: 'Performance Alerts - The Trading Diary',
    description: 'Set smart alerts for your trading performance thresholds and goals.',
    keywords: 'trading alerts, performance notifications, trade alerts',
    canonical: 'https://www.thetradingdiary.com/performance-alerts',
    robots: 'noindex,nofollow',
  },
  spotWallet: {
    title: 'Spot Wallet - The Trading Diary',
    description: 'Track your spot holdings and wallet balances across exchanges.',
    keywords: 'spot wallet, crypto holdings, portfolio tracker',
    canonical: 'https://www.thetradingdiary.com/spot-wallet',
    robots: 'noindex,nofollow',
  },
  capitalManagement: {
    title: 'Capital Management - The Trading Diary',
    description: 'Manage your trading capital allocation and withdrawal strategy.',
    keywords: 'capital management, fund allocation, trading capital',
    canonical: 'https://www.thetradingdiary.com/capital-management',
    robots: 'noindex,nofollow',
  },
  learn: {
    title: 'Learn Trading - The Trading Diary',
    description: 'Structured trading lessons covering risk management, technical analysis, psychology, and crypto-specific strategies.',
    keywords: 'trading lessons, learn trading, trading education, crypto trading course',
    canonical: 'https://www.thetradingdiary.com/learn',
    robots: 'noindex,nofollow',
  },
  userGuide: {
    title: 'User Guide - The Trading Diary',
    description: 'Complete guide to using The Trading Diary — importing trades, reading analytics, setting alerts, and more.',
    keywords: 'trading diary guide, how to use, user manual, help',
    canonical: 'https://www.thetradingdiary.com/user-guide',
    robots: 'noindex,nofollow',
  },
  // Public marketing pages
  features: {
    title: 'Features - The #1 Crypto Trading Journal | The Trading Diary',
    description: 'Explore all features: AI trade analysis, multi-exchange support, advanced analytics, risk management tools, psychology tracking, and more.',
    keywords: 'crypto trading journal features, trading analytics, AI trading tools, risk management, trading psychology',
    canonical: 'https://www.thetradingdiary.com/features',
  },
  howItWorks: {
    title: 'How It Works - Import, Analyze, Improve | The Trading Diary',
    description: 'See how The Trading Diary works: import trades via CSV or screenshot, get AI-powered insights, and continuously improve your performance.',
    keywords: 'how trading journal works, trade import, trading analytics setup, crypto trade tracking',
    canonical: 'https://www.thetradingdiary.com/how-it-works',
  },
  testimonials: {
    title: 'What Traders Say - Reviews & Testimonials | The Trading Diary',
    description: 'Read what crypto traders say about The Trading Diary. Real reviews from day traders, swing traders, and crypto investors.',
    keywords: 'trading journal reviews, crypto trader testimonials, trading diary feedback',
    canonical: 'https://www.thetradingdiary.com/testimonials',
  },
  faqPage: {
    title: 'Frequently Asked Questions | The Trading Diary',
    description: 'Find answers to common questions about The Trading Diary — pricing, supported exchanges, data security, and how to get started.',
    keywords: 'trading journal FAQ, crypto trading questions, trading diary help',
    canonical: 'https://www.thetradingdiary.com/faq',
  },
  privacy: {
    title: 'Privacy Policy | The Trading Diary',
    description: 'Read The Trading Diary\'s privacy policy and learn how we protect your trading data.',
    keywords: 'privacy policy, data protection, trading data security',
    canonical: 'https://www.thetradingdiary.com/privacy',
  },
  terms: {
    title: 'Terms of Service | The Trading Diary',
    description: 'Read the Terms of Service for The Trading Diary platform.',
    keywords: 'terms of service, user agreement, trading platform terms',
    canonical: 'https://www.thetradingdiary.com/terms',
  },
  cookiePolicy: {
    title: 'Cookie Policy | The Trading Diary',
    description: 'Learn how The Trading Diary uses cookies and how to manage your preferences.',
    keywords: 'cookie policy, privacy cookies, tracking preferences',
    canonical: 'https://www.thetradingdiary.com/cookie-policy',
  },
  changelog: {
    title: 'Changelog - New Features & Updates | The Trading Diary',
    description: 'Stay up to date with the latest features, improvements, and bug fixes in The Trading Diary.',
    keywords: 'trading journal updates, new features, changelog, release notes',
    canonical: 'https://www.thetradingdiary.com/changelog',
  },
  support: {
    title: 'Support & Help Center | The Trading Diary',
    description: 'Get help with The Trading Diary. Contact support, browse FAQs, and find answers to your questions.',
    keywords: 'trading journal support, help center, customer support, contact',
    canonical: 'https://www.thetradingdiary.com/support',
  },
  cryptoTradingFaq: {
    title: 'Crypto Trading FAQ — Expert Answers | The Trading Diary',
    description: 'Expert answers to the most common crypto trading questions. Learn about strategies, risk management, trading psychology, and more.',
    keywords: 'crypto trading FAQ, trading questions, crypto strategy, trading education',
    canonical: 'https://www.thetradingdiary.com/crypto-trading-faq',
  },
  about: {
    title: 'About Us — Built by Traders, for Traders | The Trading Diary',
    description: 'Meet the team behind The Trading Diary and learn about our mission to help crypto traders improve performance with AI-powered analytics and insights.',
    keywords: 'about the trading diary, trading diary team, our mission, crypto trading platform, built by traders',
    canonical: 'https://www.thetradingdiary.com/about',
  },
  contact: {
    title: 'Contact The Trading Diary — Get Help Fast',
    description: 'Contact The Trading Diary support team. Get help with account questions, technical issues, partnerships, feedback, and everything else.',
    keywords: 'contact the trading diary, support, help, customer service, crypto trading journal support',
    canonical: 'https://www.thetradingdiary.com/contact',
  },
  legal: {
    title: 'Legal Information — Terms, Privacy & Cookies | The Trading Diary',
    description: 'Legal documents for The Trading Diary, including Terms of Service, Privacy Policy, and Cookie Policy. Everything you need to know about using our platform.',
    keywords: 'legal, terms, privacy policy, cookie policy, disclaimer, user agreement',
    canonical: 'https://www.thetradingdiary.com/legal',
  },
  blog: {
    title: 'Crypto Trading Blog — Strategies, Psychology & Analytics | The Trading Diary',
    description: 'Expert articles on crypto trading, AI-powered tools, trading psychology, risk management, and data-driven strategies — from real traders, for real traders.',
    keywords: 'crypto trading blog, trading articles, crypto strategy, trading psychology, trading analytics, data-driven trading',
    canonical: 'https://www.thetradingdiary.com/blog',
  },
  author: {
    title: 'Author Profile | The Trading Diary',
    description: 'Read the latest articles from our crypto trading experts and authors on The Trading Diary blog.',
    keywords: 'author, blog author, crypto trading writer, the trading diary contributor',
    canonical: 'https://www.thetradingdiary.com/author',
  },
  sitemap: {
    title: 'Sitemap — Find Every Page | The Trading Diary',
    description: 'Complete sitemap of The Trading Diary. Find every blog article, feature page, and resource in one place.',
    keywords: 'sitemap, site navigation, all pages, the trading diary index',
    canonical: 'https://www.thetradingdiary.com/sitemap',
  },
};
