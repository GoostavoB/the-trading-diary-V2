/**
 * SEO Monitoring and Tracking Utilities
 * Monitor key SEO metrics and track improvements
 */

export interface SEOMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
}

export interface PageSEOHealth {
  url: string;
  title: string;
  description: string;
  hasCanonical: boolean;
  hasStructuredData: boolean;
  imageCount: number;
  imagesWithAlt: number;
  headingStructure: { h1: number; h2: number; h3: number };
  internalLinks: number;
  externalLinks: number;
  metrics: Partial<SEOMetrics>;
}

/**
 * Get Core Web Vitals metrics
 */
export async function getCoreWebVitals(): Promise<Partial<SEOMetrics>> {
  const metrics: Partial<SEOMetrics> = {};

  // Use Performance API if available
  if ('performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      metrics.timeToInteractive = navigation.domInteractive - navigation.fetchStart;
    }

    // Get paint timings
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
    if (fcp) {
      metrics.firstContentfulPaint = fcp.startTime;
    }

    // Try to get LCP and CLS from PerformanceObserver
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        metrics.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      const clsObserver = new PerformanceObserver((entryList) => {
        let cls = 0;
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value;
          }
        }
        metrics.cumulativeLayoutShift = cls;
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('Performance Observer not fully supported', e);
    }
  }

  return metrics;
}

/**
 * Analyze current page SEO health
 */
export function analyzePageSEO(): PageSEOHealth {
  const title = document.title;
  const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  const canonical = document.querySelector('link[rel="canonical"]');
  const structuredData = document.querySelectorAll('script[type="application/ld+json"]');
  
  const images = Array.from(document.querySelectorAll('img'));
  const imagesWithAlt = images.filter((img) => img.alt && img.alt.trim().length > 0);
  
  const h1Count = document.querySelectorAll('h1').length;
  const h2Count = document.querySelectorAll('h2').length;
  const h3Count = document.querySelectorAll('h3').length;
  
  const allLinks = Array.from(document.querySelectorAll('a[href]'));
  const internalLinks = allLinks.filter((link) => {
    const href = link.getAttribute('href') || '';
    return href.startsWith('/') || href.includes(window.location.hostname);
  });
  const externalLinks = allLinks.filter((link) => {
    const href = link.getAttribute('href') || '';
    return href.startsWith('http') && !href.includes(window.location.hostname);
  });

  return {
    url: window.location.href,
    title,
    description,
    hasCanonical: !!canonical,
    hasStructuredData: structuredData.length > 0,
    imageCount: images.length,
    imagesWithAlt: imagesWithAlt.length,
    headingStructure: { h1: h1Count, h2: h2Count, h3: h3Count },
    internalLinks: internalLinks.length,
    externalLinks: externalLinks.length,
    metrics: {},
  };
}

/**
 * Generate SEO report
 */
export async function generateSEOReport(): Promise<PageSEOHealth> {
  const health = analyzePageSEO();
  const metrics = await getCoreWebVitals();
  
  return {
    ...health,
    metrics,
  };
}

/**
 * Log SEO report to console (development only)
 */
export async function logSEOReport(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') return;

  const report = await generateSEOReport();
  
  console.group('📊 SEO Health Report');
  console.log('URL:', report.url);
  console.log('Title:', report.title, `(${report.title.length} chars)`);
  console.log('Description:', report.description, `(${report.description.length} chars)`);
  console.log('Canonical:', report.hasCanonical ? '✅' : '❌');
  console.log('Structured Data:', report.hasStructuredData ? '✅' : '❌');
  console.log(`Images: ${report.imagesWithAlt}/${report.imageCount} with alt text`);
  console.log('Headings:', report.headingStructure);
  console.log(`Links: ${report.internalLinks} internal, ${report.externalLinks} external`);
  
  if (Object.keys(report.metrics).length > 0) {
    console.group('Core Web Vitals');
    console.table(report.metrics);
    console.groupEnd();
  }
  
  console.groupEnd();
}

/**
 * Track SEO improvements over time
 */
export function trackSEOMetrics(pageName: string, metrics: Partial<SEOMetrics>): void {
  const key = `seo_metrics_${pageName}`;
  const history = JSON.parse(localStorage.getItem(key) || '[]');
  
  history.push({
    timestamp: new Date().toISOString(),
    ...metrics,
  });
  
  // Keep only last 30 entries
  if (history.length > 30) {
    history.shift();
  }
  
  localStorage.setItem(key, JSON.stringify(history));
}

/**
 * Get SEO metrics history
 */
export function getSEOMetricsHistory(pageName: string): Array<Partial<SEOMetrics> & { timestamp: string }> {
  const key = `seo_metrics_${pageName}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
}

/**
 * Initialize SEO monitoring (call on app initialization)
 */
export async function initSEOMonitoring(): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    // Log report in development
    setTimeout(() => {
      logSEOReport();
    }, 2000);
  }
  
  // Track metrics for analytics
  const metrics = await getCoreWebVitals();
  const pageName = window.location.pathname.replace(/\//g, '_') || 'home';
  trackSEOMetrics(pageName, metrics);
}
