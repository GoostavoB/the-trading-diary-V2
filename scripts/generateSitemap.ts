#!/usr/bin/env node
/**
 * Dynamic Sitemap Generator
 * Generates sitemap.xml with up-to-date blog articles and pages
 * Run: npm run generate-sitemap
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

// Import blog articles data (English only)
const blogArticles = [
  {
    slug: 'ai-tools-for-crypto-trading',
    lastmod: '2025-10-22',
  },
  {
    slug: 'trading-journal-for-crypto',
    lastmod: '2025-10-20',
  },
  {
    slug: 'trading-psychology-control-emotions',
    lastmod: '2025-10-17',
  },
  {
    slug: 'data-driven-trading',
    lastmod: '2025-10-15',
  },
  {
    slug: 'ai-powered-trading-journal',
    lastmod: '2025-10-13',
  },
  {
    slug: 'journal-vs-excel',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-notion',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-google-sheets',
    lastmod: '2025-10-28',
  },
  {
    slug: 'integrations/binance-trading-journal',
    lastmod: '2025-10-28',
  },
  {
    slug: 'integrations/bybit-trading-journal',
    lastmod: '2025-10-28',
  },
  {
    slug: 'integrations/okx-trading-journal',
    lastmod: '2025-10-28',
  },
  {
    slug: 'integrations/coinbase-trading-journal',
    lastmod: '2025-10-28',
  },
  {
    slug: 'integrations/kraken-trading-journal',
    lastmod: '2025-10-28',
  },
  {
    slug: 'trading-journal/bybit-bitcoin',
    lastmod: '2025-10-28',
  },
  {
    slug: 'trading-journal/binance-ethereum',
    lastmod: '2025-10-28',
  },
  {
    slug: 'integrations/kucoin-trading-journal',
    lastmod: '2025-10-28',
  },
  {
    slug: 'integrations/tradingview-trading-journal',
    lastmod: '2025-10-28',
  },
  {
    slug: 'integrations/metatrader5-trading-journal',
    lastmod: '2025-10-28',
  },
  {
    slug: 'trading-journal/okx-bitcoin',
    lastmod: '2025-10-28',
  },
  {
    slug: 'trading-journal/kraken-ethereum',
    lastmod: '2025-10-28',
  },
  {
    slug: 'trading-journal/coinbase-bitcoin',
    lastmod: '2025-10-28',
  },
  {
    slug: 'trading-journal/binance-bitcoin',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/scalping-bitcoin',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/day-trading-ethereum',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/swing-trading-bitcoin',
    lastmod: '2025-10-28',
  },
  {
    slug: 'trading-journal/okx-ethereum',
    lastmod: '2025-10-28',
  },
  {
    slug: 'trading-journal/kraken-bitcoin',
    lastmod: '2025-10-28',
  },
  {
    slug: 'trading-journal/kucoin-ethereum',
    lastmod: '2025-10-28',
  },
  {
    slug: 'trading-journal/bybit-ethereum',
    lastmod: '2025-10-28',
  },
  {
    slug: 'trading-journal/binance-avalanche',
    lastmod: '2025-10-28',
  },
  {
    slug: 'trading-journal/okx-avalanche',
    lastmod: '2025-10-28',
  },
  {
    slug: 'trading-journal/coinbase-ethereum',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/breakout-bitcoin',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/grid-bots-bitcoin',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/copy-trading-ethereum',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-excel/bybit',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-notion/bybit',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-google-sheets/bybit',
    lastmod: '2025-10-28',
  },
  {
    slug: 'trading-journal/kucoin-bitcoin',
    lastmod: '2025-10-28',
  },
  {
    slug: 'trading-journal/kucoin-avalanche',
    lastmod: '2025-10-28',
  },
  {
    slug: 'trading-journal/kraken-avalanche',
    lastmod: '2025-10-28',
  },
  {
    slug: 'trading-journal/coinbase-avalanche',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/day-trading-bitcoin',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/scalping-ethereum',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-excel/binance',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-notion/binance',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-google-sheets/binance',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-excel/okx',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-notion/okx',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-google-sheets/okx',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-excel/kraken',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-notion/kraken',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-google-sheets/kraken',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-excel/kucoin',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-notion/kucoin',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-google-sheets/kucoin',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-excel/coinbase',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-notion/coinbase',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-google-sheets/coinbase',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-excel/tradingview',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-notion/tradingview',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-google-sheets/tradingview',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-excel/metatrader5',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-google-sheets/metatrader5',
    lastmod: '2025-10-28',
  },
  {
    slug: 'journal-vs-notion/metatrader5',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/dca-bitcoin',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/copy-trading-bitcoin',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/grid-bots-ethereum',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/breakout-ethereum',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/swing-trading-ethereum',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/day-trading-avalanche',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/scalping-avalanche',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/breakout-avalanche',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/copy-trading-avalanche',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/scalping-bitcoin-5min',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/scalping-bitcoin-15min',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/day-trading-bitcoin-1h',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/swing-trading-bitcoin-daily',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/breakout-bitcoin-4h',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/scalping-ethereum-5min',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/day-trading-ethereum-1h',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/swing-trading-ethereum-daily',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/breakout-ethereum-4h',
    lastmod: '2025-10-28',
  },
  {
    slug: 'strategy-tracker/grid-bots-ethereum-daily',
    lastmod: '2025-10-28',
  }
];

const staticPages = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/auth', priority: '0.8', changefreq: 'monthly' },
  { loc: '/pricing', priority: '0.9', changefreq: 'weekly' },
  { loc: '/contact', priority: '0.7', changefreq: 'monthly' },
  { loc: '/about', priority: '0.7', changefreq: 'monthly' },
  { loc: '/legal', priority: '0.5', changefreq: 'monthly' },
  { loc: '/terms', priority: '0.5', changefreq: 'monthly' },
  { loc: '/privacy', priority: '0.5', changefreq: 'monthly' },
  { loc: '/cookie-policy', priority: '0.5', changefreq: 'monthly' },
  { loc: '/blog', priority: '0.8', changefreq: 'weekly' },
  { loc: '/crypto-trading-faq', priority: '0.7', changefreq: 'monthly' },
  { loc: '/logo-download', priority: '0.5', changefreq: 'yearly' },
];

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  
`;

  // Add static pages
  staticPages.forEach(page => {
    xml += `  <url>
    <loc>https://www.thetradingdiary.com${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
  
`;
  });

  // Add blog articles (English only)
  blogArticles.forEach(article => {
    xml += `  <url>
    <loc>https://www.thetradingdiary.com/blog/${article.slug}</loc>
    <lastmod>${article.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
`;
  });

  xml += `</urlset>`;

  return xml;
}

// Generate and write sitemap
const sitemap = generateSitemap();
const outputPath = join(process.cwd(), 'public', 'sitemap.xml');

try {
  writeFileSync(outputPath, sitemap, 'utf8');
  console.log('✅ Sitemap generated successfully at:', outputPath);
  console.log(`📊 Total URLs: ${blogArticles.length + staticPages.length}`);
} catch (error) {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
}
