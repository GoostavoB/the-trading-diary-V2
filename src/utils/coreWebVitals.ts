/**
 * Core Web Vitals Optimization Utilities
 * Implements performance monitoring and optimization techniques
 */

// Report Web Vitals to analytics
export const reportWebVitals = (onPerfEntry?: (metric: any) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS(onPerfEntry);
      onINP(onPerfEntry); // INP replaced FID in web-vitals v4
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
    });
  }
};

// Lazy load images with Intersection Observer
export const setupLazyLoading = () => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll('img.lazy').forEach(img => {
      imageObserver.observe(img);
    });
  }
};

// Preload critical fonts
export const preloadCriticalFonts = () => {
  const fonts = [
    '/fonts/inter-var.woff2',
    '/fonts/inter-var-latin.woff2'
  ];

  fonts.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.href = font;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// Optimize third-party scripts
export const deferNonCriticalScripts = () => {
  const scripts = document.querySelectorAll('script[data-defer]');
  
  scripts.forEach(script => {
    const newScript = document.createElement('script');
    newScript.src = script.getAttribute('src') || '';
    newScript.defer = true;
    script.parentNode?.replaceChild(newScript, script);
  });
};

// Prefetch important routes
export const prefetchRoutes = (routes: string[]) => {
  routes.forEach(route => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  });
};

// Monitor and log Core Web Vitals
export const monitorCoreWebVitals = () => {
  reportWebVitals((metric) => {
    console.log(`[Core Web Vital] ${metric.name}:`, metric.value);
    
    // Send to analytics if available
    if (window.gtag) {
      window.gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    }
  });
};

// Optimize images - convert to modern formats
export const optimizeImageLoading = () => {
  // Check for WebP support
  const supportsWebP = () => {
    const elem = document.createElement('canvas');
    if (elem.getContext && elem.getContext('2d')) {
      return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    return false;
  };

  if (supportsWebP()) {
    document.documentElement.classList.add('webp');
  }
};

// Resource hints for critical resources
export const addResourceHints = () => {
  const hints = [
    { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },
    { rel: 'preconnect', href: 'https://www.googletagmanager.com' },
  ];

  hints.forEach(hint => {
    const link = document.createElement('link');
    link.rel = hint.rel;
    link.href = hint.href;
    if (hint.rel === 'preconnect') {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  });
};

// Initialize all Core Web Vitals optimizations
export const initCoreWebVitals = () => {
  // Monitor metrics
  monitorCoreWebVitals();
  
  // Setup lazy loading
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLazyLoading);
  } else {
    setupLazyLoading();
  }
  
  // Optimize image loading
  optimizeImageLoading();
  
  // Add resource hints
  addResourceHints();
  
  // Defer non-critical scripts
  if (document.readyState === 'complete') {
    deferNonCriticalScripts();
  } else {
    window.addEventListener('load', deferNonCriticalScripts);
  }
  
  // Prefetch important routes
  prefetchRoutes(['/auth', '/pricing', '/blog']);
};

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
