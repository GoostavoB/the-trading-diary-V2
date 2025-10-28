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
