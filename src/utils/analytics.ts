/**
 * Analytics utilities for tracking user interactions
 * Google Analytics 4 Integration
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export type EventCategory = 
  | 'engagement'
  | 'conversion'
  | 'navigation'
  | 'trading'
  | 'content'
  | 'social';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

class Analytics {
  private enabled = false;
  private queue: AnalyticsEvent[] = [];

  /**
   * Initialize analytics
   */
  init() {
    if (import.meta.env.PROD) {
      this.enabled = true;
      this.flushQueue();
    }
  }

  /**
   * Track an event
   */
  track(event: string, properties?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
    };

    if (this.enabled) {
      this.sendEvent(analyticsEvent);
    } else {
      this.queue.push(analyticsEvent);
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.log('[Analytics]', event, properties);
    }
  }

  /**
   * Track page view
   */
  page(path: string, properties?: Record<string, any>) {
    this.track('page_view', { path, ...properties });
  }

  /**
   * Identify user
   */
  identify(userId: string, traits?: Record<string, any>) {
    this.track('identify', { userId, ...traits });
  }

  /**
   * Track performance metric
   */
  performance(metric: string, value: number, properties?: Record<string, any>) {
    this.track('performance', {
      metric,
      value,
      ...properties,
    });
  }

  /**
   * Track error
   */
  error(error: Error, context?: Record<string, any>) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }

  /**
   * Track article view
   */
  trackArticleView(articleSlug: string, articleTitle: string, category: string) {
    this.track('view_item', {
      content_type: 'article',
      item_id: articleSlug,
      item_name: articleTitle,
      item_category: category,
    });

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'view_item', {
        content_type: 'article',
        item_id: articleSlug,
        item_name: articleTitle,
        item_category: category,
      });
    }
  }

  /**
   * Track article reading progress
   */
  trackArticleProgress(articleSlug: string, progressPercent: number) {
    if (progressPercent === 25 || progressPercent === 50 || progressPercent === 75 || progressPercent === 100) {
      this.track('article_progress', {
        article_slug: articleSlug,
        progress_percent: progressPercent,
      });
    }
  }

  /**
   * Track custom event with category
   */
  trackEvent({ action, category, label, value, ...params }: {
    action: string;
    category: EventCategory;
    label?: string;
    value?: number;
    [key: string]: any;
  }) {
    this.track(action, {
      event_category: category,
      event_label: label,
      value: value,
      ...params,
    });

    if (typeof window.gtag === 'function') {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        ...params,
      });
    }
  }

  /**
   * Set user properties for segmentation
   */
  setUserProperties(properties: Record<string, any>) {
    if (typeof window.gtag === 'function') {
      window.gtag('set', 'user_properties', properties);
    }
    
    this.track('user_properties_set', properties);
  }

  /**
   * Send event to analytics service
   */
  private sendEvent(event: AnalyticsEvent) {
    // Google Analytics 4 via gtag
    if (typeof window.gtag === 'function') {
      window.gtag('event', event.event, event.properties);
    }
  }

  /**
   * Flush queued events
   */
  private flushQueue() {
    this.queue.forEach(event => this.sendEvent(event));
    this.queue = [];
  }
}

export const analytics = new Analytics();

// Export convenience functions
export const trackPageView = (path: string, title?: string) => analytics.page(path, { page_title: title });
export const trackArticleView = (slug: string, title: string, category: string) => 
  analytics.trackArticleView(slug, title, category);
