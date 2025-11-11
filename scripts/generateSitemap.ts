#!/usr/bin/env node
/**
 * Dynamic Sitemap Generator
 * Generates sitemap.xml with up-to-date blog articles and pages
 * Run: npm run generate-sitemap
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

// Import blog articles data
// Note: Update this list when adding new blog posts
const blogArticles = [
  {
    slug: 'best-crypto-trading-journal-2025',
    lastmod: '2025-11-11',
  },
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
  // Home & Main Pages
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/auth', priority: '0.8', changefreq: 'monthly' },
  { loc: '/pricing', priority: '0.9', changefreq: 'monthly' },
  { loc: '/features', priority: '0.9', changefreq: 'monthly' },
  { loc: '/how-it-works', priority: '0.8', changefreq: 'monthly' },
  { loc: '/about', priority: '0.7', changefreq: 'monthly' },
  { loc: '/contact', priority: '0.7', changefreq: 'monthly' },
  { loc: '/testimonials', priority: '0.7', changefreq: 'weekly' },
  { loc: '/changelog', priority: '0.6', changefreq: 'weekly' },

  // Blog
  { loc: '/blog', priority: '0.8', changefreq: 'weekly' },

  // Comparison Pages (High SEO Value)
  { loc: '/vs-tradersync', priority: '0.8', changefreq: 'monthly' },
  { loc: '/vs-tradezella', priority: '0.8', changefreq: 'monthly' },
  { loc: '/vs-excel', priority: '0.8', changefreq: 'monthly' },

  // Legal Pages
  { loc: '/terms', priority: '0.5', changefreq: 'monthly' },
  { loc: '/privacy', priority: '0.5', changefreq: 'monthly' },
  { loc: '/cookie-policy', priority: '0.4', changefreq: 'monthly' },

  // Tools & Resources
  { loc: '/crypto-trading-faq', priority: '0.7', changefreq: 'weekly' },
  { loc: '/sitemap', priority: '0.5', changefreq: 'weekly' },
  { loc: '/logo-download', priority: '0.5', changefreq: 'yearly' },
];

// Removed multilanguage support - now English only

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

`;

  // Add all static pages
  staticPages.forEach(page => {
    xml += `  <url>
    <loc>https://www.thetradingdiary.com${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>

`;
  });

  // Add blog articles
  blogArticles.forEach(article => {
    xml += `  <!-- Blog: ${article.slug} -->
  <url>
    <loc>https://www.thetradingdiary.com/blog/${article.slug}</loc>
    <lastmod>${article.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
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
